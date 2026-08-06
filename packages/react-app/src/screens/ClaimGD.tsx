import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { useNavigate } from "react-router-dom";
import { GOODDOLLAR } from "@/env";
import {
  ArrowLeft,
  Gift,
  Clock,
  Loader2,
  CheckCircle2,
  Coins,
} from "lucide-react";
import { formatUnits } from "viem";

const UBI_CONTRACT = "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as const;

const UBI_ABI = [
  {
    name: "checkEntitlement",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const isMiniPay = !!(
  window?.ethereum &&
  "isMiniPay" in window.ethereum &&
  (window.ethereum as Record<string, unknown>).isMiniPay
);
const gasOpts = isMiniPay
  ? {}
  : {
      maxFeePerGas: BigInt(25.1e9),
      maxPriorityFeePerGas: BigInt(1e8),
    };

type ClaimStep = "idle" | "claiming" | "success" | "error";

export default function ClaimGD() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [step, setStep] = useState<ClaimStep>("idle");

  const {
    data: entitlement,
    isLoading: entitlementLoading,
    refetch: refetchEntitlement,
  } = useReadContract({
    address: UBI_CONTRACT,
    abi: UBI_ABI,
    functionName: "checkEntitlement",
    query: { enabled: !!address },
  });

  const {
    data: gdBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: GOODDOLLAR as `0x${string}`,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const claimableAmount = entitlement ? BigInt(entitlement) : 0n;
  const canClaim = claimableAmount > 0n;
  const formattedClaimable = claimableAmount > 0n
    ? Number(formatUnits(claimableAmount, 18)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const formattedBalance = gdBalance
    ? Number(formatUnits(BigInt(gdBalance as bigint), 18)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const handleClaim = async () => {
    if (!address || !canClaim) return;
    setStep("claiming");
    try {
      await writeContractAsync({
        ...gasOpts,
        address: UBI_CONTRACT,
        abi: UBI_ABI,
        functionName: "claim",
      });
      setStep("success");
      refetchEntitlement();
      refetchBalance();
    } catch {
      setStep("error");
      setTimeout(() => setStep("idle"), 2000);
    }
  };

  if (step === "claiming") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col items-center justify-center px-5">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Claiming G$</h2>
        <p className="text-gray-400 text-sm">Confirm in your wallet...</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col items-center justify-center px-5">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">G$ Claimed!</h2>
        <p className="text-green-400 text-2xl font-bold mb-6">
          +{formattedClaimable} G$
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-t2-card-light rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-white font-semibold text-lg">Claim G$</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance */}
        <div className="bg-t2-card border border-t2-border rounded-2xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-600/20 flex items-center justify-center">
            <Coins className="h-7 w-7 text-green-400" />
          </div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            Your G$ Balance
          </p>
          <p className="text-white text-3xl font-bold">
            {formattedBalance}
            <span className="text-lg text-gray-400 ml-1">G$</span>
          </p>
        </div>

        {/* Claim Card */}
        <div className="bg-t2-card border border-t2-border rounded-2xl p-5">
          {entitlementLoading ? (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Checking claim status...</p>
            </div>
          ) : canClaim ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Gift className="h-5 w-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">
                  UBI Available!
                </span>
              </div>
              <p className="text-white text-4xl font-bold">
                {formattedClaimable}
                <span className="text-lg text-gray-400 ml-1">G$</span>
              </p>
              <button
                onClick={handleClaim}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors"
              >
                Claim G$
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3 py-2">
              <Clock className="h-8 w-8 text-gray-500 mx-auto" />
              <p className="text-gray-400 font-medium">Already Claimed</p>
              <p className="text-gray-500 text-sm">
                Come back tomorrow for your next claim.
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="mt-4 bg-red-600/15 border border-red-600/30 rounded-xl p-3 text-center">
              <p className="text-red-400 text-sm">Claim failed. Try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
