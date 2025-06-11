import { VESTING_ADDRESS } from "@/modules/burn-vesting/config";
import { useMemo, useState, useCallback } from "react";
import { useInfiniteReadContracts } from "wagmi";

const useVestingData = (
  userTotalVesting,
  VestingAbi,
  connectedWalletAddress
) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchData = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchContractData = (functionName, cacheKey) => {
    return useInfiniteReadContracts({
      cacheKey: [refreshKey, cacheKey, userTotalVesting],
      contracts: (page) => {
        return [...Array(userTotalVesting)]?.map((v, idx) => {
          return {
            abi: VestingAbi,
            address: VESTING_ADDRESS,
            functionName,
            args: [connectedWalletAddress, idx],
          };
        });
      },
      query: {
        initialPageParam: 0,
        getNextPageParam: (lastPageParam) => lastPageParam + 1,
      },
    });
  };

  const { data: getVestingInfoData } = fetchContractData(
    "getVestingInfo",
    "getVestingInfo"
  );

  const { data: getUnlockedTokenAmountData } = fetchContractData(
    "getUnlockedTokenAmount",
    "getUnlockedTokenAmount"
  );

  const convertedData = useMemo(() => {
    return getVestingInfoData?.pages?.[0]?.map((item, idx) => {
      return {
        allocatedAmount: item?.result?.allocatedAmount
          ? Number(item?.result?.allocatedAmount) / 1e18
          : 0,
        claimEndTimestamp: item?.result?.claimEndTimestamp
          ? Number(item?.result?.claimEndTimestamp)
          : 0,
        claimedAmount: item?.result?.claimedAmount
          ? Number(item?.result?.claimedAmount) / 1e18
          : 0,
        nextClaimTimestamp: item?.result?.nextClaimTimestamp
          ? Number(item?.result?.nextClaimTimestamp)
          : 0,
        unlockedAmount: getUnlockedTokenAmountData?.pages?.[0]?.[idx]
          ?.result?.[0]
          ? Number(getUnlockedTokenAmountData?.pages?.[0]?.[idx]?.result?.[0]) /
            1e18
          : 0,
        startClaimTimestamp: item?.result?.startClaimTimestamp
          ? Number(item?.result?.startClaimTimestamp)
          : 0,
      };
    });
  }, [getVestingInfoData, getUnlockedTokenAmountData]);

  return {
    convertedData,
    refetchData,
  };
};

export default useVestingData;
