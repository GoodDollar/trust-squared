import { useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { formatFlow, truncateAddress } from "@/utils";
import Blockies from "react-blockies";
import { useAccount } from "wagmi";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Trustees() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'trustees' | 'trusters'>('trustees');

  const { data: trusteesData } = useGetMemberTrustees(address ?? "");
  const { data: trustersData } = useGetMemberTrusters(address ?? "");

  const listData = activeTab === 'trustees'
    ? trusteesData?.data?.member?.trustees
    : trustersData?.data?.member?.trusters;

  const totalCount = listData?.length || 0;
  const totalFlow = listData?.reduce((acc, curr) => acc + Number(curr.flowRate), 0) || 0;

  return (
    <div className="min-h-screen bg-t2-dark text-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-white font-semibold text-lg">Trust Network</h1>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex bg-t2-card-light rounded-full p-1">
          <button
            onClick={() => setActiveTab('trustees')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'trustees'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trustees
          </button>
          <button
            onClick={() => setActiveTab('trusters')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'trusters'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trusters
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 space-y-4 mb-6">
        <div className="bg-t2-card border border-t2-border rounded-lg p-4 flex justify-between items-center">
          <span className="text-white font-medium">
            {activeTab === 'trustees' ? 'Total Supporters' : 'Total Trusters'}
          </span>
          <span className="text-white text-lg font-semibold">{totalCount}</span>
        </div>

        <div className="bg-t2-card border border-t2-border rounded-lg p-4 flex justify-between items-center">
          <span className="text-white font-medium">
            {activeTab === 'trustees' ? 'Total Inflow' : 'Total Outflow'}
          </span>
          <span className="text-white text-lg font-semibold">
            {totalFlow ? formatFlow(totalFlow.toString()) : '0 G$'}
          </span>
        </div>
      </div>

      {/* Table Headers */}
      <div className="px-6 py-3 border-b border-t2-border">
        <div className="flex justify-between text-gray-400 text-sm font-medium">
          <span>Name</span>
          <span>Amount</span>
        </div>
      </div>

      {/* List Items */}
      <div className="px-6">
        {!listData || listData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No {activeTab === 'trustees' ? 'trustees' : 'trusters'} yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {listData.map((item) => {
              const addr = activeTab === 'trustees'
                ? item.id.split("_")[1]
                : item.id.split("_")[0];

              return (
                <div key={item.id} className="py-4 border-b border-t2-border last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Blockies
                        seed={addr.toLowerCase()}
                        size={8}
                        scale={5}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-white font-medium">
                          {truncateAddress(addr)}
                        </div>
                      </div>
                    </div>
                    <div className="text-white font-medium">
                      {formatFlow(item.flowRate.toString())}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pb-20"></div>
    </div>
  );
}
