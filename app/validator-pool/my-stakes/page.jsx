"use client";
import BreadCrumb from "@/common_component/BreadCrumb";
import CustomButton from "@/common_component/CustomButton";
import PageTitle from "@/common_component/PageTitle";
import useStakeData from "@/hooks/useStakeData";
import { getStackPlans } from "@/modules/validator";
import { maskValue } from "@/utils";
import { formatNice } from "coin-format";
import stakingAbi from "@/abi/stakingAbi.json";
import moment from "moment";
import React, { useMemo, useRef, useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import Timer from "@/common_component/Timer";
import { waitForTransactionReceipt } from "@wagmi/core";
import ConfirmationModal from "@/common_component/ConfirmationModal";
import { toast } from "sonner";

const breadCrumb = [
  {
    text: "Home",
    href: "/home",
  },
  {
    text: "My Stake",
    href: "/validator-pool/my-stakes",
  },
];

const MyStakes = () => {
  const { address } = useAccount();
  const unstakeModalRef = useRef();
  const revertModalRef = useRef();
  const claimModalRef = useRef();
  const [currentSelectedData, setCurrentSelectedData] = useState({});

  const { writeContractAsync, isPending: writeContractPending } =
    useWriteContract();
  const chainConfig = useConfig();
  const {
    data: planList,
    isPending: planListPending,
    refetch: refetchDbPlan,
  } = getStackPlans();

  const contractAddressesList = useMemo(
    () => planList?.map((item) => item?.contractAddress),
    [planList, planListPending, address]
  );
  const {
    stakeDataList: stakeDataListData,
    refetchData,
    isLoading,
  } = useStakeData(contractAddressesList, stakingAbi, address);

  const stakeDataList = useMemo(() => {
    return stakeDataListData
      ?.map((item) => {
        const dbPlans = planList?.find(
          (dbitem) => dbitem?.contractAddress === item?.contractAddress
        );

        return {
          ...item,
          id: dbPlans?.id,
          startDate: moment
            .utc(dbPlans?.startDate)
            .format("YYYY-MM-DD HH:mm:ss"),
          updatedAt: dbPlans?.updatedAt,
          createdAt: dbPlans?.createdAt,
        };
      })
      ?.filter((item) => moment().isAfter(moment(item?.startDate)))
      ?.filter(
        (item) =>
          Number(item?.bufferStake) !== 0 ||
          Number(item?.lockPeriod) !== 0 ||
          Number(item?.totalUserStaked) > 0 ||
          Number(item?.userClaimedAmount) > 0 ||
          Number(item?.userWithdrawalRequestAmount) > 0
      );
  }, [planList, stakeDataListData, address]);

  const getStakedValue = (item) => {
    if (item?.bufferStake || item?.totalUserStaked) {
      return Number(item?.bufferStake) !== 0
        ? item?.bufferStake
        : item?.totalUserStaked
        ? Number(item?.totalUserStaked).toFixed(5)
        : 0;
    }
    return 0;
  };
  const refresh = () => {
    refetchData();
    refetchDbPlan();
  };

  const enableUnstakeButton = (item) => {
    if (
      Number(item?.poolStakeAmount) == Number(item?.totalDepositedAmount) &&
      moment().unix() > Number(item?.lockPeriod) &&
      Number(item?.totalUserStaked) > 0
    ) {
      return true;
    }

    return false;
  };

  const unStakeHandler = async () => {
    try {
      const hash = await writeContractAsync({
        abi: stakingAbi,
        address: currentSelectedData.contractAddress,
        functionName: "unStake",
      });
      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Unstaking...",
          success: () => {
            refresh();
            return `Unstaked successfully`;
          },
          error: (err) => err?.shortMessage,
        }
      );
    } catch (error) {
      toast.error(error?.shortMessage);
      console.log(error);
    } finally {
      unstakeModalRef?.current?.close();
    }
  };
  const revertHandler = async () => {
    try {
      const hash = await writeContractAsync({
        abi: stakingAbi,
        address: currentSelectedData.contractAddress,
        functionName: "cancelRequest",
      });

      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Reverting...",
          success: () => {
            refresh();
            return `Reverted Successfully.`;
          },
          error: (err) => err?.shortMessage,
        }
      );
    } catch (error) {
      toast.error(error?.shortMessage);
      console.log(error);
    }
  };

  const claimHandler = async () => {
    try {
      const hash = await writeContractAsync({
        abi: stakingAbi,
        address: currentSelectedData.contractAddress,
        functionName: "claim",
      });

      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Claiming...",
          success: () => {
            refresh();
            return `Claimed successfully`;
          },
          error: (err) => err?.shortMessage,
        }
      );
    } catch (error) {
      toast.error(error?.shortMessage);
      console.log(error);
    }
  };

  const buttonHandler = (item) => {
    const currentTime = moment().unix();
    const isLocked = currentTime < Number(item?.lockPeriod);
    const hasUserClaimed = Number(item?.userClaimedAmount) > 0;
    const userStakedAmount = Number(item?.totalUserStaked);
    const userWithdrawalRequest = Number(item?.userWithdrawalRequestAmount);
    const isWithdrawalRequestZero = userWithdrawalRequest === 0;
    const isApprovedAndWithinVacancy =
      userWithdrawalRequest <= Number(item?.vacancyAmount) &&
      item?.userWithdrawalApprovedStatus;

    if (
      Number(item?.poolStakeAmount) === Number(item?.totalDepositedAmount) &&
      isLocked
    ) {
      return (
        <Timer
          expiryTimestamp={moment.unix(item?.lockPeriod).toDate()}
          setIsExpired={refresh}
        />
      );
    }

    if (hasUserClaimed) {
      if (userStakedAmount > 0) {
        if (!isLocked && isWithdrawalRequestZero) {
          return (
            <CustomButton
              clickHandler={() => {
                setCurrentSelectedData(item);
                unstakeModalRef?.current?.showModal();
              }}
            >
              Unstake
            </CustomButton>
          );
        }
      } else {
        if (
          item?.userClaimStatus &&
          userStakedAmount === 0 &&
          isWithdrawalRequestZero
        ) {
          return <CustomButton outlined>Claimed</CustomButton>;
        }
      }

      if (isApprovedAndWithinVacancy) {
        return (
          <CustomButton
            clickHandler={() => {
              setCurrentSelectedData(item);
              revertModalRef?.current?.showModal();
            }}
          >
            Revert
          </CustomButton>
        );
      }

      if (
        !item?.userWithdrawalApprovedStatus &&
        userStakedAmount === 0 &&
        userWithdrawalRequest > 0
      ) {
        return <CustomButton>Claim</CustomButton>;
      }
    } else {
      if (!isLocked) {
        if (enableUnstakeButton(item) && isWithdrawalRequestZero) {
          return (
            <CustomButton
              clickHandler={() => {
                setCurrentSelectedData(item);
                unstakeModalRef?.current?.showModal();
              }}
            >
              Unstake
            </CustomButton>
          );
        }

        if (isApprovedAndWithinVacancy) {
          return (
            <CustomButton
              clickHandler={() => {
                setCurrentSelectedData(item);
                revertModalRef?.current?.showModal();
              }}
            >
              Revert
            </CustomButton>
          );
        }

        if (
          !item?.userWithdrawalApprovedStatus &&
          userStakedAmount === 0 &&
          userWithdrawalRequest > 0
        ) {
          return (
            <CustomButton
              clickHandler={() => {
                setCurrentSelectedData(item);
                claimModalRef?.current?.showModal();
              }}
            >
              Claim
            </CustomButton>
          );
        }
      }
    }

    return <></>;
  };

  return (
    <div className="overflow-hidden">
      <div className="w-full flex items-end justify-end">
        <BreadCrumb routes={breadCrumb} />
      </div>
      <div className="grid grid-cols-12 my-10 gap-6">
        <div className="col-span-12 flex">
          <PageTitle
            title={"My Stakes"}
            subtitle={
              "Participate in Network Security and Earn Rewards—Stake Tokens in the Validator Pool to Support Decentralization and Consensus."
            }
          />
        </div>
        <div className="col-span-12 overflow-auto">
          <table className="table table-pin-rows table-pin-cols min-w-[1000px]">
            <thead>
              <tr className="bg-stroke">
                <td>Pool Address</td>
                <td>Name</td>
                <td>Staked</td>
                <td>Network Expense</td>
                <td>Reward</td>
                <td>Claim Amount</td>
                <td>Action</td>
              </tr>
            </thead>
            <tbody>
              {stakeDataList?.map((item, idx) => {
                return (
                  <tr key={idx}>
                    <td>
                      {maskValue({
                        str: item?.contractAddress || "",
                        enableCopyButton: true,
                      })}
                    </td>
                    <td>{item?.poolName || ""}</td>
                    <td>{formatNice(getStakedValue(item))} TAN</td>
                    <td>{item?.commissionRate || ""}%</td>
                    <td>
                      {item?.userReward
                        ? `${Number(item?.userReward)?.toFixed(6)} %`
                        : "--"}
                    </td>
                    <td>
                      {item?.userWithdrawalRequestAmount
                        ? Number(
                            item?.userWithdrawalRequestAmount ?? 0
                          )?.toFixed(6)
                        : "--"}
                    </td>
                    <td>
                      <div className="flex items-center ">
                        {buttonHandler(item)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        modalRef={unstakeModalRef}
        fxn={unStakeHandler}
        title={"Confirm Unstake"}
        subtitle={"Are you sure,  you want to unstake from the invested pool?"}
        confirmText={"Unstake"}
        isLoading={writeContractPending}
      />
      <ConfirmationModal
        modalRef={revertModalRef}
        fxn={revertHandler}
        title={"Confirm Revert"}
        subtitle={"Are you sure, you want to revert your investment?"}
        confirmText={"Revert"}
        isLoading={writeContractPending}
      />
      <ConfirmationModal
        modalRef={claimModalRef}
        fxn={claimHandler}
        title={"Confirm Claim"}
        subtitle={"Are you sure, you want to claim?"}
        confirmText={"Claim Amount"}
        isLoading={writeContractPending}
      />
    </div>
  );
};

export default MyStakes;
