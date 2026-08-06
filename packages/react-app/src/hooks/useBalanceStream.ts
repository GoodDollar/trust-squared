import { GOODDOLLAR } from "@/env";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { erc20Abi } from "viem";

const ANIMATION_MINIMUM_STEP_TIME = 100;
export const useBalanceStream = (
  account: string | undefined,
  flowRate: bigint
) => {
  const gdBalance = useReadContract({
    address: GOODDOLLAR as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account as `0x${string}`] : undefined,
    query: {
      enabled: !!account,
      refetchInterval: 60000,
    },
  });

  const balanceValue = gdBalance.data as bigint | undefined;

  const [balance, setBalance] = useState<bigint | undefined>(balanceValue);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    setStartTime(Date.now());
  }, [balanceValue]);

  useEffect(() => {
    let stopAnimation = false;
    let lastAnimationTimestamp = 0;

    const animationStep = (currentAnimationTimestamp: number) => {
      if (stopAnimation) {
        return;
      }
      if (
        balanceValue !== undefined &&
        currentAnimationTimestamp - lastAnimationTimestamp >
          ANIMATION_MINIMUM_STEP_TIME
      ) {
        const timePassed = BigInt(Date.now() - startTime) / 1000n;
        const update = BigInt(flowRate || 0) * timePassed;
        setBalance(balanceValue + update);
        lastAnimationTimestamp = currentAnimationTimestamp;
      }

      requestAnimationFrame(animationStep);
    };

    requestAnimationFrame(animationStep);

    return () => {
      stopAnimation = true;
    };
  }, [balanceValue, startTime, flowRate]);

  return balance !== undefined
    ? (Number(balance) / 1e18).toLocaleString()
    : undefined;
};
