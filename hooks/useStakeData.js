import { useMemo, useState, useCallback } from "react";
import { useInfiniteReadContracts } from "wagmi";

const useStakeData = (config, stakingAbi, connectedWalletAddress) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchData = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const fetchContractData = (key, functionName, args = []) => {
    return useInfiniteReadContracts({
      cacheKey: [key, config, refreshKey],
      contracts: (page) =>
        config?.map((address) => ({
          abi: stakingAbi,
          address: address,
          functionName,
          args,
        })),
      query: {
        initialPageParam: 0,
        getNextPageParam: (lastPageParam) => lastPageParam + 1,
      },
    });
  };

  const { data: poolStakeAmount, isPending: poolStakeAmountPending } =
    fetchContractData("poolStakeAmount", "poolStakeAmount");
  const { data: totalDeposited, isPending: totalDepositedPending } =
    fetchContractData("totalDeposited", "totalDeposited");
  const { data: fixedAmount, isPending: fixedAmountPending } =
    fetchContractData("fixedAmount", "fixedAmount");
  const { data: commissionRate, isPending: commissionRatePending } =
    fetchContractData("commissionRate", "commissionRate");
  const { data: poolName, isPending: poolNamePending } = fetchContractData(
    "poolName",
    "poolName"
  );
  const { data: vacancyAmount, isPending: vacancyAmountPending } =
    fetchContractData("vacancyAmount", "vacancyAmount");
  const { data: userStakes, isPending: userStakesPending } = fetchContractData(
    `userStakes,${connectedWalletAddress}`,
    "userStakes",
    [connectedWalletAddress]
  );

  const { data: lockAfterPoolCompleted, isPending: lockPeriodPending } =
    fetchContractData("lockPeriod", "lockPeriod");

  const {
    data: poolReachedMaxTimestamp,
    isPending: poolReachedMaxTimestampPending,
  } = fetchContractData("poolReachedMaxTimestamp", "poolReachedMaxTimestamp");

  // const { data: withdrawalRequests } = fetchContractData(
  //   "withdrawalRequests",
  //   "withdrawalRequests",
  //   [connectedWalletAddress]
  // );

  const { data: bufferStakeData, isPending: bufferStakePending } =
    fetchContractData("bufferStake", "bufferStake", [connectedWalletAddress]);
  const {
    data: totalRewardDistributedData,
    isPending: totalRewardDistributedPending,
  } = fetchContractData("totalRewardDistributed", "totalRewardDistributed");
  const {
    data: withdrawalAddressesData,
    isPending: getWithdrawalAddressesPending,
  } = fetchContractData("getWithdrawalAddresses", "getWithdrawalAddresses");
  const {
    data: totalBufferDepositedData,
    isPending: totalBufferDepositedPending,
  } = fetchContractData("totalBufferDeposited", "totalBufferDeposited");

  const {
    data: getDepositedAddressesData,
    isPending: getDepositedAddressesPending,
  } = fetchContractData("getDepositedAddresses", "getDepositedAddresses");

  const isLoading = useMemo(() => {
    return (
      poolStakeAmountPending ||
      totalDepositedPending ||
      fixedAmountPending ||
      commissionRatePending ||
      poolNamePending ||
      vacancyAmountPending ||
      userStakesPending ||
      lockPeriodPending ||
      poolReachedMaxTimestampPending ||
      bufferStakePending ||
      totalRewardDistributedPending ||
      getWithdrawalAddressesPending ||
      totalBufferDepositedPending ||
      getDepositedAddressesPending
    );
  }, [
    poolStakeAmountPending,
    totalDepositedPending,
    fixedAmountPending,
    commissionRatePending,
    poolNamePending,
    vacancyAmountPending,
    userStakesPending,
    lockPeriodPending,
    poolReachedMaxTimestampPending,
    bufferStakePending,
    totalRewardDistributedPending,
    getWithdrawalAddressesPending,
    totalBufferDepositedPending,
    getDepositedAddressesPending,
  ]);

  const stakeDataList = useMemo(() => {
    if (!poolStakeAmount?.pages?.[0]) return [];
    return poolStakeAmount?.pages?.[0]?.map((item, idx) => {
      return {
        depositedAddresses:
          getDepositedAddressesData?.pages?.[0]?.[idx]?.result,
        poolStakeAmount: Number(item?.result) / 1e18,
        totalDepositedAmount:
          Number(totalDeposited?.pages?.[0]?.[idx]?.result) / 1e18,
        fixedAmount: Number(fixedAmount?.pages?.[0]?.[idx]?.result) / 1e18,
        commissionRate: Number(commissionRate?.pages?.[0]?.[idx]?.result) / 10,
        poolName: poolName?.pages?.[0]?.[idx]?.result,
        vacancyAmount: vacancyAmount?.pages?.[0]?.[idx]?.result
          ? Number(vacancyAmount?.pages?.[0]?.[idx]?.result) / 1e18
          : 0,
        contractAddress: config?.[idx],
        totalUserStaked:
          Number(userStakes?.pages?.[0]?.[idx]?.result?.[0]) / 1e18,
        userReward: Number(userStakes?.pages?.[0]?.[idx]?.result?.[1]) / 1e18,
        lockPeriod: Number(userStakes?.pages?.[0]?.[idx]?.result?.[2]),

        userWithdrawalRequestAmount: userStakes?.pages?.[0]?.[idx]?.result?.[3]
          ? Number(userStakes?.pages?.[0]?.[idx]?.result?.[3]) / 1e18
          : 0,

        userClaimedAmount: userStakes?.pages?.[0]?.[idx]?.result?.[4]
          ? Number(userStakes?.pages?.[0]?.[idx]?.result?.[4]) / 1e18
          : 0,
        userWithdrawalApprovedStatus:
          userStakes?.pages?.[0]?.[idx]?.result?.[5],
        userClaimStatus: userStakes?.pages?.[0]?.[idx]?.result?.[6],

        lockAfterPoolCompleted: Number(
          lockAfterPoolCompleted?.pages?.[0]?.[idx]?.result
        ),
        // userwithdrawalRequestAmount: Number(
        //   withdrawalRequests?.pages?.[0]?.[idx]?.result?.[0]
        // ),
        // userwithdrawalRequestStatus:
        //   withdrawalRequests?.pages?.[0]?.[idx]?.result?.[1],
        poolReachedMaxTimestamp: Number(
          poolReachedMaxTimestamp?.pages?.[0]?.[idx]?.result
        ),
        bufferStake: bufferStakeData?.pages?.[0]?.[idx]?.result?.[1]
          ? Number(bufferStakeData?.pages?.[0]?.[idx]?.result?.[1]) / 1e18
          : 0,
        totalRewardDistributed: totalRewardDistributedData?.pages?.[0]?.[idx]
          ?.result
          ? Number(totalRewardDistributedData?.pages?.[0]?.[idx]?.result) / 1e18
          : 0,
        withdrawalAddresses: withdrawalAddressesData?.pages?.[0]?.[idx]?.result
          ? withdrawalAddressesData?.pages?.[0]?.[idx]?.result
          : 0,
        totalBufferDeposited: totalBufferDepositedData?.pages?.[0]?.[idx]
          ?.result
          ? Number(totalBufferDepositedData?.pages?.[0]?.[idx]?.result) / 1e18
          : 0,
      };
    });
  }, [
    totalBufferDepositedData,
    poolStakeAmount,
    totalDeposited,
    fixedAmount,
    commissionRate,
    poolName,
    vacancyAmount,
    userStakes,
    lockAfterPoolCompleted,
    // withdrawalRequests,
    poolReachedMaxTimestamp,
    bufferStakeData,
    totalRewardDistributedData,
    withdrawalAddressesData,
    getDepositedAddressesData,
    connectedWalletAddress,
  ]);

  return { stakeDataList, refetchData, isLoading };
};

export default useStakeData;
