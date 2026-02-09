import { type Member } from "@/types";
import { useGenericQuery } from "./useGenericQuery";

const fetchTrusteesData = async (memberId: string) => {
  return fetch(
    "https://api.studio.thegraph.com/query/59211/trustsquared/version/latest",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
              query MyQuery {
                member(id: "${memberId}") {
                
                  trustees {
                    flowRate
                    id
                  }
                }
              }
            `,
      }),
    }
  ).then((res) => res.json()) as Promise<Member>;
};

const fetchMemberData = async (memberId: string) => {
  return fetch(
    "https://api.studio.thegraph.com/query/59211/trustsquared/version/latest",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
              query MyQuery {
                member(id: "${memberId}") {
                  id
                  inFlowRate
                  outFlowRate
                  trustScore
                }
              }
            `,
      }),
    }
  ).then((res) => res.json()) as Promise<Member>;
};

const fetchTrustersData = async (memberId: string) => {
  return fetch(
    "https://api.studio.thegraph.com/query/59211/trustsquared/version/latest",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
              query MyQuery {
                member(id: "${memberId}") {
                 
                  trusters {
                    flowRate
                    id
                  }
                }
              }
            `,
      }),
    }
  ).then((res) => res.json()) as Promise<Member>;
};

export const useGetMemberTrustees = (memberId: string) => {
  const queryKey = ["trustees", memberId];
  const queryFn = () => fetchTrusteesData(memberId);
  return useGenericQuery(queryKey, queryFn);
};

export const useGetMemberTrusters = (memberId: string) => {
  const queryKey = ["trusters", memberId];
  const queryFn = () => fetchTrustersData(memberId);
  return useGenericQuery(queryKey, queryFn);
};

export const useGetMember = (memberId: string) => {
  const queryKey = ["member", memberId];
  const queryFn = () => fetchMemberData(memberId);
  return useGenericQuery(queryKey, queryFn, !!memberId && memberId.length > 0);
};
