import TrustAccount from "@/components/TrustAccount";
import { useGetMember } from "@/hooks/queries/useGetMember";

import { useBalanceStream } from "@/hooks/useBalanceStream";
import { formatScore } from "@/utils";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { QRCodeSVG } from "qrcode.react";
import { useAccount, useDisconnect } from "wagmi";
import { useVerifiedIdentities } from "@/hooks/useVerifiedIdentities";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const account = useAccount();
  const { disconnect } = useDisconnect();
  const { data } = useGetMember(account.address as string);
  const identities = useVerifiedIdentities(account.address);


  const balance = useBalanceStream(
    account.address,

    BigInt(data?.data?.member?.inFlowRate || 0) -
    BigInt(data?.data?.member?.outFlowRate || 0)
  );

  const { user = {}, handleLogOut } = useDynamicContext();

  const supporters = data?.data?.member?.trustees?.length;
  const trustees = data?.data?.member?.trusters?.length;

  const formattedBalance = balance?.toString() + " G$";
  const trustScore = formatScore(data?.data?.member?.trustScore || "");


  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      {/* Header with Profile and Settings */}
      <div className="flex items-center justify-between mb-8">
        {account.address && (
          <TrustAccount
            address={account.address as string}

            name={user?.alias || user?.email?.split("@")[0] || ""}
          />
        )}


      </div>

      {/* Click outside to close dropdown */}
      {showLogoutMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLogoutMenu(false)}
        />
      )}

      {/* Main Content Container */}
      <div className="max-w-sm mx-auto space-y-6">
        {/* QR Code Section */}
        <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center">
          <QRCodeSVG
            bgColor="white"
            fgColor="black"
            className="rounded-lg mb-4"
            value={account.address as string}
            size={160}
            level="H"
            includeMargin={true}
          />
          <p className="text-gray-400 text-sm text-center">
            Scan to receive your funds
          </p>
        </div>

        {/* Stats Section */}
        <div className="space-y-3">
          {/* Supporters and Trustees Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Supporters</h3>
              <p className="text-white text-xl font-semibold">{supporters || 0}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <h3 className="text-gray-400 text-sm font-medium mb-1">Trustees</h3>
              <p className="text-white text-xl font-semibold">{trustees || 0}</p>
            </div>
          </div>

          {/* Balance */}
          <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-400 font-medium">Balance</span>
            <span className="text-white text-lg font-semibold">{formattedBalance || "0 G$"}</span>
          </div>

          {/* Trust Score */}
          <div className="bg-gray-900 rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-400 font-medium">Trust Score</span>
            <span className="text-white text-lg font-semibold">{trustScore || "0"}</span>
          </div>
        </div>

        {/* Verified Identities */}
        {Object.entries(identities || {}).some(([k, v]) => v) && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Verified Identities</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(identities || {}).map(([k, v]) => {
                if (v)
                  return (
                    <div key={k} className="flex items-center gap-2 bg-blue-600 bg-opacity-20 px-3 py-1 rounded-full">
                      <span className="text-blue-400 text-sm capitalize">{k}</span>
                      <BadgeCheck className="h-4 w-4 text-blue-400" />
                    </div>
                  );
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding for navigation */}
      <div className="pb-24"></div>
    </div>
  );
}