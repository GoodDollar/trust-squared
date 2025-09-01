import { AlgorandWalletConnectors } from "@dynamic-labs/algorand";
import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import {
  DynamicContextProvider,
} from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { celo, mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";

export const config = createConfig({
  chains: [celo],
  multiInjectedProviderDiscovery: false,
  transports: {
    [celo.id]: http(),
  },
});

export default function DynamicProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <DynamicContextProvider
      settings={{
        appName: "Trust-Squared",
        environmentId: "d9ba107d-58b4-49db-9f8b-475239b06071",
        walletConnectors: [
          AlgorandWalletConnectors,
          CosmosWalletConnectors,
          EthereumWalletConnectors,
        ],

        // Customize the onboarding experience
        eventsCallbacks: {
          onAuthSuccess: (args) => {
            console.log("Auth success:", args);
          },
          onAuthFailure: (args) => {
            console.log("Auth failure:", args);
          },
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            {/* <DynamicWidget /> */}
            {children}
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
