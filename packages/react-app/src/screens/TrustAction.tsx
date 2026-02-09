import React, { useEffect, useState } from "react";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PasteInput } from "@/components/PasteInput";
import { truncateAddress } from "@/utils";

// @ts-expect-error
const isMiniPay = window?.ethereum?.isMiniPay;
const gasOpts = isMiniPay ? {} : {
  maxFeePerGas: BigInt(25.1e9),
  maxPriorityFeePerGas: BigInt(1e8)
};

const useGetFlowRate = (sender: string | undefined) => {
  const result = useReadContract({
    address: SF_FORWARDER,
    abi: [{ name: "getFlowrate", type: "function", stateMutability: "view", inputs: [{ name: "token", type: "address" }, { name: "sender", type: "address" }, { name: "receiver", type: "address" }], outputs: [{ name: "", type: "int96" }] }],
    functionName: "getFlowrate",
    args: [GOODDOLLAR as `0x${string}`, (sender || "0x0000000000000000000000000000000000000000") as `0x${string}`, POOL_CONTRACT as `0x${string}`],
    query: { enabled: !!sender },
  });
  if (!sender || !result.data) return 0n;
  return BigInt(result.data);
};

export const QrScan = () => {
  const navigation = useNavigate();
  const account = useAccount();

  const existingFlowRate = useGetFlowRate(account.address);
  const { writeContractAsync } = useWriteContract();

  const [result, setResult] = useState<string | undefined>(undefined);
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const validRecipient = isAddress(result || "");

  const handleScan = (result: IDetectedBarcode[]) => {
    if (result.length > 0) {
      setResult(result[0].rawValue);
    }
  };

  const trust = async () => {
    if (result) {
      const monthlyTrustRate =
        parseEther(amount.toString()) / BigInt(60 * 60 * 24 * 30);
      const newFlowRate = existingFlowRate + monthlyTrustRate;

      const userData = encodeAbiParameters(
        parseAbiParameters("address,int96"),
        [result as "0x${string}", monthlyTrustRate]
      );
      const resultPromise = writeContractAsync({
        ...gasOpts,
        abi: ABI,
        functionName: existingFlowRate === 0n ? "createFlow" : "updateFlow",
        address: SF_FORWARDER,
        args: [
          GOODDOLLAR,
          account.address,
          POOL_CONTRACT,
          newFlowRate,
          userData,
        ],
      });
      setLoading(true);
      setError("");
      try {
        await resultPromise;
        toast({
          title: "Trust success!",
          description: "You've made your community better",
        });
        navigation("/");
      } catch (e: any) {
        setLoading(false);
        toast({
          title: "Transaction failed",
          description: "Please try again",
        });
      }
    }
  };

  if (validRecipient) {
    const buttonContent = loading ? (
      <>
        <Loader2 className="animate-spin" /> Please wait
      </>
    ) : (
      "Trust"
    );
    return (
      <div className="flex flex-col gap-4 justify-center items-start">
        <div>{truncateAddress(result || "")}</div>
        <Input
          type="number"
          name="amount"
          title="Monthly G$ Trust"
          placeholder="Monthly G$ Trust"
          onChangeCapture={(e) => setAmount(Number(e.currentTarget.value))}
        />
        <Button onClick={trust} disabled={amount <= 0 || loading}>
          {buttonContent}
        </Button>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-4 justify-center items-center">
        <Scanner onScan={handleScan} />
        <PasteInput onChange={(text: string) => setResult(text)} />
        {/* <div>Trustee Address:{result}</div> */}
      </div>
    );
  }
};
