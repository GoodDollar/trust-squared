import { useGetMember, useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { formatScore, truncateAddress } from "@/utils";
import { useAccount, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import VerificationBanner from "@/components/VerificationBanner";
import { Gift, Search, Bell, ChevronRight, ThumbsUp, BarChart3, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Blockies from "react-blockies";
import { useState } from "react";

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1742484/trustsquared/v2.0.0";

type FlowEvent = { rate: bigint; timestamp: number };

// Fetch all TrustUpdated events for this address (both in and out)
function useFlowEvents(address: string | undefined) {
  return useQuery({
    queryKey: ["flowEvents", address],
    queryFn: async () => {
      const addr = address!.toLowerCase();

      const [inRes, outRes] = await Promise.all([
        fetch(SUBGRAPH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{ trustUpdateds(where: { recipient: "${addr}" } orderBy: blockTimestamp orderDirection: asc first: 1000) { totalTrusteeInFlow blockTimestamp } }`,
          }),
        }),
        fetch(SUBGRAPH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{ trustUpdateds(where: { truster: "${addr}" } orderBy: blockTimestamp orderDirection: asc first: 1000) { totalTrusterOutFlow blockTimestamp } }`,
          }),
        }),
      ]);

      const inJson = await inRes.json();
      const outJson = await outRes.json();

      const inEvents: FlowEvent[] = (inJson?.data?.trustUpdateds || []).map(
        (e: { totalTrusteeInFlow: string; blockTimestamp: string }) => ({
          rate: BigInt(e.totalTrusteeInFlow),
          timestamp: Number(e.blockTimestamp),
        })
      );
      const outEvents: FlowEvent[] = (outJson?.data?.trustUpdateds || []).map(
        (e: { totalTrusterOutFlow: string; blockTimestamp: string }) => ({
          rate: BigInt(e.totalTrusterOutFlow),
          timestamp: Number(e.blockTimestamp),
        })
      );

      return { inEvents, outEvents };
    },
    enabled: !!address,
  });
}

// Calculate total G$ flowed for a list of rate-change events within a time range
function calcVolume(events: FlowEvent[], rangeStart: number, rangeEnd: number): bigint {
  if (events.length === 0) return 0n;
  let total = 0n;
  for (let i = 0; i < events.length; i++) {
    const rate = events[i].rate;
    const evStart = events[i].timestamp;
    const evEnd = i + 1 < events.length ? events[i + 1].timestamp : rangeEnd;
    // Clamp to range
    const start = Math.max(evStart, rangeStart);
    const end = Math.min(evEnd, rangeEnd);
    if (end > start) {
      total += rate * BigInt(end - start);
    }
  }
  return total;
}

// Get bucket labels and time ranges for each period
function getBuckets(period: TimePeriod): { label: string; start: number; end: number }[] {
  const now = Math.floor(Date.now() / 1000);
  const buckets: { label: string; start: number; end: number }[] = [];

  if (period === "1 Min") {
    // Last 7 minutes
    for (let i = 6; i >= 0; i--) {
      const end = now - i * 60;
      const start = end - 60;
      buckets.push({ label: `${i === 0 ? "Now" : `-${i}m`}`, start, end });
    }
  } else if (period === "Day") {
    // Last 7 days (Sun-Sat style)
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date((now - i * 86400) * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000;
      buckets.push({ label: DAYS[d.getDay()], start: dayStart, end: dayStart + 86400 });
    }
  } else if (period === "Week") {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const end = now - i * 7 * 86400;
      const start = end - 7 * 86400;
      buckets.push({ label: `W${4 - i}`, start, end });
    }
  } else if (period === "Month") {
    // Last 6 months
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime() / 1000;
      const endD = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() / 1000;
      buckets.push({ label: MONTHS[d.getMonth()], start, end: endD });
    }
  } else {
    // Year - last 5 years
    const thisYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const y = thisYear - i;
      const start = new Date(y, 0, 1).getTime() / 1000;
      const end = new Date(y + 1, 0, 1).getTime() / 1000;
      buckets.push({ label: `${y}`, start, end });
    }
  }
  return buckets;
}

