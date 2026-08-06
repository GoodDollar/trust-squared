import React from "react";
import MiniPayProvider from "./minipayProvider";
import ReownProvider from "./reownProvider";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMiniPay = () => {
    if (window && window.ethereum) {
      // @ts-ignore MiniPay detection
      if (window.ethereum.isMiniPay) {
        return true;
      }
    }
    return false;
  };

  return isMiniPay() ? (
    <MiniPayProvider queryClient={queryClient}>{children}</MiniPayProvider>
  ) : (
    <ReownProvider queryClient={queryClient}>{children}</ReownProvider>
  );
}
