import TrustAccount from "@/components/TrustAccount";
import { useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";
import { formatFlow, getAddressLink, truncateAddress } from "@/utils";
import { ExternalLink, Settings, LogOut } from "lucide-react";
import Blockies from "react-blockies";
import { Link } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function History() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { user = {}, handleLogOut } = useDynamicContext();
  const [activeTab, setActiveTab] = useState<'trustees' | 'delegates'>('trustees');
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  // Get both trustees and trusters data
  const { data: trusteesData } = useGetMemberTrustees(address ?? "");
  const { data: trustersData } = useGetMemberTrusters(address ?? "");

  // Calculate stats based on active tab
  const currentData = activeTab === 'trustees' ? trusteesData : trustersData;
  const listData = activeTab === 'trustees' 
    ? trusteesData?.data?.member?.trustees 
    : trustersData?.data?.member?.trusters;

  const totalCount = listData?.length || 0;
  const totalFlow = listData?.reduce((acc, curr) => acc + Number(curr.flowRate), 0) || 0;

  const handleLogout = async () => {
    try {
      disconnect();
      await handleLogOut();
      setShowLogoutMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Profile and Settings */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <TrustAccount 
          address={address || ""} 
          // @ts-ignore
          name={user?.alias || user?.email?.split("@")[0] || ""}
        />
        
        {/* Settings with Logout Dropdown */}
        <div className="relative">
          <button 
            className="text-gray-400 hover:text-white"
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
          >
            <Settings className="h-6 w-6" />
          </button>
          
          {/* Logout Dropdown */}
          {showLogoutMenu && (
            <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 min-w-[150px] z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showLogoutMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLogoutMenu(false)}
        />
      )}

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex bg-gray-800 rounded-full p-1">
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
            onClick={() => setActiveTab('delegates')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'delegates'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Delegates
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 space-y-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
          <span className="text-white font-medium">
            {activeTab === 'trustees' ? 'Total Supporters' : 'Total Delegates'}
          </span>
          <span className="text-white text-lg font-semibold">{totalCount}</span>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
          <span className="text-white font-medium">
            {activeTab === 'trustees' ? 'Total Inflow' : 'Total Outflow'}
          </span>
          <span className="text-white text-lg font-semibold">
            $ {totalFlow ? formatFlow(totalFlow.toString()) : '0'}
          </span>
        </div>
      </div>

      {/* Table Headers */}
      <div className="px-6 py-3 border-b border-gray-800">
        <div className="flex justify-between text-gray-400 text-sm font-medium">
          <span>Name</span>
          <span>Amount</span>
        </div>
      </div>

      {/* List Items */}
      <div className="px-6">
        {!listData || listData.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No {activeTab === 'trustees' ? 'trustees' : 'delegates'} yet</p>
          </div>
        ) : (
          <div className="space-y-0">
            {listData.map((item) => {
              // Handle different ID formats for trustees vs trusters
              const account = activeTab === 'trustees' 
                ? item.id.split("_")[1] 
                : item.id.split("_")[0];
              
              return (
                <div key={item.id} className="py-4 border-b border-gray-800 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Blockies
                        seed={account.toLowerCase()}
                        size={8}
                        scale={5}
                        className="rounded-full"
                      />
                      <div>
                        <div className="text-white font-medium">
                          {truncateAddress(account)}
                        </div>
                      </div>
                    </div>
                    <div className="text-white font-medium">
                      $ {formatFlow(item.flowRate.toString())}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add bottom padding to account for fixed navigation */}
      <div className="pb-20"></div>
    </div>
  );
}