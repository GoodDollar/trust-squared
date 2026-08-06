import { formatUnits } from "viem";

// Helper function to truncate address
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const SAMPLE_ADDRESS = "0x2CeADe86A04e474F3cf9BD87208514d818010627";

export const formatScore = (rate: string) => {
  if (!rate || rate == "0") return "0.00 ☘️";
  const score = (Number(rate) / 1e18) * 1e5;
  const vals = score.toString().split(".");
  return vals[0] + "." + vals[1].slice(0, 2) + " ☘️";
};

export const formatFlow = (flow: string) => {
  return (Number(formatUnits(BigInt(flow), 18)) * 2592000).toLocaleString() + " G$";
};

export function getAddressLink(address: string) {
  return `https://explorer.celo.org/address/${address}`;
}
