import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatFlow, formatScore, truncateAddress } from "@/utils";
import Blockies from "react-blockies";

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1742484/trustsquared/v2.0.0";

function useTrustEvent(truster: string, recipient: string) {
  return useQuery({
    queryKey: ["trustEvent", truster, recipient],
    queryFn: async () => {
      const res = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query TrustEvent($truster: Bytes!, $recipient: Bytes!) {
            trustUpdateds(
              where: { truster: $truster, recipient: $recipient }
              orderBy: blockTimestamp
              orderDirection: asc
              first: 1
            ) {
              prevTrustScore
              newTrustScore
              blockTimestamp
            }
          }`,
          variables: {
            truster: truster.toLowerCase(),
            recipient: recipient.toLowerCase(),
          },
        }),
      });
      const json = await res.json();
      return json?.data?.trustUpdateds?.[0] ?? null;
    },
    enabled: !!truster && !!recipient,
  });
}

export default function StreamDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const account = useAccount();

  const trustId = searchParams.get("trustId") || "";
  const parts = trustId.split("_");
  const supporter = parts[0] || "";
  const receiver = parts[1] || "";

  const isSupporter =
    account.address?.toLowerCase() === supporter.toLowerCase();

  const flowRateParam = searchParams.get("flowRate");
  const monthlyFlow = flowRateParam ? formatFlow(flowRateParam) : "Active Stream";
  const isActive = flowRateParam ? BigInt(flowRateParam) > 0n : true;

  const { data: trustEvent, isLoading: eventLoading } = useTrustEvent(supporter, receiver);

  // Calculate real trust impact
  const scoreChange = trustEvent
    ? formatScore(trustEvent.newTrustScore)
    : null;

  // Format start date
  const startDate = trustEvent?.blockTimestamp
    ? new Date(Number(trustEvent.blockTimestamp) * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-t2-dark text-white flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-t2-card-light rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Stream Details</h1>
        <button
          onClick={() => navigate("/")}
          className="p-1 hover:bg-t2-card-light rounded-full"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="px-5 flex-1 flex flex-col">
        {/* 1. Avatars — spread to edges with icon in center */}
        <div className="relative flex items-start justify-between px-4 pt-2 pb-1">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-t2-border">
              <Blockies seed={supporter.toLowerCase()} size={8} scale={7} className="rounded-full" />
            </div>
            <p className="text-white text-xs mt-1.5 font-medium">
              {isSupporter ? "You" : truncateAddress(supporter)}
            </p>
          </div>

          {/* Horizontal line connecting avatars */}
          <div className="absolute left-[4.5rem] right-[4.5rem] top-[2.25rem] h-px bg-t2-border z-0" />

          {/* Streaming icon — centered on the line */}
          <div className="absolute left-1/2 top-[1.25rem] -translate-x-1/2 bg-green-600 rounded-full w-8 h-8 flex items-center justify-center z-10">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 9h16" strokeLinecap="round" />
              <path d="M16 5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 15H4" strokeLinecap="round" />
              <path d="M8 11l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-t2-border">
              <Blockies seed={receiver.toLowerCase()} size={8} scale={7} className="rounded-full" />
            </div>
            <p className="text-white text-xs mt-1.5 font-medium">
              {!isSupporter ? "You" : truncateAddress(receiver)}
            </p>
          </div>
        </div>

        {/* 2. Amount — large centered text */}
        <div className="text-center mt-4">
          <p className="text-white text-3xl font-bold">
            {flowRateParam ? monthlyFlow : "Active"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-gray-400 text-sm">per month</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isActive
                ? "bg-green-600 text-white"
                : "bg-orange-600/20 text-orange-400 border border-orange-500/30"
            }`}>
              {isActive ? "ACTIVE" : "PAUSED"}
            </span>
          </div>
        </div>

        {/* 3. Trust Impact — card with green ring icon */}
        <div className="bg-t2-card border border-t2-border rounded-2xl p-4 flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 4v5c0 5-3 8-7 10-4-2-7-5-7-10V7l7-4z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Trust Impact</p>
              <p className="text-gray-500 text-xs">Contribution to network health</p>
            </div>
          </div>
          {eventLoading ? (
            <Loader2 className="h-4 w-4 text-green-400 animate-spin" />
          ) : (
            <span className="text-green-400 font-semibold">
              {scoreChange ? `+${scoreChange}` : "+0 Score"}
            </span>
          )}
        </div>

        {/* Thin separator line */}
        <div className="border-t border-t2-border mt-5" />

        {/* 4. Transaction Details — heading + table card */}
        <div className="mt-3">
          <h3 className="text-white font-semibold mb-3">Transaction Details</h3>
          <div className="bg-t2-card border border-t2-border rounded-2xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-t2-border">
              <span className="text-gray-400 text-sm">Supporter</span>
              <span className="text-white text-sm font-medium">
                {isSupporter ? "You" : truncateAddress(supporter)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-b border-t2-border">
              <span className="text-gray-400 text-sm">Receiver</span>
              <span className="text-white text-sm font-medium">
                {!isSupporter ? "You" : truncateAddress(receiver)}
              </span>
            </div>
            {flowRateParam && (
              <div className="flex justify-between items-center px-4 py-3 border-b border-t2-border">
                <span className="text-gray-400 text-sm">Network Rate</span>
                <span className="text-white text-sm font-medium">
                  {formatFlow(flowRateParam)}/month
                </span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-gray-400 text-sm">Start Date</span>
              <span className="text-white text-sm font-medium">
                {startDate ?? "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Action Button — pushed to bottom with auto margin */}
        {isSupporter && (
          <div className="mt-6">
            {isActive ? (
              <Link
                to={`/stop-support?address=${receiver}&flowRate=${flowRateParam}`}
                className="block w-full text-center bg-green-600/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 py-3.5 rounded-xl font-semibold transition-colors"
              >
                Stop Support Stream
              </Link>
            ) : (
              <Link
                to={`/trust?address=${receiver}`}
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-colors"
              >
                Resume Support
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
