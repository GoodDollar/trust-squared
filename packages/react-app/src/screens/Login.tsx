import { useState } from "react";
import { injected } from "@wagmi/connectors";
import { useConnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import Welcome from "./Welcome";
import { Zap, Users, TrendingUp, Shield } from "lucide-react";

export default function Login() {
  const { connect } = useConnect();
  const { open } = useAppKit();
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("trust2_onboarded");
  });

  const isMiniPay = !!(
    window?.ethereum && "isMiniPay" in window.ethereum && window.ethereum.isMiniPay
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem("trust2_onboarded", "true");
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <Welcome onComplete={handleOnboardingComplete} />;
  }

  const handleConnect = () => {
    if (isMiniPay) {
      try {
        connect({ connector: injected() });
      } catch (error) {
        console.error("Error connecting:", error);
      }
    } else {
      open();
    }
  };

  return (
    <div className="min-h-screen bg-t2-dark flex flex-col px-6 pb-10">
      {/* Hero section */}
      <div className="flex flex-col items-center text-center pt-16 pb-10">
        {/* Logo */}
        <div className="flex items-end gap-1.5 mb-3">
          <div className="w-1.5 h-5 bg-green-500 rounded-full" />
          <div className="w-1.5 h-9 bg-green-500 rounded-full" />
          <div className="w-1.5 h-7 bg-green-500 rounded-full" />
          <div className="w-1.5 h-10 bg-green-500 rounded-full" />
          <div className="w-1.5 h-6 bg-green-500 rounded-full" />
        </div>
        <h1 className="text-green-500 text-2xl font-bold mb-3">
          Trust<sup className="text-sm align-super">2</sup>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-[260px]">
          Stream G$ to the people you trust. Build reputation. Grow your community.
        </p>
      </div>

      {/* What you can do — 3 feature highlights */}
      <div className="space-y-3 mb-10">
        <div className="flex items-center gap-4 bg-t2-card border border-t2-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Real-time G$ Streams</p>
            <p className="text-gray-500 text-xs">Support others with continuous token flows</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-t2-card border border-t2-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">On-chain Trust Score</p>
            <p className="text-gray-500 text-xs">Your reputation grows as people support you</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-t2-card border border-t2-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Community Powered</p>
            <p className="text-gray-500 text-xs">Discover and support trusted community members</p>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Connect Wallet CTA */}
      <div className="space-y-3">
        <button
          onClick={handleConnect}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Zap className="h-4 w-4" />
          Connect Wallet
        </button>
        <p className="text-center text-gray-600 text-xs">
          MetaMask, WalletConnect, Coinbase & more
        </p>
      </div>
    </div>
  );
}
