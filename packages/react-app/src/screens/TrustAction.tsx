import { useState } from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import ABI from "../abis/CFAv1Forwarder.json";
import { GOODDOLLAR, SF_FORWARDER, POOL_CONTRACT } from "@/env";
import {
  parseEther,
  encodeAbiParameters,
  parseAbiParameters,
  isAddress,
} from "viem";
import {
  Loader2,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PasteInput } from "@/components/PasteInput";
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

type Step = "scan" | "amount" | "confirming" | "success";
type RatePeriod = "month" | "minute";
const PERIOD_SECONDS: Record<RatePeriod, number> = {
  month: 60 * 60 * 24 * 30,
  minute: 60,
};

export const QrScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const account = useAccount();
  const existingFlowRate = useGetFlowRate(account.address);
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const initialAddress = searchParams.get("address") || undefined;
  const [recipient, setRecipient] = useState<string | undefined>(initialAddress);
  const [amount, setAmount] = useState<string>("");
  const [ratePeriod, setRatePeriod] = useState<RatePeriod>(
    searchParams.get("mode") === "minute" ? "minute" : "month"
  );
  const [step, setStep] = useState<Step>(initialAddress && isAddress(initialAddress) ? "amount" : "scan");
  const [txHash, setTxHash] = useState<string>("");

  const numAmount = parseFloat(amount) || 0;
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleScan = (results: IDetectedBarcode[]) => {
    if (results.length > 0) {
      const scanned = results[0].rawValue;
      setRecipient(scanned);
      if (isAddress(scanned)) {
        setStep("amount");
      }
    }
  };

  const handleRecipientSubmit = (text: string) => {
    setRecipient(text);
    if (isAddress(text)) {
      setStep("amount");
    }
  };

  const isSelfStream =
    recipient && account.address
      ? recipient.toLowerCase() === account.address.toLowerCase()
      : false;

  const trust = async () => {
    if (!recipient || numAmount <= 0) return;

    if (isSelfStream) {
      setErrorMsg("You cannot stream to your own address.");
      toast({
        title: "Invalid recipient",
        description: "You cannot stream to your own address.",
      });
      return;
    }

    setErrorMsg("");
    setStep("confirming");

    try {
      const monthlyTrustRate = parseEther(amount) / BigInt(PERIOD_SECONDS[ratePeriod]);
      const newFlowRate = existingFlowRate + monthlyTrustRate;

      const userData = encodeAbiParameters(
        parseAbiParameters("address,int96"),
        [recipient as `0x${string}`, monthlyTrustRate]
      );

      const hash = await writeContractAsync({
        ...gasOpts,
        abi: ABI,
        functionName: existingFlowRate === 0n ? "createFlow" : "updateFlow",
        address: SF_FORWARDER as `0x${string}`,
        args: [GOODDOLLAR, account.address, POOL_CONTRACT, newFlowRate, userData],
      });

      setTxHash(hash);
      setStep("success");
      toast({
        title: "Support started!",
        description: "Your stream is now active",
      });
    } catch (e: unknown) {
      setStep("amount");

      const errStr = (e as Error)?.message || String(e);
      let title = "Transaction failed";
      let description = "Please try again.";

      if (errStr.includes("insufficient") || errStr.includes("exceeds balance")) {
        title = "Insufficient G$ balance";
        description = "You don't have enough G$ to start this stream. Claim your daily G$ first.";
      } else if (errStr.includes("NO_FLOW_CHANGE")) {
        title = "Flow already exists";
        description = "You already have an active stream to this address with the same rate.";
      } else if (errStr.includes("rejected") || errStr.includes("denied")) {
        title = "Transaction rejected";
        description = "You rejected the transaction in your wallet.";
      } else if (errStr.includes("NotAcceptedSuperToken")) {
        title = "Token not supported";
        description = "The token is not accepted by the TrustPool contract.";
      }

      setErrorMsg(description);
      toast({ title, description });
    }
  };

  // Scan Step
  if (step === "scan") {
    return (
      <div className="min-h-screen bg-t2-dark text-white pb-28">
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg">Support Someone</h1>
        </div>

        <div className="px-5 space-y-4">
          <div className="bg-t2-card border border-t2-border rounded-2xl overflow-hidden">
            <Scanner onScan={handleScan} />
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-4">
              Or enter a wallet address manually
            </p>
            <PasteInput onChange={handleRecipientSubmit} />
          </div>
        </div>
      </div>
    );
  }

  // Amount Step
  if (step === "amount") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col pb-28">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => setStep("scan")} className="p-1 hover:bg-t2-card-light rounded-full">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg">Start Supporting</h1>
        </div>

        <div className="flex-1 px-5 pb-6 flex flex-col">
          {/* Recipient avatar + name */}
          <div className="flex flex-col items-center space-y-3 py-6">
            {recipient && (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500/30">
                <Blockies
                  seed={recipient.toLowerCase()}
                  size={12}
                  scale={7}
                  className="rounded-full"
                />
              </div>
            )}
            <div className="text-center">
              <p className="text-white font-semibold text-xl">
                {truncateAddress(recipient || "")}
              </p>
              <p className="text-gray-400 text-sm">Receiver on Trust²</p>
            </div>
          </div>

          {/* Amount Input Card */}
          <div className="bg-t2-card border border-t2-border rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-white font-semibold mb-0.5">Amount per {ratePeriod}</p>
              <p className="text-gray-500 text-sm">Set the {ratePeriod === "minute" ? "per-minute (test)" : "monthly"} stream value</p>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-1 bg-t2-dark/60 rounded-full p-1 w-fit">
              {(["month", "minute"] as RatePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setRatePeriod(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    ratePeriod === p
                      ? p === "minute" ? "bg-yellow-600 text-white" : "bg-green-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p === "month" ? "Monthly" : "Per Minute"}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-xl border-2 border-green-600 bg-t2-dark/60 overflow-hidden">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent px-4 py-3.5 text-white text-2xl font-bold outline-none placeholder:text-gray-600"
                min="0"
                step="0.01"
              />
              <span className="pr-4 text-gray-400 font-semibold text-lg">G$</span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-green-400" />
                </div>
                <span>
                  Duration: <strong className="text-white">Continuous until stopped</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-white font-medium">Safe & Secure Transaction</span>
              </div>
            </div>
          </div>

          {/* Self-stream warning */}
          {isSelfStream && (
            <div className="flex items-center gap-2 bg-yellow-600/15 border border-yellow-600/30 rounded-xl p-3 mt-4">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
              <p className="text-yellow-300 text-sm">
                You cannot stream to your own address.
              </p>
            </div>
          )}

          {/* Error message */}
          {errorMsg && !isSelfStream && (
            <div className="flex items-center gap-2 bg-red-600/15 border border-red-600/30 rounded-xl p-3 mt-4">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errorMsg}</p>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-gray-600 text-xs text-center leading-relaxed px-2 mt-4">
            By starting this stream, you agree to monthly recurring charges. You
            can cancel or edit this support stream at any time from your Trust²
            dashboard.
          </p>

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* Submit Button */}
          <Button
            onClick={trust}
            disabled={numAmount <= 0 || isSelfStream}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-t2-card-light disabled:text-gray-500 text-white py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Zap className="h-4 w-4" />
            Start Streaming Support
          </Button>

          <p className="text-gray-600 text-xs text-center flex items-center justify-center gap-1.5 mt-3 pb-4">
            <Lock className="h-3 w-3" /> ENCRYPTED BY TRUST²
          </p>
        </div>
      </div>
    );
  }

  // Confirming Step
  if (step === "confirming") {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex flex-col items-center justify-center px-5">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-green-500 animate-spin mx-auto" />
          <h2 className="text-white text-xl font-semibold">Processing Transaction</h2>
          <p className="text-gray-400 text-sm">
            Please confirm in your wallet and wait for the transaction to complete...
          </p>
        </div>
      </div>
    );
  }

  // Success Step - matches Confirmation.png mockup
  return (
    <div className="min-h-screen bg-t2-dark text-white flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Confirmation</h1>
        <button onClick={() => navigate("/")} className="p-1 hover:bg-t2-card-light rounded-full">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 px-5 pb-6 flex flex-col items-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-green-600/20 border-2 border-green-500 flex items-center justify-center mt-6">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>

        <div className="text-center mt-6">
          <h2 className="text-white text-2xl font-bold mb-2">
            Support Started
          </h2>
          <h2 className="text-white text-2xl font-bold mb-3">
            Successfully
          </h2>
          <p className="text-gray-400 text-sm">
            You are now streaming <strong className="text-white">{amount} G$/{ratePeriod}</strong>
          </p>
          <p className="text-gray-400 text-sm">
            to {truncateAddress(recipient || "")}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="w-full bg-t2-card border border-t2-border rounded-2xl mt-8">
          <div className="flex justify-between items-center p-4 border-b border-t2-border">
            <span className="text-gray-400 text-sm">Recipient</span>
            <div className="flex items-center gap-2">
              {recipient && (
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                  {recipient.slice(2, 3).toUpperCase()}
                </div>
              )}
              <span className="text-white text-sm font-medium">{truncateAddress(recipient || "")}</span>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-t2-border">
            <span className="text-gray-400 text-sm">Amount</span>
            <span className="text-white text-sm font-medium">{amount} G$</span>
          </div>
          <div className="flex justify-between items-center p-4 border-b border-t2-border">
            <span className="text-gray-400 text-sm">Frequency</span>
            <span className="text-white text-sm font-medium">{ratePeriod === "minute" ? "Per Minute" : "Monthly"}</span>
          </div>
          <div className="flex justify-between items-center p-4">
            <span className="text-gray-400 text-sm">Network Fee</span>
            <span className="text-white text-sm font-medium">0.001 G$</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="w-full space-y-3 mt-6 pb-4">
          {txHash ? (
            <a
              href={`https://celoscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
            >
              View Transaction Details
            </a>
          ) : (
            <button
              onClick={() => navigate("/streams")}
              className="w-full text-center bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
            >
              View Transaction Details
            </button>
          )}
          <button
            onClick={() => navigate("/streams")}
            className="w-full text-center border border-t2-border text-white py-3.5 rounded-xl font-semibold hover:bg-t2-card transition-colors"
          >
            Stop Support
          </button>
        </div>
      </div>
    </div>
  );
};
