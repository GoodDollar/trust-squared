import { useState } from "react";
import { useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { formatFlow, truncateAddress } from "@/utils";
import { ArrowLeft, X, FileText, ChevronRight, Loader2, Users } from "lucide-react";
import Blockies from "react-blockies";
import { useAccount } from "wagmi";
import { useNavigate, Link } from "react-router-dom";
import ErrorState from "@/components/ErrorState";

type Tab = "give" | "receive";

export default function SupportStreams() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("give");

  const { data: trusteesData, status: trusteesStatus, refetch: refetchTrustees } = useGetMemberTrustees(address ?? "");
  const { data: trustersData, status: trustersStatus, refetch: refetchTrusters } = useGetMemberTrusters(address ?? "");

  const isLoading = trusteesStatus === "pending" || trustersStatus === "pending";
  const isError = trusteesStatus === "error" || trustersStatus === "error";

  const trustees = trusteesData?.data?.member?.trustees || [];
  const trusters = trustersData?.data?.member?.trusters || [];

  const listData = activeTab === "give" ? trustees : trusters;

  // Stats for "receive" tab (only count active streams)
  const activeTrusters = trusters.filter((t) => BigInt(t.flowRate) > 0n);
  const totalSupporters = activeTrusters.length;
  const totalIncoming = activeTrusters.reduce((acc, t) => {
    const flow = formatFlow(t.flowRate.toString());
    return acc + parseFloat(flow.replace(/[^0-9.]/g, "") || "0");
  }, 0);

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Support Streams</h1>
        <button onClick={() => navigate("/")} className="p-1 hover:bg-t2-card-light rounded-full">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* Tab Navigation */}
        <div className="flex bg-t2-card border border-t2-border rounded-full p-1">
          <button
            onClick={() => setActiveTab("give")}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === "give"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Support I Give
          </button>
          <button
            onClick={() => setActiveTab("receive")}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === "receive"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Support I Receive
          </button>
        </div>

        {/* Stats cards for "receive" tab */}
        {activeTab === "receive" && !isLoading && !isError && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-t2-card border border-t2-border rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Supporters</p>
                <p className="text-white text-3xl font-bold">{totalSupporters}</p>
              </div>
              <div className="bg-t2-card border border-t2-border rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Incoming</p>
                <p className="text-white text-3xl font-bold">
                  {totalIncoming.toFixed(0)} <span className="text-green-400 text-sm">G$/month</span>
                </p>
              </div>
            </div>

            {totalSupporters > 0 && (
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Active Incoming Streams</h3>
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">LIVE</span>
              </div>
            )}
          </>
        )}

        {/* Stream List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load streams"
            message="Could not fetch your support streams. Please try again."
            onRetry={() => { refetchTrustees(); refetchTrusters(); }}
          />
        ) : listData.length === 0 ? (
          <div className="bg-t2-card border border-t2-border rounded-xl p-8 text-center">
            <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {activeTab === "give"
                ? "You're not supporting anyone yet"
                : "No one is supporting you yet"}
            </p>
            {activeTab === "give" && (
              <Link
                to="/trust"
                className="inline-block mt-3 text-green-400 text-sm font-medium hover:underline"
              >
                Start supporting someone
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {listData.map((item) => {
              const addr =
                activeTab === "give"
                  ? item.id.split("_")[1]
                  : item.id.split("_")[0];
              const isActive = BigInt(item.flowRate) > 0n;
              const monthlyFlow = formatFlow(item.flowRate.toString());

              return (
                <div
                  key={item.id}
                  className="bg-t2-card border border-t2-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <Blockies
                        seed={addr.toLowerCase()}
                        size={8}
                        scale={5}
                        className="rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{truncateAddress(addr)}</p>
                        <p className={`text-sm font-medium ${isActive ? "text-green-400" : "text-red-400"}`}>
                          {monthlyFlow} / month
                        </p>
                        <p className="text-gray-500 text-xs">
                          {isActive ? "Started: Active" : "Last Active: Stopped"}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-orange-500"}`} />
                      <span className={`font-medium px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "text-green-400 border-green-500/30"
                          : "text-orange-400 border-orange-500/30"
                      }`}>
                        {isActive ? "ACTIVE" : "PAUSED"}
                      </span>
                    </span>
                  </div>

                  {activeTab === "give" ? (
                    <div className="flex gap-2 mt-3">
                      {isActive ? (
                        <>
                          <Link
                            to={`/stream-details?trustId=${item.id}&flowRate=${item.flowRate}`}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl font-medium transition-colors"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/stop-support?trustId=${item.id}&address=${addr}&flowRate=${item.flowRate}`}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm py-2.5 rounded-xl font-medium transition-colors"
                          >
                            Stop Support
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/trust?address=${addr}`}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 text-sm py-2.5 rounded-xl font-medium transition-colors"
                          >
                            Resume Support
                          </Link>
                          <button
                            className="flex-1 flex items-center justify-center gap-1.5 border border-t2-border text-gray-400 hover:bg-t2-card-light text-sm py-2.5 rounded-xl font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={`/stream-details?trustId=${item.id}&flowRate=${item.flowRate}`}
                      className="flex items-center gap-1.5 text-green-400 text-sm font-medium mt-3 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Details
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
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
