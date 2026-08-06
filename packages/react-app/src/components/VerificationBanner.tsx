import { useVerifiedIdentities } from "@/hooks/useVerifiedIdentities";
import { useAccount } from "wagmi";
import { ShieldAlert, BadgeCheck, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function VerificationBanner() {
  const { address } = useAccount();
  const identities = useVerifiedIdentities(address);

  const hasAnyIdentity = Object.entries(identities || {}).some(([, v]) => v);

  if (hasAnyIdentity) return null;

  return (
    <Link
      to="/verify"
      className="flex items-center gap-3 bg-yellow-600/10 border border-yellow-600/20 rounded-xl p-4 mx-5 mb-4"
    >
      <div className="bg-yellow-600/20 p-2 rounded-full flex-shrink-0">
        <ShieldAlert className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-yellow-200 text-sm font-medium">
          Verify Your Identity
        </p>
        <p className="text-yellow-400/70 text-xs">
          Get verified to start streaming and build your Trust Score
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-yellow-400 flex-shrink-0" />
    </Link>
  );
}

export function VerifiedBadge({
  identities,
}: {
  identities: Record<string, boolean> | undefined;
}) {
  const verifiedIds = Object.entries(identities || {}).filter(([, v]) => v);
  if (verifiedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <BadgeCheck className="h-4 w-4 text-green-400" />
      <span className="text-green-400 text-xs font-medium">
        {verifiedIds.map(([k]) => k).join(" + ")}
      </span>
    </div>
  );
}
