import TrustAccount from "@/components/TrustAccount";
import { useGetMember, useGetMemberTrustees, useGetMemberTrusters } from "@/hooks/queries/useGetMember";

import { useBalanceStream } from "@/hooks/useBalanceStream";
import { formatScore, formatFlow } from "@/utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount, useDisconnect } from "wagmi";


import { useState } from "react";

export default function Dashboard() {
    const [showLogoutMenu, setShowLogoutMenu] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');

    const account = useAccount();
    const { disconnect } = useDisconnect();
    const { data: memberData } = useGetMember(account.address as string);
    const { data: trusteesData } = useGetMemberTrustees(account.address ?? "");
    const { data: trustersData } = useGetMemberTrusters(account.address ?? "");

   
    const balance = useBalanceStream(
        account.address,
       
        BigInt(memberData?.data?.member?.inFlowRate || 0) -
        BigInt(memberData?.data?.member?.outFlowRate || 0)
    );

    const { user = {}, handleLogOut } = useDynamicContext();

    const supporters = trusteesData?.data?.member?.trustees?.length || 0;
    const delegates = trustersData?.data?.member?.trusters?.length || 0;
    const totalInflow = trusteesData?.data?.member?.trustees?.reduce((acc, curr) => acc + Number(curr.flowRate), 0) || 0;
    const totalOutflow = trustersData?.data?.member?.trusters?.reduce((acc, curr) => acc + Number(curr.flowRate), 0) || 0;
    const netFlow = totalInflow - totalOutflow;
 
    const formattedBalance = balance?.toString() || "0";
    const trustScore = formatScore(memberData?.data?.member?.trustScore || "");

    // const handleLogout = async () => {
    //     try {
    //         disconnect();
    //         await handleLogOut();
    //         setShowLogoutMenu(false);
    //     } catch (error) {
    //         console.error("Logout error:", error);
    //     }
    // };

    function generateChartData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const maxDataValue = Math.max(supporters, delegates, 1);
        return days.map((day, index) => ({
            day,
            supporters: Math.floor(Math.random() * (maxDataValue + 1)),
            delegates: Math.floor(Math.random() * (maxDataValue + 1)),
        }));
    }

    const chartData = generateChartData();
    const chartMaxValue = Math.max(supporters, delegates, 20);

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="flex items-center justify-between px-6 pt-8 pb-6">
                {account.address && (
                    <div className="flex flex-col">
                        <TrustAccount
                            address={account.address as string}
                           
                          name={(user as { email?: string })?.email?.split("@")[0] || ""

                            }
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-400 text-sm">Trust Score</span>
                            <span className="text-green-400 text-sm font-medium">{trustScore || "0"}</span>
                        </div>
                    </div>
                )}

                {/* <div className="relative">
                    <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                    >
                        <Settings className="h-6 w-6" />
                    </button>

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
                </div> */}
            </div>
        {showLogoutMenu && (
  <button
    tabIndex={0}
    className="fixed inset-0 z-40"
    onClick={() => setShowLogoutMenu(false)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        setShowLogoutMenu(false);
      }
    }}
  />
)}

            <div className="px-6 space-y-6">
                <div className="flex center bg-gray-800 rounded-full p-3 w-fit ">
                    {(['Day', 'Week', 'Month', 'Year'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedPeriod === period
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                <div className="flex items-start justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                                <p className="text-blue-400 text-sm">Supporters</p>
                                <p className="text-white text-2xl font-bold">{supporters}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <div>
                                <p className="text-purple-400 text-sm">Delegates</p>
                                <p className="text-white text-2xl font-bold">{delegates}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                className="text-gray-800"
                            />
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 50}`}
                                strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(Math.abs(netFlow) / 10000, 1))}`}
                                className="text-green-500"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-green-400 text-lg font-bold">
                                $ {Math.abs(netFlow) > 0 ? formatFlow(Math.abs(netFlow).toString()) : formattedBalance || '0'}
                            </p>
                            <p className="text-xs text-gray-400">Net Flow</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 relative">
                    <div className="absolute left-4 top-4 flex flex-col justify-between h-40 text-xs text-gray-500">
                        <span>{chartMaxValue}</span>
                        <span>{Math.floor(chartMaxValue * 0.75)}</span>
                        <span>{Math.floor(chartMaxValue * 0.5)}</span>
                        <span>{Math.floor(chartMaxValue * 0.25)}</span>
                        <span>0</span>
                    </div>
                    
                    <div className="ml-8 h-48 flex items-end justify-between gap-3">
                        {chartData.map((data, index) => (
                            <div key={data.day} className="flex flex-col items-center gap-2 flex-1">
                                <div className="flex flex-col items-center gap-1 h-40 justify-end">
                                    <div
                                        className="w-4 bg-blue-500 rounded-sm"
                                        style={{
                                            height: `${Math.max((data.supporters / chartMaxValue) * 160, 4)}px`
                                        }}
                                    ></div>
                                    <div
                                        className="w-4 bg-purple-500 rounded-sm"
                                        style={{
                                            height: `${Math.max((data.delegates / chartMaxValue) * 160, 4)}px`
                                        }}
                                    ></div>
                                </div>
                                <span className="text-gray-400 text-xs">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pb-24"></div>
        </div>
    );
}