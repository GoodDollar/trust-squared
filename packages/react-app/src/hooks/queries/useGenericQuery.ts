import { useQuery } from "@tanstack/react-query";

export const useGenericQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  enabled: boolean = true
) => {
  const {
    data,
    status: queryStatus,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: queryFn,
    enabled: enabled,
  });

  const refetch = async () => {
    await queryRefetch();
  };

  return {
    data,
    status: queryStatus,
    error,
    refetch,
  };
};
