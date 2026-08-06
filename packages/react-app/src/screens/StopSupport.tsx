import { useState } from "react";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ABI from "../abis/CFAv1Forwarder.json";
import { GOODDOLLAR, SF_FORWARDER, POOL_CONTRACT } from "@/env";
import {
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import {
  ArrowLeft,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { truncateAddress, formatFlow } from "@/utils";
import Blockies from "react-blockies";

const isMiniPay = !!(window?.ethereum && 'isMiniPay' in window.ethereum && (window.ethereum as Record<string, unknown>).isMiniPay);
const gasOpts = isMiniPay
  ? {}
  : {
      maxFeePerGas: BigInt(25.1e9),
      maxPriorityFeePerGas: BigInt(1e8),
    };

const useGetFlowRate = (sender: string | undefined) => {
  const result = useReadContract({
    address: SF_FORWARDER as `0x${string}`,
    abi: [
      {
        name: "getFlowrate",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "token", type: "address" },
          { name: "sender", type: "address" },
          { name: "receiver", type: "address" },
        ],
        outputs: [{ name: "", type: "int96" }],
      },
    ],
    functionName: "getFlowrate",
    args: [
      GOODDOLLAR as `0x${string}`,
      (sender || "0x0000000000000000000000000000000000000000") as `0x${string}`,
      POOL_CONTRACT as `0x${string}`,
    ],
    query: { enabled: !!sender },
  });
  if (!sender || !result.data) return 0n;
  return BigInt(result.data);
};

type Step = "confirm" | "processing" | "done";

export default function StopSupport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const account = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const trusteeAddress = searchParams.get("address") || "";
  const flowRateStr = searchParams.get("flowRate") || "0";
  const existingFlowRate = useGetFlowRate(account.address);

  const [step, setStep] = useState<Step>("confirm");

  const monthlyAmount = formatFlow(flowRateStr);

  const handleStopSupport = async () => {
    if (!trusteeAddress || !account.address) return;

    setStep("processing");

    try {
      const trusteeFlowRate = BigInt(flowRateStr);
      const newFlowRate = existingFlowRate - trusteeFlowRate;

      if (newFlowRate <= 0n) {
        const userData = encodeAbiParameters(
          parseAbiParameters("address,int96"),
          [trusteeAddress as `0x${string}`, 0n]
        );

        await writeContractAsync({
          ...gasOpts,
          abi: ABI,
          functionName: "deleteFlow",
          address: SF_FORWARDER as `0x${string}`,
          args: [GOODDOLLAR, account.address, POOL_CONTRACT, userData],
        });
      } else {
        const userData = encodeAbiParameters(
          parseAbiParameters("address,int96"),
          [trusteeAddress as `0x${string}`, 0n]
        );

        await writeContractAsync({
          ...gasOpts,
          abi: ABI,
          functionName: "updateFlow",
          address: SF_FORWARDER as `0x${string}`,
          args: [
            GOODDOLLAR,
            account.address,
            POOL_CONTRACT,
            newFlowRate,
            userData,
          ],
        });
      }

      setStep("done");
      toast({
        title: "Support stopped",
        description: `You are no longer supporting ${truncateAddress(trusteeAddress)}`,
      });
    } catch (e: unknown) {
      setStep("confirm");

      const errStr = (e as Error)?.message || String(e);
      let description = "Could not stop support. Please try again.";

      if (errStr.includes("rejected") || errStr.includes("denied")) {
        description = "You rejected the transaction in your wallet.";
      } else if (errStr.includes("insufficient")) {
        description = "Insufficient funds for gas fees.";
      }

      toast({
        title: "Transaction failed",
        description,
      });
    }
  };

  // Processing
  if (step === "processing") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col items-center justify-center px-5">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold mb-2">Stopping Support</h2>
        <p className="text-gray-400 text-sm text-center">
          Please confirm in your wallet and wait...
        </p>
      </div>
    );
  }

  // Done
  if (step === "done") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col items-center justify-center px-5">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Support Stopped</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          You are no longer streaming to {truncateAddress(trusteeAddress)}
        </p>
        <button
          onClick={() => navigate("/streams")}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Back to Streams
        </button>
      </div>
    );
  }

  // Confirm Step - bottom sheet style over stream details background
  return (
    <div className="min-h-screen bg-t2-dark text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Stream Details</h1>
        <button onClick={() => navigate("/")} className="p-1 hover:bg-t2-card-light rounded-full">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Background stream info (dimmed) */}
      <div className="px-5 opacity-40 pointer-events-none">
        <div className="flex items-center justify-center gap-6 py-4">
          {account.address && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-t2-border mx-auto">
                <Blockies seed={account.address.toLowerCase()} size={10} scale={6} className="rounded-full" />
              </div>
              <p className="text-white text-xs mt-1">You</p>
            </div>
          )}
          <div className="bg-green-600 rounded-full w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 12h8M12 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-t2-border mx-auto">
              <Blockies seed={trusteeAddress.toLowerCase()} size={10} scale={6} className="rounded-full" />
            </div>
            <p className="text-white text-xs mt-1">{truncateAddress(trusteeAddress)}</p>
          </div>
        </div>
        <div className="text-center mb-2">
          <p className="text-green-400 text-2xl font-bold">{monthlyAmount}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-gray-400 text-xs">per month</span>
            <span className="bg-green-600/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom sheet modal */}
      <div className="flex-1" />
      <div className="bg-t2-card border-t border-t2-border rounded-t-3xl px-5 pt-4 pb-8">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h3 className="text-white text-xl font-bold mb-2">
            Stop Supporting {truncateAddress(trusteeAddress)}?
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Stopping will reduce their Trust Score impact.
            This action cannot be undone immediately.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleStopSupport}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
          >
            Yes, Stop Support
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-white/10 border border-t2-border text-white py-3.5 rounded-xl font-semibold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">TRUST² PLATFORM</p>
      </div>
    </div>
  );
}
