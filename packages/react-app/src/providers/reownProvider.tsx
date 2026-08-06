import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { celo } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

// Reown Cloud project ID - get one at https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "YOUR_PROJECT_ID";

const metadata = {
  name: "Trust²",
  description: "P2P community trust and funding with G$ streams",
  url: window.location.origin,
  icons: ["/logo2.svg"],
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [celo],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [celo],
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#16a34a",
    "--w3m-border-radius-master": "2px",
  },
});

export const config = wagmiAdapter.wagmiConfig;

export default function ReownProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
