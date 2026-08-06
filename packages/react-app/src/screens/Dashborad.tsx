import { useGetMember, useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { useBalanceStream } from "@/hooks/useBalanceStream";
import { formatScore, formatFlow, truncateAddress } from "@/utils";
import { useAccount } from "wagmi";
import Blockies from "react-blockies";

export default function Dashboard() {
  const account = useAccount();
  const { data: memberData } = useGetMember(account.address as string);
  const { data: trusteesData } = useGetMemberTrustees(account.address ?? "");
  const { data: trustersData } = useGetMemberTrusters(account.address ?? "");

  const inFlowRate = BigInt(memberData?.data?.member?.inFlowRate || 0);
  const outFlowRate = BigInt(memberData?.data?.member?.outFlowRate || 0);
  const netFlowRate = inFlowRate - outFlowRate;

  const balance = useBalanceStream(account.address, netFlowRate);

  const supporters = trustersData?.data?.member?.trusters?.length || 0;
  const receivers = trusteesData?.data?.member?.trustees?.length || 0;
  const trustScore = formatScore(memberData?.data?.member?.trustScore || "");

  const displayName = truncateAddress(account.address || "");

  // Calculate donut progress (percentage fill based on activity)
  const totalActivity = supporters + receivers;
  const progress = Math.min(totalActivity / 20, 1);
  const circumference = 2 * Math.PI * 50;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {account.address && (
            <Blockies
              seed={account.address.toLowerCase()}
              size={8}
              scale={5}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-white font-semibold text-lg">{displayName}</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-sm">Trust Score</span>
              <span className="text-green-400 text-sm font-medium">{trustScore}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats + Donut Chart */}
        <div className="flex items-start justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <div>
                <p className="text-blue-400 text-sm">Supporters</p>
                <p className="text-white text-2xl font-bold">{supporters}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <div>
                <p className="text-purple-400 text-sm">Receivers</p>
                <p className="text-white text-2xl font-bold">{receivers}</p>
              </div>
            </div>
          </div>

          {/* Net Flow Donut */}
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-t2-border"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={netFlowRate >= 0n ? "text-green-500" : "text-red-500"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p
                className={`text-lg font-bold ${
                  netFlowRate >= 0n ? "text-green-400" : "text-red-400"
                }`}
              >
                {balance || "0"}
              </p>
              <p className="text-xs text-gray-400">G$ Balance</p>
            </div>
          </div>
        </div>

        {/* Flow Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-t2-card border border-t2-border rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Incoming</p>
            <p className="text-green-400 text-lg font-semibold">
              {inFlowRate > 0n ? formatFlow(inFlowRate.toString()) : "0 G$"}
            </p>
            <p className="text-gray-500 text-xs mt-1">per month</p>
          </div>
          <div className="bg-t2-card border border-t2-border rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Outgoing</p>
            <p className="text-red-400 text-lg font-semibold">
              {outFlowRate > 0n ? formatFlow(outFlowRate.toString()) : "0 G$"}
            </p>
            <p className="text-gray-500 text-xs mt-1">per month</p>
          </div>
        </div>

        {/* Active Streams Summary */}
        <div className="bg-t2-card border border-t2-border rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">Active Streams</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Outgoing streams</span>
              <span className="text-white font-medium">{receivers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Incoming streams</span>
              <span className="text-white font-medium">{supporters}</span>
            </div>
            <div className="flex justify-between items-center border-t border-t2-border pt-3">
              <span className="text-gray-400 text-sm">Net flow</span>
              <span
                className={`font-medium ${
                  netFlowRate >= 0n ? "text-green-400" : "text-red-400"
                }`}
              >
                {netFlowRate !== 0n
                  ? `${netFlowRate > 0n ? "+" : "-"}${formatFlow(
                      (netFlowRate > 0n ? netFlowRate : -netFlowRate).toString()
                    )}`
                  : "0 G$"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
