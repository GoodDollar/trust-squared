import { ethers } from "ethers";
import { NextRequest } from 'next/server'
// import { waitUntil } from '@vercel/functions';

import ABI from "../../../../abi/TrustPool.json"
export const dynamic = 'force-dynamic'; // static by default, unless reading the request

const provider = new ethers.providers.StaticJsonRpcProvider("https://forno.celo.org", 42220)
const mainnet = new ethers.providers.StaticJsonRpcProvider("https://rpc.sepolia.org", 11155111)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string).connect(provider)
const poolContract = new ethers.Contract(process.env.POOL_CONTRACT as string, ABI.abi).connect(wallet)
const identityContract = new ethers.Contract("0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as string, ["function getWhitelistedRoot(address) external view returns(address)"]).connect(provider)
const nounsContract = new ethers.Contract("0x4C4674bb72a096855496a7204962297bd7e12b85", ["function balanceOf(address) external view returns(uint256)"]).connect(mainnet)
const gdContract = new ethers.Contract("0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", ["function transfer(address,uint256) external returns(bool)", "function balanceOf(address) external view returns(uint256)"]).connect(wallet)

console.log("Verifier address:", wallet.address)
export async function GET(request: NextRequest) {

  const memberAddress = request.nextUrl.searchParams.get("address")
  let isGoodID = false
  let isNoun = false
  if (memberAddress) {
    const root = await identityContract.getWhitelistedRoot(memberAddress);
    isGoodID = root.toLowerCase() === memberAddress.toLowerCase()
    try { const nouns = await nounsContract.balanceOf(memberAddress); isNoun = Number(nouns) > 0 } catch(e: any) { console.log("nouns check failed", e.message) }


    let existing = true
    try {
      existing = await poolContract.members(1, memberAddress)
      if (!existing && isGoodID)
        await poolContract.addMember(memberAddress, 1)
    }
    catch (e) {
      console.log("failed adding goodid member", e)
    }



    try {
      existing = await poolContract.members(3, memberAddress)
      if (!existing && isNoun)
        await poolContract.addMember(memberAddress, 3)
    }
    catch (e: any) {
      console.log("failed adding noun member", e.message)
    }

    //top up wallet
    if ((isNoun || isGoodID) || existing) {
      try {

        const gdBalance = await gdContract.balanceOf(memberAddress)
        const celoBalance = await provider.getBalance(memberAddress)
        if (gdBalance.lt(ethers.utils.parseEther("100")))
          await gdContract.transfer(memberAddress, ethers.utils.parseEther("1000"))
        if (celoBalance.lt(ethers.utils.parseEther("0.05")))
          await wallet.sendTransaction({ to: memberAddress, value: ethers.utils.parseEther("0.01") })
      }
      catch (e: any) {
        console.log("failed topping wallt", e.message)
      }
    }
  }


  return new Response(JSON.stringify({ isGoodID, isNoun }), { headers: { "content-type": "application/json" } });
}