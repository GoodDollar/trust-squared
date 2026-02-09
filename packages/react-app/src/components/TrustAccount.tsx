import { getAddressLink } from "@/utils";
import Blockies from "react-blockies";
import { Link } from "react-router-dom";

interface ProfileCardProps {
  address: string;
  name?: string;
}

// Helper function to truncate address
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function TrustAccount({ address, name = "" }: ProfileCardProps) {
  console.log("TrustAccount received:", { address, name }); // للـ debugging
  
  const displayName = name?.trim() || truncateAddress(address);
  
  return (
    <div className="flex items-center p-4 rounded-lg px-4">
      {/* Profile Picture */}
      <Blockies as any
        seed={address.toLowerCase()}
        size={10}
        scale={5}
        className="rounded-full"
      />

      {/* Name and Wallet */}
      <div className="ml-4 flex flex-col">
        <Link
          to={getAddressLink(address)}
          className="font-medium text-lg underline text-white hover:text-green-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          {displayName}
        </Link>
        <span className="text-sm text-gray-500 mt-1">
          {truncateAddress(address)}
        </span>
      </div>
    </div>
  );
}