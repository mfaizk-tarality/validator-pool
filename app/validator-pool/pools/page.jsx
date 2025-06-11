"use client";
import BreadCrumb from "@/common_component/BreadCrumb";
import CustomButton from "@/common_component/CustomButton";
import PageTitle from "@/common_component/PageTitle";
import useStakeData from "@/hooks/useStakeData";
import { getStackPlans } from "@/modules/validator";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import stakingAbi from "@/abi/stakingAbi.json";
import { parseEther } from "ethers";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "sonner";
import moment from "moment";
import {
  buildStyles,
  CircularProgressbar,
  CircularProgressbarWithChildren,
} from "react-circular-progressbar";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { maskValue } from "@/utils";
import { formatNice } from "coin-format";
import Timer from "@/common_component/Timer";

const breadCrumb = [
  {
    text: "Home",
    href: "/home",
  },
  {
    text: "Validator Pool",
    href: "/validator-pool/pools",
  },
];

const getMaxValue = (item) => {
  return (
    Number(item?.poolStakeAmount) - Number(item?.totalDepositedAmount) ||
    Number(item?.vacancyAmount)
  );
};

const Pools = () => {
  const { isConnected, address } = useAccount();
  const [amountList, setAmountList] = useState([]);
  const [refreshTripper, setRefreshTripper] = useState(false);
  const [currentSelectedData, setCurrentSelectedData] = useState({});
  const {
    data: planList,
    isPending: planListPending,
    refetch: refetchDbPlan,
  } = getStackPlans();

  const { writeContractAsync, isPending: writeContractPending } =
    useWriteContract();
  const chainConfig = useConfig();
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
  }, [address, refreshTripper]);

  const stakeDataList = useMemo(() => {
    const data = stakeDataListData
      ?.map((item) => {
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
      ?.filter((item) => getMaxValue(item) != 0);
    // ?.filter((item) => {
    //   return moment()?.isAfter(moment(item?.startDate));
    // });
    return data;
  }, [planList, stakeDataListData]);

  useMemo(() => {
    const mappedData = stakeDataList?.map((e) => {
      return e?.fixedAmount;
    });
    setAmountList(mappedData);
  }, [stakeDataList]);

  const stakeHandler = async (item, amountToSend) => {
    try {
      const amountToSendInContract = parseEther(String(amountToSend));

      const hash = await writeContractAsync({
        abi: stakingAbi,
        address: item?.contractAddress,
        functionName: "stake",
        value: amountToSendInContract,
      });
      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Staking...",
          success: () => {
            refetchData();
            return "Staked successfully";
          },
        }
      );
    } catch (error) {
      toast.error(error?.shortMessage);
      console.log(error);
    }
  };

  const getProgressPercentage = (item) => {
    let totalDepositedAmount =
      Number(item?.totalDepositedAmount) - Number(item?.vacancyAmount);
    let poolStakeAmount = Number(item?.poolStakeAmount);
    return (
      Number((totalDepositedAmount / poolStakeAmount) * 100).toFixed() ?? 0
    );
  };

  const updateValueHandler = (type, idx, data) => {
    const maxValue = getMaxValue(data);
    if (type == "add") {
      const newValue = amountList?.map((item, i) => {
        if (idx == i) {
          if (+maxValue <= item) {
            return item;
          } else {
            return item + data?.fixedAmount;
          }
        }
        return item;
      });
      setAmountList(newValue);
    } else {
      const newValue = amountList?.map((item, i) => {
        if (idx == i) {
          if (data?.fixedAmount - item == 0) {
            return item;
          }
          return item - data?.fixedAmount;
        }
        return item;
      });
      setAmountList(newValue);
    }
  };

  const buttonComponent = (item, amount) => {
    const isUpComing = moment().isBefore(moment(item?.startDate));
    if (isUpComing) {
      return (
        <CustomButton
          isConnected={isConnected}
          outlined
          className={"rounded-sm w-[90%]"}
        >
          Upcoming
        </CustomButton>
      );
    }

    return (
      <CustomButton
        isConnected={isConnected}
        className={"rounded-sm w-[90%]"}
        isLoading={
          writeContractPending &&
          currentSelectedData?.contractAddress == item?.contractAddress
        }
        clickHandler={() => {
          // setCurrentSelectedData(item);
          // setAmountToSend(item?.fixedAmount);
          // setStakeModal(true);
          setCurrentSelectedData(item);
          stakeHandler(item, amount);
        }}
      >
        Stake
      </CustomButton>
    );
  };

  const cardUpperHandler = (item, idx) => {
    const isUpComing = moment().isBefore(moment(item?.startDate));
    if (isUpComing) {
      return (
        <div className="min-h-44 flex items-center justify-center flex-col gap-4">
          <p>Coming Soon</p>
          <div>
            <Timer
              expiryTimestamp={moment(item?.startDate)?.toDate()}
              setIsExpired={() => {
                setRefreshTripper((e) => !e);
              }}
            />
            <div className="flex justify-around gap-5 text-description mt-1">
              <p>H</p>
              <p>M</p>
              <p>S</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-44 flex flex-col gap-2 items-center justify-center">
        <div className="h-26 w-26 mb-2">
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
        <label className="input bg-background outline-0 border border-stroke">
          <IconMinus
            className="cursor-pointer"
            onClick={() => {
              updateValueHandler("minus", idx, item);
            }}
          />
          <input
            type="text"
            className="w-full text-center outline-0 "
            placeholder="10000.00"
            value={amountList?.[idx]}
            onChange={() => {}}
          />
          <IconPlus
            className="cursor-pointer"
            onClick={() => {
              updateValueHandler("add", idx, item);
            }}
          />
        </label>
      </div>
    );
  };

  return (
    <div>
      <div className="w-full flex items-end justify-end">
        <BreadCrumb routes={breadCrumb} />
      </div>
      <div className="grid grid-cols-12 my-10">
        <div className="col-span-12  2xl:col-span-10 2xl:col-start-2">
          <div className="col-span-12 md:col-span-6 flex justify-between items-end flex-col md:flex-row gap-4 md:gap-0">
            <PageTitle
              title={"Validator Pool"}
              subtitle={
                "Participate in Network Security and Earn Rewards—Stake Tokens in the Validator Pool to Support Decentralization and Consensus."
              }
            />

            <Link href={"/validator-pool/completed-pool"}>
              <CustomButton className={"min-w-40 rounded-sm"}>
                Notify
              </CustomButton>
            </Link>
          </div>
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
                        <p className="text-description">Min Deposit:</p>
                        <p>
                          {formatNice(
                            Number(item?.fixedAmount ? item?.fixedAmount : 0)
                          )}
                        </p>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <p className="text-description">Max Deposit:</p>
                        <p>{formatNice(getMaxValue(item))}</p>
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
                        {buttonComponent(item, amountList?.[idx])}
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
  );
};

export default Pools;
