// SPDX-License-Identifier: MIT
pragma solidity >=0.8;

import {CFASuperAppBase, ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFASuperAppBase.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import "hardhat/console.sol";

contract TrustPool is CFASuperAppBase {
    error NO_FLOW_CHANGE();

    using SuperTokenV1Library for ISuperToken;

    // ISuperfluid public constant SF_HOST =
    //     ISuperfluid(0xA4Ff07cF81C02CFD356184879D953970cA957585);

    enum IdType {
        None,
        GoodID,
        WorldCoin,
        Nouns,
        BrightID
    }

    struct Trust {
        address trustee;
        int96 flowRate;
        IdType idtype;
    }

    event TrustUpdated(
        address truster,
        address recipient,
        int96 newTrust,
        int96 totalTrusteeInFlow,
        int96 totalTrusterOutFlow,
        uint256 prevTrustScore,
        uint256 newTrustScore
    );
    mapping(bytes32 => Trust) public trusts;
    mapping(address => bytes32[]) public memberTrusts;
    mapping(IdType => mapping(address => bool)) public members;
    mapping(address => uint256) public trustScore;

    address manager;

    constructor(ISuperfluid host) CFASuperAppBase(host) {
        selfRegister(true, true, true);
        manager = msg.sender;
    }

    modifier onlyManager() {
        require(msg.sender == manager);
        _;
    }

    function isAcceptedSuperToken(
        ISuperToken /*superToken*/
    ) public view virtual override returns (bool) {
        return true; // Default implementation
    }

    function addMember(address member, IdType idtype) external onlyManager {
        members[idtype][member] = true;
    }

    function onFlowCreated(
        ISuperToken token,
        address sender,
        int96 /*flowRate*/,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory newCtx) {
        newCtx = ctx;
        newCtx = _updateTrust(token, sender, 0, newCtx);
    }

    function onFlowUpdated(
        ISuperToken token,
        address sender,
        int96 /*flowRate*/,
        int96 previousFlowRate,
        uint256 /*lastUpdated*/,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory newCtx) {
        newCtx = ctx;
        newCtx = _updateTrust(token, sender, previousFlowRate, newCtx);
    }

    function onInFlowDeleted(
        ISuperToken token,
        address sender,
        int96 previousFlowRate,
        uint256 /*lastUpdated*/,
        bytes calldata ctx
    ) internal virtual override returns (bytes memory newCtx) {
        newCtx = ctx;
        newCtx = _updateTrust(token, sender, previousFlowRate, newCtx);
    }

    function _updateTrust(
        ISuperToken token,
        address truster,
        int96 previousFlowRate,
        bytes memory ctx
    ) internal returns (bytes memory newCtx) {
        newCtx = ctx;
        // console.log("updating trust");

        (, int96 flowRate, , ) = token.getFlowInfo(truster, address(this));

        if (previousFlowRate == flowRate) revert NO_FLOW_CHANGE();
        // console.log("new flow rate %s", uint256(int256(flowRate)));
        if (flowRate == 0) return _deleteTrusts(token, truster, newCtx);

        (address recipient, int96 updateFlowTo) = abi.decode(
            HOST.decodeCtx(ctx).userData,
            (address, int96)
        );

        int96 diff = flowRate - previousFlowRate;
        // console.log("updating recipient flow");
        return
            _updateRecipientFlow(
                token,
                truster,
                recipient,
                diff,
                updateFlowTo,
                newCtx
            );
    }

    function _updateTrustScore(
        address recipient,
        int96 recipientPrevTrustRate,
        int96 recipientNewTrustRate
    ) internal returns (uint256 prevTrustScore, uint256 newTrustScore) {
        prevTrustScore = trustScore[recipient];
        newTrustScore =
            (Math.sqrt(prevTrustScore) -
                Math.sqrt(uint256(int256(recipientPrevTrustRate))) +
                Math.sqrt(uint256(int256(recipientNewTrustRate)))) **
                2;

        // console.log(
        //     "prev trust score: %s new score: %s",
        //     prevTrustScore,
        //     newTrustScore
        // );
        // console.log(
        //     "prev trust: %s new trust %s",
        //     uint256(int256(recipientPrevTrustRate)),
        //     uint256(int256(recipientNewTrustRate))
        // );
        trustScore[recipient] = newTrustScore;
    }

    function _updateRecipientFlow(
        ISuperToken token,
        address truster,
        address recipient,
        int96 diff,
        int96 updateFlowTo,
        bytes memory ctx
    ) internal returns (bytes memory newCtx) {
        newCtx = ctx;
        (, int96 flowRate, , ) = token.getFlowInfo(truster, address(this));

        (, int96 recipientPrevFlowRate, , ) = token.getFlowInfo(
            address(this),
            recipient
        );
        int96 recipientNewFlowRate = recipientPrevFlowRate + diff;
        // console.log(
        //     "updating flow rate: prev rate %s, diff %s new rate %s",
        //     uint256(int256(recipientPrevFlowRate)),
        //     uint256(int256(diff)),
        //     uint256(int256(recipientNewFlowRate))
        // );
        bytes32 trustid = keccak256(abi.encode(truster, recipient));
        Trust storage trust = trusts[trustid];

        //first time we link
        if (trust.trustee == address(0)) {
            memberTrusts[truster].push(trustid);
        }
        if (recipientPrevFlowRate == 0) {
            //create flow
            require(updateFlowTo == diff, "flow mismatch");
            newCtx = token.createFlowWithCtx(
                recipient,
                recipientNewFlowRate,
                newCtx
            );
        }
        //trust and stream already exists
        else {
            require(updateFlowTo == trust.flowRate + diff, "flow mismatch");
            if (recipientNewFlowRate == 0)
                newCtx = token.deleteFlowWithCtx(
                    address(this),
                    recipient,
                    newCtx
                );
            else
                newCtx = token.updateFlowWithCtx(
                    recipient,
                    recipientNewFlowRate,
                    newCtx
                );
        }
        if (trust.idtype == IdType.None) {
            IdType mutualId = getMutualId(truster, recipient);
            require(mutualId != IdType.None, "no mutual id system");
            trust.idtype = mutualId;
        }

        (uint256 prevTrustScore, uint256 newTrustScore) = _updateTrustScore(
            recipient,
            trust.flowRate,
            updateFlowTo
        );
        trust.flowRate = updateFlowTo;
        trust.trustee = recipient;

        emit TrustUpdated(
            truster,
            recipient,
            updateFlowTo,
            recipientNewFlowRate,
            flowRate,
            prevTrustScore,
            newTrustScore
        );
        return newCtx;
    }

    function _deleteTrusts(
        ISuperToken token,
        address member,
        bytes memory ctx
    ) internal returns (bytes memory newCtx) {
        bytes32[] memory _trusts = memberTrusts[member];
        newCtx = ctx;
        // console.log("deleting trusts %s", _trusts.length);
        for (uint256 i; i < _trusts.length; i++) {
            Trust storage trust = trusts[_trusts[i]];

            (, int96 recipientFlowRate, , ) = token.getFlowInfo(
                address(this),
                trust.trustee
            );
            // console.log(
            //     "deleting trust: %s recipient: %s total flow: %s",
            //     i,
            //     trust.trustee,
            //     uint256(int256(recipientFlowRate))
            // );
            // console.logBytes32(_trusts[i]);
            int96 newRate = recipientFlowRate - trust.flowRate;

            (uint256 prevTrustScore, uint256 newTrustScore) = _updateTrustScore(
                trust.trustee,
                trust.flowRate,
                0
            );
            trust.flowRate = 0;
            emit TrustUpdated(
                member,
                trust.trustee,
                0,
                newRate,
                0,
                prevTrustScore,
                newTrustScore
            );
            if (newRate == 0) {
                newCtx = token.deleteFlowWithCtx(
                    address(this),
                    trust.trustee,
                    newCtx
                );
            } else {
                // console.log("updating flow %s", uint256(int256(newRate)));

                newCtx = token.updateFlowWithCtx(
                    trust.trustee,
                    newRate,
                    newCtx
                );
            }
        }
        // console.log("done deleting flows");
    }

    function getMutualId(
        address member1,
        address member2
    ) public view returns (IdType mutualId) {
        if (members[IdType.GoodID][member1] && members[IdType.GoodID][member2])
            return IdType.GoodID;
        if (
            members[IdType.WorldCoin][member1] &&
            members[IdType.WorldCoin][member2]
        ) return IdType.WorldCoin;
        if (members[IdType.Nouns][member1] && members[IdType.Nouns][member2])
            return IdType.Nouns;
        if (
            members[IdType.BrightID][member1] &&
            members[IdType.BrightID][member2]
        ) return IdType.BrightID;

        return IdType.None;
    }
}
