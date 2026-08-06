import { useVerifiedIdentities } from "@/hooks/useVerifiedIdentities";
import { useVerifier } from "@/hooks/queries/useVerifier";
import { useAccount } from "wagmi";
import { ArrowLeft, BadgeCheck, ExternalLink, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GOODDOLLAR_VERIFY_URL = "https://wallet.gooddollar.org";

export default function Verify() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const identities = useVerifiedIdentities(address);
  const { data: verifierData, status } = useVerifier();

  const identityList = [
    {
      name: "GoodID",
      key: "GoodID",
      description: "Verify through GoodDollar's identity system",
      verified: identities?.GoodID || false,
      action: GOODDOLLAR_VERIFY_URL,
    },
    {
      name: "World ID",
      key: "WorldID",
      description: "Verify through World ID biometric proof",
      verified: identities?.WorldID || false,
      action: null,
    },
    {
      name: "Nouns DAO",
      key: "NoundsDAO",
      description: "Verify through Nouns DAO membership",
      verified: identities?.NoundsDAO || false,
      action: null,
    },
    {
      name: "BrightID",
      key: "BrightID",
      description: "Verify through BrightID social identity",
      verified: identities?.BrightID || false,
      action: null,
    },
  ];

  const verifiedCount = identityList.filter((i) => i.verified).length;

  return (
    <div className="min-h-screen bg-t2-dark text-white pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-t2-card-light rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-white font-semibold text-lg">Identity Verification</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Status Card */}
        <div className="bg-t2-card border border-t2-border rounded-2xl p-5 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-600/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-white text-lg font-semibold mb-1">
            {verifiedCount > 0 ? `${verifiedCount} Identity Verified` : "Not Verified Yet"}
          </h2>
          <p className="text-gray-400 text-sm">
            {verifiedCount > 0
              ? "You can stream G$ and build your Trust Score"
              : "Verify at least one identity to start streaming G$ to others"}
          </p>
        </div>

        {/* Why Verify */}
        <div className="bg-t2-card border border-t2-border rounded-xl p-4">
          <h3 className="text-white font-medium mb-2">Why verify?</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              Both parties must share a verified identity to stream
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              Prevents sybil attacks and ensures unique humans
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              Higher verification increases your Trust Score weight
            </li>
          </ul>
        </div>

        {/* Verifier Status */}
        {status === "pending" && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
          </div>
        )}

        {verifierData && (
          <div className="bg-t2-card border border-t2-border rounded-xl p-4">
            <h3 className="text-white font-medium mb-2">API Verification Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GoodID (API)</span>
                <span className={verifierData.isGoodId ? "text-green-400" : "text-gray-500"}>
                  {verifierData.isGoodId ? "Verified" : "Not verified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nouns (API)</span>
                <span className={verifierData.isNouns ? "text-green-400" : "text-gray-500"}>
                  {verifierData.isNouns ? "Verified" : "Not verified"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Identity Options */}
        <div className="space-y-3">
          <h3 className="text-white font-medium px-1">Verification Methods</h3>
          {identityList.map((identity) => (
            <div
              key={identity.key}
              className="bg-t2-card border border-t2-border rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    identity.verified ? "bg-green-600/20" : "bg-t2-card-light"
                  }`}
                >
                  {identity.verified ? (
                    <BadgeCheck className="h-5 w-5 text-green-400" />
                  ) : (
                    <Shield className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{identity.name}</p>
                  <p className="text-gray-500 text-xs">{identity.description}</p>
                </div>
              </div>

              {identity.verified ? (
                <span className="text-green-400 text-xs font-medium bg-green-600/15 px-3 py-1 rounded-full">
                  Verified
                </span>
              ) : identity.action ? (
                <a
                  href={identity.action}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-400 text-xs font-medium bg-green-600/15 px-3 py-1.5 rounded-full hover:bg-green-600/25 transition-colors"
                >
                  Verify <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-gray-600 text-xs">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
