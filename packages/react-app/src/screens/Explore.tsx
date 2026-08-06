import { useMemo, useState } from "react";
import { useGenericQuery } from "@/hooks/queries/useGenericQuery";
import { formatScore, truncateAddress } from "@/utils";
import { ArrowLeft, Search, Users } from "lucide-react";
import Blockies from "react-blockies";
import { Link, useNavigate } from "react-router-dom";
import ErrorState from "@/components/ErrorState";

interface CommunityMember {
  id: string;
  trustScore: string;
  inFlowRate: string;
  trusters: { id: string }[];
}

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1742484/trustsquared/v2.0.0";

// Fetch all members + newest-order info in one go
const fetchAllMembers = async () => {
  const [membersRes, eventsRes] = await Promise.all([
    fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          members(first: 100, orderBy: trustScore, orderDirection: desc) {
            id
            trustScore
            inFlowRate
            trusters { id }
          }
        }`,
      }),
    }).then((r) => r.json()),
    fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          trustUpdateds(first: 200, orderBy: blockTimestamp, orderDirection: desc) {
            truster
            recipient
          }
        }`,
      }),
    }).then((r) => r.json()),
  ]);

  // Build newest-order map from events
  const seen = new Set<string>();
  const newestOrder: string[] = [];
  for (const e of eventsRes?.data?.trustUpdateds || []) {
    const truster = (e.truster as string).toLowerCase();
    const recipient = (e.recipient as string).toLowerCase();
    if (!seen.has(recipient)) { seen.add(recipient); newestOrder.push(recipient); }
    if (!seen.has(truster)) { seen.add(truster); newestOrder.push(truster); }
  }

  return {
    members: (membersRes?.data?.members || []) as CommunityMember[],
    newestOrder,
  };
};

type SortMode = "trustScore" | "supporters" | "newest";

export default function Explore() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortMode>("trustScore");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, status, refetch } = useGenericQuery(
    ["community"],
    fetchAllMembers
  );

  const members = data?.members || [];
  const newestOrder = data?.newestOrder || [];

  // Sort client-side based on selected tab
  const sortedMembers = useMemo(() => {
    const list = [...members];
    if (sortBy === "trustScore") {
      list.sort((a, b) => {
        const aScore = BigInt(a.trustScore || "0");
        const bScore = BigInt(b.trustScore || "0");
        if (bScore > aScore) return 1;
        if (bScore < aScore) return -1;
        return 0;
      });
    } else if (sortBy === "supporters") {
      list.sort((a, b) => (b.trusters?.length || 0) - (a.trusters?.length || 0));
    } else {
      const orderMap = new Map(newestOrder.map((addr, i) => [addr, i]));
      list.sort((a, b) =>
        (orderMap.get(a.id.toLowerCase()) ?? 999) - (orderMap.get(b.id.toLowerCase()) ?? 999)
      );
    }
    return list;
  }, [members, newestOrder, sortBy]);

  const query = searchQuery.toLowerCase().replace(/^@/, "");
  const filteredMembers = query
    ? sortedMembers.filter((m) => m.id.toLowerCase().includes(query))
    : sortedMembers;

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Explore Community</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-t2-card border border-t2-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-green-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Sort Tabs - pill shaped */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSortBy("trustScore")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              sortBy === "trustScore"
                ? "bg-green-600 text-white"
                : "bg-t2-card border border-t2-border text-gray-400 hover:text-white"
            }`}
          >
            Highest Trust Score
          </button>
          <button
            onClick={() => setSortBy("supporters")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              sortBy === "supporters"
                ? "bg-green-600 text-white"
                : "bg-t2-card border border-t2-border text-gray-400 hover:text-white"
            }`}
          >
            Most Supported
          </button>
          <button
            onClick={() => setSortBy("newest")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              sortBy === "newest"
                ? "bg-green-600 text-white"
                : "bg-t2-card border border-t2-border text-gray-400 hover:text-white"
            }`}
          >
            Newest
          </button>
        </div>

        {/* Members List */}
        {status === "error" ? (
          <ErrorState
            title="Failed to load community"
            message="Could not fetch community members. Check your connection and try again."
            onRetry={refetch}
          />
        ) : status === "pending" ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const score = formatScore(member.trustScore);
              const scoreNum = score.replace(" ☘️", "");
              const supporterCount = member.trusters?.length || 0;
              const isNew = Number(member.trustScore) === 0;

              return (
                <div
                  key={member.id}
                  className="bg-t2-card border border-t2-border rounded-xl p-4"
                >
                  {/* Top row: avatar + name + score */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Blockies
                        seed={member.id.toLowerCase()}
                        size={8}
                        scale={5}
                        className="rounded-full flex-shrink-0"
                      />
                      <div>
                        <p className="text-white font-medium text-sm">
                          {truncateAddress(member.id)}
                        </p>
                        <p className="text-gray-500 text-xs">
                          @{member.id.slice(2, 10).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isNew ? (
                        <>
                          <p className="text-gray-400 text-2xl font-bold">- - -</p>
                          <p className="text-gray-500 text-xs">PENDING</p>
                        </>
                      ) : (
                        <>
                          <p className="text-green-400 text-2xl font-bold">{scoreNum}</p>
                          <p className="text-gray-500 text-xs">TRUST SCORE</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: supporters count + support button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {supporterCount >= 1000
                          ? (supporterCount / 1000).toFixed(1) + "k"
                          : supporterCount}
                      </span>
                      <span>Supporters</span>
                    </div>
                    <Link
                      to={`/trust?address=${member.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      Support
                    </Link>
                  </div>

                  {isNew && (
                    <p className="text-green-400 text-xs font-medium mt-2">NEW MEMBER</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
