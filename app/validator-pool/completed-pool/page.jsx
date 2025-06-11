"use client";
import BreadCrumb from "@/common_component/BreadCrumb";
import CustomButton from "@/common_component/CustomButton";
import PageTitle from "@/common_component/PageTitle";
import useStakeData from "@/hooks/useStakeData";
import { getStackPlans } from "@/modules/validator";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import stakingAbi from "@/abi/stakingAbi.json";
import { parseEther } from "ethers";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "sonner";
import moment from "moment";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { maskValue } from "@/utils";
import { formatNice } from "coin-format";
import NotifyModal from "@/common_component/validator-pool/NotifyModal";

const breadCrumb = [
  {
    text: "Home",
    href: "/home",
  },
  {
    text: "Notify",
    href: "/validator-pool/completed-pool",
  },
];

const CompletedPools = () => {
  const { isConnected, address } = useAccount();
  const [currentSelectedData, setCurrentSelectedData] = useState({});
  const modalRef = useRef();
  const {
    data: planList,
    isPending: planListPending,
    refetch: refetchDbPlan,
  } = getStackPlans();

  const contractAddressesList = useMemo(
    () => planList?.map((item) => item?.contractAddress),
    [planList, planListPending]
  );

  const { stakeDataList: stakeDataListData, refetchData } = useStakeData(
    contractAddressesList,
    stakingAbi,
    address
  );
  useEffect(() => {
    refetchDbPlan();
    refetchData();
  }, [address]);

  const stakeDataList = useMemo(() => {
    return stakeDataListData

      ?.map((item, _) => {
        const dbPlans = planList?.find(
          (dbitem) => dbitem?.contractAddress == item?.contractAddress
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
      ?.filter((item) => {
        return moment()?.isAfter(moment(item?.startDate));
      })
      ?.filter((item) => {
        if (
          Number(item?.poolStakeAmount) != Number(item?.totalDepositedAmount) ||
          Number(item?.vacancyAmount) !== 0
        ) {
          return false;
        }
        return true;
      });
  }, [planList, stakeDataListData]);

  const getProgressPercentage = (item) => {
    let totalDepositedAmount =
      Number(item?.totalDepositedAmount) - Number(item?.vacancyAmount);
    let poolStakeAmount = Number(item?.poolStakeAmount);
    return (
      Number((totalDepositedAmount / poolStakeAmount) * 100).toFixed() ?? 0
    );
  };

  const buttonComponent = (item, amount) => {
    return (
      <CustomButton
        isConnected={isConnected}
        className={"rounded-sm w-[90%]"}
        // isLoading={
        //   currentSelectedData?.contractAddress == item?.contractAddress
        // }
        clickHandler={() => {
          setCurrentSelectedData(item);
          modalRef?.current?.showModal();
        }}
      >
        Notify
      </CustomButton>
    );
  };

  const cardUpperHandler = (item, idx) => {
    const isUpComing = moment().isBefore(moment(item?.startDate));
    if (isUpComing) {
      return <p>Coming Soon</p>;
    }
    return (
      <>
        <div className="h-28 w-28">
          <CircularProgressbar
            value={getProgressPercentage(item)}
            text={`${getProgressPercentage(item)}%`}
            className="text-tanborder"
            styles={buildStyles({
              pathColor: "#d3177b",
              textColor: "#d3177b",
            })}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <div>
        <div className="w-full flex items-end justify-end">
          <BreadCrumb routes={breadCrumb} />
        </div>
        <div className="grid grid-cols-12 my-10">
          <div className="col-span-12  2xl:col-span-10 2xl:col-start-2">
            <PageTitle
              title={"Validator Pool"}
              subtitle={
                "Participate in Network Security and Earn Rewards—Stake Tokens in the Validator Pool to Support Decentralization and Consensus."
              }
            />
            <div className="w-full grid grid-cols-12 mt-4 rounded-2xl relative gap-4">
              <div className="col-span-12 grid grid-cols-12 gap-4 md:gap-6 xl:gap-12 p-10 rounded-md">
                {stakeDataList?.map((item, idx) => {
                  return (
                    <div
                      key={idx}
                      className="min-h-96 flex justify-start items-center flex-col  border border-stroke col-span-12 sm:col-span-6  lg:col-span-4 2xl:col-span-3 p-4 gap-6 rounded-xl"
                    >
                      <p className="font-semibold text-base">
                        {item?.poolName || ""}
                      </p>
                      {cardUpperHandler(item, idx)}
                      <div className="w-full flex flex-col gap-1">
                        <div className="flex justify-between items-center w-full">
                          <p className="text-description">Network Expense:</p>
                          <p>
                            {item?.commissionRate ? item?.commissionRate : 0}%
                          </p>
                        </div>
                        <div className="flex justify-between items-center w-full">
                          <p className="text-description">Total Deposit:</p>
                          <p>
                            {formatNice(
                              Number(item?.fixedAmount ? item?.fixedAmount : 0)
                            )}
                          </p>
                        </div>

                        <div className="flex justify-between items-center w-full">
                          <p className="text-description">Pool Address:</p>
                          <p>
                            {maskValue({
                              str: item?.contractAddress,
                              enableCopyButton: true,
                            })}
                          </p>
                        </div>
                        <div className="w-full flex items-center justify-center py-4">
                          {buttonComponent(item)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotifyModal
        modalRef={modalRef}
        currentSelectedData={currentSelectedData}
      />
    </>
  );
};

export default CompletedPools;
