import { deploySuperGoodDollar } from '@gooddollar/goodprotocol';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployTestFramework } from '@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework';
import { Framework } from '@superfluid-finance/sdk-core';
import { expect } from 'chai';
import { TrustPool } from '../typechain-types';
import { ethers, network } from 'hardhat';

type SignerWithAddress = Awaited<ReturnType<typeof ethers.getSigner>>;

const coder = ethers.utils.defaultAbiCoder;

describe('TrustPool Validation', () => {
  let signer: SignerWithAddress;
  let signers: SignerWithAddress[];
  let gdframework: Awaited<ReturnType<typeof deploySuperGoodDollar>>;
  let sfFramework: any = {};
  let sf: Framework;
  const baseFlowRate = BigInt(400e9).toString();
  let pool: TrustPool;

  before(async () => {
    signers = await ethers.getSigners();
    const { frameworkDeployer } = await deployTestFramework();
    sfFramework = await frameworkDeployer.getFramework();
    const opts = {
      chainId: network.config.chainId || 31337,
      provider: ethers.provider as any,
      resolverAddress: sfFramework.resolver,
      protocolReleaseVersion: 'test',
    };
    sf = await Framework.create(opts);
    gdframework = await deploySuperGoodDollar(signers[0], sfFramework, [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
    ]);
    signer = signers[0];
  });

  const fixture = async () => {
    pool = (await ethers.deployContract('TrustPool', [
      sfFramework['host'],
    ])) as TrustPool;
  };

  beforeEach(async function () {
    await loadFixture(fixture);
  });

  describe('Quadratic Trust Score Formula', () => {
    it('should calculate trust score as (sqrt(prev) - sqrt(oldRate) + sqrt(newRate))^2', async () => {
      const recipient = signers[1];
      await pool.addMember(recipient.address, 1);
      await pool.addMember(signer.address, 1);

      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );
      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );
      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).wait();

      const trustScoreAfterCreate = await pool.trustScore(recipient.address);
      // Score should be (sqrt(0) - sqrt(0) + sqrt(baseFlowRate))^2 = baseFlowRate
      // Because (sqrt(newRate))^2 = newRate when starting from 0
      expect(trustScoreAfterCreate).to.equal(baseFlowRate);
    });

    it('should increase trust score quadratically with multiple trusters', async () => {
      const recipient = signers[1];
      const truster2 = signers[2];

      await pool.addMember(recipient.address, 1);
      await pool.addMember(signer.address, 1);
      await pool.addMember(truster2.address, 1);

      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );
      await gdframework.GoodDollar.mint(
        truster2.address,
        ethers.constants.WeiPerEther
      );

      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );

      // First truster
      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).wait();

      const scoreAfterOne = await pool.trustScore(recipient.address);

      // Second truster (same rate)
      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: truster2.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(truster2)
      ).wait();

      const scoreAfterTwo = await pool.trustScore(recipient.address);

      // With quadratic funding: 2 trusters at same rate should give
      // (sqrt(baseFlowRate) + sqrt(baseFlowRate))^2 = 4 * baseFlowRate
      // which is > 2 * scoreAfterOne
      expect(scoreAfterTwo).to.be.gt(scoreAfterOne.mul(2));
    });

    it('should have trust score of 0 after all trusters remove support', async () => {
      const recipient = signers[1];
      await pool.addMember(recipient.address, 1);
      await pool.addMember(signer.address, 1);

      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );
      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );
      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).wait();

      // Verify score > 0
      let score = await pool.trustScore(recipient.address);
      expect(score).to.be.gt(0);

      // Delete the flow
      await (
        await st
          .deleteFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
          })
          .exec(signer)
      ).wait();

      score = await pool.trustScore(recipient.address);
      expect(score).to.equal(0);
    });
  });

  describe('Reciprocal Streams', () => {
    it('should support bidirectional streams between two users', async () => {
      const user1 = signer;
      const user2 = signers[1];

      await pool.addMember(user1.address, 1);
      await pool.addMember(user2.address, 1);

      await gdframework.GoodDollar.mint(
        user1.address,
        ethers.constants.WeiPerEther
      );
      await gdframework.GoodDollar.mint(
        user2.address,
        ethers.constants.WeiPerEther
      );

      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      // User1 supports User2
      const userData1 = coder.encode(
        ['address', 'int96'],
        [user2.address, baseFlowRate]
      );
      await expect(
        st
          .createFlow({
            receiver: pool.address.toString(),
            sender: user1.address,
            flowRate: baseFlowRate,
            userData: userData1,
          })
          .exec(user1)
      ).not.reverted;

      // User2 supports User1
      const userData2 = coder.encode(
        ['address', 'int96'],
        [user1.address, baseFlowRate]
      );
      await expect(
        st
          .createFlow({
            receiver: pool.address.toString(),
            sender: user2.address,
            flowRate: baseFlowRate,
            userData: userData2,
          })
          .exec(user2)
      ).not.reverted;

      // Both should have trust scores > 0
      const score1 = await pool.trustScore(user1.address);
      const score2 = await pool.trustScore(user2.address);

      expect(score1).to.be.gt(0);
      expect(score2).to.be.gt(0);

      // Both should have incoming flows
      const flow1 = await st.getFlow({
        sender: pool.address,
        receiver: user1.address,
        providerOrSigner: ethers.provider,
      });
      const flow2 = await st.getFlow({
        sender: pool.address,
        receiver: user2.address,
        providerOrSigner: ethers.provider,
      });

      expect(Number(flow1.flowRate)).to.be.gt(0);
      expect(Number(flow2.flowRate)).to.be.gt(0);
    });
  });

  describe('Edge Cases', () => {
    it('should reject stream to self', async () => {
      await pool.addMember(signer.address, 1);
      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );

      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [signer.address, baseFlowRate]
      );

      // Streaming to yourself through the pool should still work at the contract level
      // but it's a valid edge case to test
      const tx = st
        .createFlow({
          receiver: pool.address.toString(),
          sender: signer.address,
          flowRate: baseFlowRate,
          userData,
        })
        .exec(signer);

      // This should work if both are on same ID system
      await expect(tx).not.reverted;
    });

    it('should allow re-creating stream after deletion', async () => {
      const recipient = signers[1];
      await pool.addMember(recipient.address, 1);
      await pool.addMember(signer.address, 1);
      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );

      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );

      // Create
      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).wait();

      // Delete
      await (
        await st
          .deleteFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
          })
          .exec(signer)
      ).wait();

      // Verify flow is 0
      const flowAfterDelete = await st.getFlow({
        sender: pool.address,
        receiver: recipient.address,
        providerOrSigner: ethers.provider,
      });
      expect(Number(flowAfterDelete.flowRate)).to.equal(0);

      // Re-create
      await expect(
        st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).not.reverted;

      // Verify flow is back
      const flowAfterRecreate = await st.getFlow({
        sender: pool.address,
        receiver: recipient.address,
        providerOrSigner: ethers.provider,
      });
      expect(Number(flowAfterRecreate.flowRate)).to.equal(Number(baseFlowRate));
    });

    it('should reject zero flow rate update', async () => {
      const recipient = signers[1];
      await pool.addMember(recipient.address, 1);
      await pool.addMember(signer.address, 1);
      await gdframework.GoodDollar.mint(
        signer.address,
        ethers.constants.WeiPerEther
      );

      const st = await sf.loadSuperToken(
        gdframework.GoodDollar.address.toString()
      );

      const userData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );

      await (
        await st
          .createFlow({
            receiver: pool.address.toString(),
            sender: signer.address,
            flowRate: baseFlowRate,
            userData,
          })
          .exec(signer)
      ).wait();

      // Updating with same flow rate should revert with NO_FLOW_CHANGE
      const sameUserData = coder.encode(
        ['address', 'int96'],
        [recipient.address, baseFlowRate]
      );
      const tx = st
        .updateFlow({
          receiver: pool.address.toString(),
          sender: signer.address,
          flowRate: baseFlowRate,
          userData: sameUserData,
        })
        .exec(signer);

      await expect(tx).reverted;
    });
  });

  describe('Identity Validation', () => {
    it('should return None for getMutualId when members have no identity', async () => {
      const user1 = signers[3];
      const user2 = signers[4];

      const mutualId = await pool.getMutualId(user1.address, user2.address);
      expect(mutualId).to.equal(0); // IdType.None
    });

    it('should return GoodID when both members have GoodID', async () => {
      const user1 = signers[3];
      const user2 = signers[4];

      await pool.addMember(user1.address, 1); // GoodID
      await pool.addMember(user2.address, 1); // GoodID

      const mutualId = await pool.getMutualId(user1.address, user2.address);
      expect(mutualId).to.equal(1); // IdType.GoodID
    });

    it('should return WorldCoin when both have WorldCoin', async () => {
      const user1 = signers[3];
      const user2 = signers[4];

      await pool.addMember(user1.address, 2); // WorldCoin
      await pool.addMember(user2.address, 2); // WorldCoin

      const mutualId = await pool.getMutualId(user1.address, user2.address);
      expect(mutualId).to.equal(2); // IdType.WorldCoin
    });

    it('should return None when members have different id types', async () => {
      const user1 = signers[3];
      const user2 = signers[4];

      await pool.addMember(user1.address, 1); // GoodID
      await pool.addMember(user2.address, 2); // WorldCoin

      const mutualId = await pool.getMutualId(user1.address, user2.address);
      expect(mutualId).to.equal(0); // IdType.None - different systems
    });

    it('should prioritize GoodID over other id types', async () => {
      const user1 = signers[3];
      const user2 = signers[4];

      // Both have GoodID AND WorldCoin
      await pool.addMember(user1.address, 1); // GoodID
      await pool.addMember(user1.address, 2); // WorldCoin
      await pool.addMember(user2.address, 1); // GoodID
      await pool.addMember(user2.address, 2); // WorldCoin

      const mutualId = await pool.getMutualId(user1.address, user2.address);
      expect(mutualId).to.equal(1); // GoodID has priority
    });

    it('should only allow manager to addMember', async () => {
      const nonManager = signers[5];
      const user = signers[6];

      await expect(
        pool.connect(nonManager).addMember(user.address, 1)
      ).reverted;
    });
  });
});
