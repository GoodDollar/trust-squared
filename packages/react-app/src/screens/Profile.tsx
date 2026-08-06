import { useState } from "react";
import { useGetMember, useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { useBalanceStream } from "@/hooks/useBalanceStream";
import { formatScore, formatFlow, truncateAddress } from "@/utils";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useDisconnect } from "wagmi";
import { Share2, LogOut, TrendingUp, TrendingDown, Clock, Check } from "lucide-react";
import Blockies from "react-blockies";
import { Link } from "react-router-dom";

export default function Profile() {
  const account = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const { data: memberData } = useGetMember(account.address as string);
  const { data: trusteesData } = useGetMemberTrustees(account.address ?? "");
  const { data: trustersData } = useGetMemberTrusters(account.address ?? "");

  const inFlowRate = BigInt(memberData?.data?.member?.inFlowRate || 0);
  const outFlowRate = BigInt(memberData?.data?.member?.outFlowRate || 0);
  const netFlowRate = inFlowRate - outFlowRate;

  const balance = useBalanceStream(account.address, netFlowRate);

  const trusteesArr = trusteesData?.data?.member?.trustees || [];
  const trustersArr = trustersData?.data?.member?.trusters || [];
  const activeSupporters = trustersArr.filter((t: { flowRate: string }) => BigInt(t.flowRate) > 0n).length;
  const activeTrustees = trusteesArr.filter((t: { flowRate: string }) => BigInt(t.flowRate) > 0n).length;
  const trustScore = formatScore(memberData?.data?.member?.trustScore || "");
  const displayName = truncateAddress(account.address || "");

  const shareUrl = window.location.origin + `/?address=${account.address}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayName} on Trust²`,
          text: `Support me on Trust² — stream G$ to build community trust.`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share dialog
    }
  };

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {account.address && (
            <Blockies
              seed={account.address.toLowerCase()}
              size={8}
              scale={5}
              className="rounded-full"
            />
          )}
          <span className="text-green-400 font-semibold text-lg">{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-t2-card-light transition-colors relative"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <Share2 className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setShowDisconnect(true)}
            className="p-2 rounded-full hover:bg-t2-card-light transition-colors"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
          Link copied to clipboard
        </div>
      )}

      <div className="px-5 space-y-4">
        {/* QR Code */}
        <div className="bg-t2-card border border-t2-border rounded-2xl p-6 flex flex-col items-center">
          <div className="bg-white rounded-xl p-3">
            <QRCodeSVG
              value={account.address as string}
              size={160}
              level="H"
              bgColor="white"
              fgColor="black"
            />
          </div>
          <p className="text-gray-400 text-sm mt-3">Scan to receive your funds</p>
        </div>

        {/* Incoming & Outgoing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-t2-card border border-t2-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              <p className="text-green-400 text-xs font-medium uppercase tracking-wider">Incoming</p>
            </div>
            <p className="text-white text-2xl font-bold">
              {inFlowRate > 0n ? formatFlow(inFlowRate.toString()) : "0 G$"}
            </p>
            <p className="text-gray-500 text-xs mt-1">From {activeSupporters} active stream{activeSupporters !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-t2-card border border-t2-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-gray-400" />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Outgoing</p>
            </div>
            <p className="text-white text-2xl font-bold">
              {outFlowRate > 0n ? formatFlow(outFlowRate.toString()) : "0 G$"}
            </p>
            <p className="text-gray-500 text-xs mt-1">To {activeTrustees} active stream{activeTrustees !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-t2-card border border-t2-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-white font-semibold">Balance</span>
          <span className="text-white font-bold text-lg">
            {balance ? balance : "0.00"} G$
          </span>
        </div>

        {/* Trust Score */}
        <div className="bg-t2-card border border-t2-border rounded-xl p-4 flex items-center justify-between">
          <span className="text-white font-semibold">Trust Score</span>
          <span className="text-green-400 font-bold text-lg">{trustScore}</span>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>

          {/* Incoming streams (trusters) */}
          {trustersArr.map((truster) => {
            const addr = truster.id.split("_")[0];
            const isActive = BigInt(truster.flowRate) > 0n;
            const monthlyFlow = formatFlow(truster.flowRate.toString());
            return (
              <div key={truster.id} className="bg-t2-card border border-t2-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isActive ? "bg-green-600/20" : "bg-orange-600/20"}`}>
                    <TrendingUp className={`h-4 w-4 ${isActive ? "text-green-400" : "text-orange-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{truncateAddress(addr)}</p>
                    <p className="text-gray-500 text-xs">{isActive ? "Active stream" : "Paused"}</p>
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? "text-green-400" : "text-orange-400"}`}>
                    {isActive ? `+${monthlyFlow}` : "Paused"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Outgoing streams (trustees) */}
          {trusteesArr.map((trustee) => {
            const addr = trustee.id.split("_")[1];
            const isActive = BigInt(trustee.flowRate) > 0n;
            const monthlyFlow = formatFlow(trustee.flowRate.toString());
            return (
              <div key={trustee.id} className="bg-t2-card border border-t2-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600/20 flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{truncateAddress(addr)}</p>
                    <p className="text-gray-500 text-xs uppercase">{isActive ? "Monthly stream" : "Paused"}</p>
                  </div>
                  <span className={`text-sm font-semibold ${isActive ? "text-red-400" : "text-orange-400"}`}>
                    {isActive ? `-${monthlyFlow}` : "Paused"}
                  </span>
                </div>
                {isActive ? (
                  <Link
                    to={`/stop-support?trustId=${trustee.id}&address=${addr}&flowRate=${trustee.flowRate}`}
                    className="block w-full text-center border border-green-500/30 text-green-400 hover:bg-green-500/10 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    STOP SUPPORT
                  </Link>
                ) : (
                  <Link
                    to={`/trust?address=${addr}`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    RESUME SUPPORT
                  </Link>
                )}
              </div>
            );
          })}

          {trustersArr.length === 0 && trusteesArr.length === 0 && (
            <div className="bg-t2-card border border-t2-border rounded-xl p-6 text-center">
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Wallet Modal */}
      {showDisconnect && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setShowDisconnect(false)}
        >
          <div
            className="bg-t2-card border border-t2-border rounded-t-2xl w-full max-w-md p-6 pb-8 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold text-lg text-center">Disconnect Wallet</h3>
            <p className="text-gray-400 text-sm text-center">
              Are you sure you want to disconnect your wallet?
            </p>
            <button
              onClick={() => disconnect()}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Disconnect
            </button>
            <button
              onClick={() => setShowDisconnect(false)}
              className="w-full border border-t2-border text-gray-400 hover:bg-t2-card-light py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
