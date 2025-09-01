import { Button } from "@/components/ui/button";
import { injected } from "@wagmi/connectors";
import { useConnect, useAccount } from "wagmi";
import { useState, useEffect } from "react";

export default function Login() {
  const { connect, isPending } = useConnect();
  const { isConnected, address } = useAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  // Debug connection state
  useEffect(() => {
    console.log("Login component - isConnected:", isConnected, "address:", address);
  }, [isConnected, address]);

  // Check if MiniPay is available
  const isMiniPay = typeof window !== 'undefined' && 
    window.ethereum && 
    'isMiniPay' in window.ethereum && 
    window.ethereum.isMiniPay;

  const onConnectWallet = async () => {
    try {
      setIsConnecting(true);
      console.log("Attempting to connect wallet...");
      await connect({
        connector: injected(),
      });
      console.log("Wallet connection successful");
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // If already connected, don't show login page
  if (isConnected) {
    console.log("Already connected, hiding login page");
    return null;
  }

  console.log("Showing login page - isConnected:", isConnected);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6 mb-8">
        {/* Logo Section */}
        <div className="text-center space-y-8 mb-8">
          <img src="/logo2.svg" alt="logo" className="w-44 block mx-auto" />
          
          {/* Subtitle */}
          <p className="text-gray-400 text-sm leading-relaxed px-4">
            Build your reputation through trust
            <br />
            and contributions.
          </p>
        </div>

        {/* Sign In Button */}
        <div className="w-full">
          <Button 
            onClick={onConnectWallet}
            disabled={isConnecting || isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isConnecting || isPending ? "Connecting..." : 
              isMiniPay ? "Sign in with MiniPay" : "Connect Wallet"
            }
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 mt-4">
          {isMiniPay ? 
            "Using MiniPay for seamless mobile experience" : 
            "Connect any supported wallet to continue"
          }
        </div>

        
      </div>
    </div>
  );
}