// Compute all-time totals from events
function calcAllTime(inEvents: FlowEvent[], outEvents: FlowEvent[]) {
  const now = Math.floor(Date.now() / 1000);
  let totalIn = 0n;
  for (let i = 0; i < inEvents.length; i++) {
    const start = inEvents[i].timestamp;
    const end = i + 1 < inEvents.length ? inEvents[i + 1].timestamp : now;
    totalIn += inEvents[i].rate * BigInt(end - start);
  }
  let totalOut = 0n;
  for (let i = 0; i < outEvents.length; i++) {
    const start = outEvents[i].timestamp;
    const end = i + 1 < outEvents.length ? outEvents[i + 1].timestamp : now;
    totalOut += outEvents[i].rate * BigInt(end - start);
  }
  return { totalIn, totalOut, net: totalIn - totalOut };
}

function formatGd(wei: bigint): string {
  const val = Number(formatUnits(wei, 18));
  if (val === 0) return "0";
  if (val < 0.01 && val > -0.01) return val.toFixed(4);
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const UBI_CONTRACT = "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as const;
const UBI_ABI = [
  {
    name: "checkEntitlement",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

type TimePeriod = "1 Min" | "Day" | "Week" | "Month" | "Year";

function BarChart({ inEvents, outEvents, period }: {
  inEvents: FlowEvent[];
  outEvents: FlowEvent[];
  period: TimePeriod;
}) {
  const buckets = getBuckets(period);
  const maxBarHeight = 80;

  // Compute in/out/net per bucket
  const data = buckets.map((b) => {
    const inVal = Number(formatUnits(calcVolume(inEvents, b.start, b.end), 18));
    const outVal = Number(formatUnits(calcVolume(outEvents, b.start, b.end), 18));
    return { label: b.label, inVal, outVal, net: inVal - outVal };
  });

  const maxVal = Math.max(...data.map((d) => Math.max(d.inVal, d.outVal)), 1);

  // Y-axis labels
  const yTop = Math.ceil(maxVal * 1.2);
  const yLabels = [yTop, Math.round(yTop * 0.75), Math.round(yTop * 0.5), Math.round(yTop * 0.25), 0];
  const fmtY = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`;

  return (
    <div className="bg-t2-card border border-t2-border rounded-xl p-4">
      <div className="flex">
        {/* Y axis */}
        <div className="flex flex-col justify-between text-right pr-3 text-gray-500 text-[10px]" style={{ height: maxBarHeight + 20 }}>
          {yLabels.map((label, i) => (
            <span key={i}>{fmtY(label)}</span>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end justify-between gap-1" style={{ height: maxBarHeight + 20 }}>
          {data.map((d) => {
            const inH = yTop > 0 ? (d.inVal / yTop) * maxBarHeight : 0;
            const outH = yTop > 0 ? (d.outVal / yTop) * maxBarHeight : 0;
            const netH = yTop > 0 ? (Math.abs(d.net) / yTop) * maxBarHeight : 0;
            return (
              <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: maxBarHeight }}>
                  <div
                    className="w-2 bg-green-500 rounded-t-sm"
                    style={{ height: Math.max(inH, 2) }}
                  />
                  <div
                    className="w-2 bg-purple-500 rounded-t-sm"
                    style={{ height: Math.max(outH, 2) }}
                  />
                  <div
                    className="w-2 bg-blue-500 rounded-t-sm"
                    style={{ height: Math.max(netH, 2) }}
                  />
                </div>
                <span className="text-gray-500 text-[10px]">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const account = useAccount();
  const { data, status: memberStatus } = useGetMember(account.address ?? "");
  const { data: trusteesData } = useGetMemberTrustees(account.address ?? "");
  const { data: trustersData } = useGetMemberTrusters(account.address ?? "");

  const { data: flowData } = useFlowEvents(account.address);
  const inEvents = flowData?.inEvents ?? [];
  const outEvents = flowData?.outEvents ?? [];

  const trustScore = formatScore(data?.data?.member?.trustScore || "");
  const displayName = truncateAddress(account.address || "");

  const supporters = trustersData?.data?.member?.trusters?.length || 0;
  const receivers = trusteesData?.data?.member?.trustees?.length || 0;

  const [activePeriod, setActivePeriod] = useState<TimePeriod>("Day");

  // Compute net flow for selected period
  const periodBuckets = getBuckets(activePeriod);
  const periodStart = periodBuckets[0]?.start ?? 0;
  const periodEnd = periodBuckets[periodBuckets.length - 1]?.end ?? Math.floor(Date.now() / 1000);
  const periodIn = calcVolume(inEvents, periodStart, periodEnd);
  const periodOut = calcVolume(outEvents, periodStart, periodEnd);
  const netFlow = periodIn - periodOut;

  const { data: entitlement } = useReadContract({
    address: UBI_CONTRACT,
    abi: UBI_ABI,
    functionName: "checkEntitlement",
    query: { enabled: !!account.address },
  });

  const canClaim = entitlement ? BigInt(entitlement) > 0n : false;

  // Donut chart calculations
  const totalActivity = supporters + receivers;
  const progress = Math.min(totalActivity / 20, 1);
  const circumference = 2 * Math.PI * 50;
  const dashOffset = circumference * (1 - progress);

  const periods: TimePeriod[] = ["1 Min", "Day", "Week", "Month", "Year"];

  if (!account.address) {
    return (
      <div className="min-h-screen bg-t2-dark text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            <Link to="/explore" className="w-9 h-9 bg-t2-card border border-t2-border rounded-full flex items-center justify-center">
              <Search className="h-4 w-4 text-gray-400" />
            </Link>
            <Link to="/streams" className="w-9 h-9 bg-t2-card border border-t2-border rounded-full flex items-center justify-center">
              <Bell className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      <VerificationBanner />

      <div className="px-5 space-y-5">
        {/* Time Period Tabs */}
        <div className="flex items-center gap-1 bg-t2-card border border-t2-border rounded-full p-1">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`flex-1 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activePeriod === period
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Supporters / Receivers + Net Flow Donut */}
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="bg-t2-card border border-t2-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                <span className="text-white text-sm font-semibold">Supporters</span>
              </div>
              <p className="text-white text-2xl font-bold">{supporters}</p>
            </div>
            <div className="bg-t2-card border border-t2-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                <span className="text-white text-sm font-semibold">Receivers</span>
              </div>
              <p className="text-white text-2xl font-bold">{receivers}</p>
            </div>
          </div>

          {/* Net Flow Donut */}
          <div className="relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-t2-border" />
              <circle
                cx="60" cy="60" r="50"
                stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                className={netFlow >= 0n ? "text-green-500" : "text-red-500"}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {memberStatus === "pending" ? (
                <div className="h-5 w-16 bg-t2-card-light rounded animate-pulse" />
              ) : (
                <>
                  <p className={`text-sm font-bold ${netFlow >= 0n ? "text-green-400" : "text-red-400"}`}>
                    {formatGd(netFlow)} G$
                  </p>
                  <p className="text-xs text-gray-400">Net Flow</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <BarChart inEvents={inEvents} outEvents={outEvents} period={activePeriod} />

        {/* Claim button */}
        {canClaim && (
          <Link
            to="/claim"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 rounded-xl py-4 transition-colors"
          >
            <Gift className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Claim Daily G$</span>
          </Link>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <p className="text-gray-500 text-xs uppercase tracking-wider px-1">Quick Actions</p>
          <Link
            to="/trust"
            className="flex items-center justify-between bg-t2-card border border-t2-border rounded-xl p-4 hover:bg-t2-card-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-600/20 p-2.5 rounded-full">
                <ThumbsUp className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-white text-sm font-medium">Support Someone</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Link>
          <Link
            to="/streams"
            className="flex items-center justify-between bg-t2-card border border-t2-border rounded-xl p-4 hover:bg-t2-card-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-600/20 p-2.5 rounded-full">
                <BarChart3 className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-white text-sm font-medium">View My Support Streams</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
