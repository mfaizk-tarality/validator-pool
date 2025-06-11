"use client";
import BreadCrumb from "@/common_component/BreadCrumb";
import PageTitle from "@/common_component/PageTitle";
import React, { useMemo, useState } from "react";
import {
  useAccount,
  useConfig,
  useReadContract,
  useWriteContract,
} from "wagmi";

import VestingAbi from "@/abi/VestingAbi.json";
import { VESTING_ADDRESS } from "@/modules/burn-vesting/config";
import useVestingData from "@/hooks/useVestingData";
import { maskValue } from "@/utils";
import { formatNice } from "coin-format";
import CustomButton from "@/common_component/CustomButton";
import { waitForTransactionReceipt } from "@wagmi/core";
import moment from "moment";
import { toast } from "sonner";

const breadCrumb = [
  {
    text: "Home",
    href: "/home",
  },
  {
    text: "Vesting",
    href: "/vesting",
  },
];

const Vesting = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const chainConfig = useConfig();
  const [selectedIndex, setSelectedIndex] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const { data: userTotalVesting, refetch: refetchTotalvesting } =
    useReadContract({
      abi: VestingAbi,
      address: VESTING_ADDRESS,
      functionName: "getUserTotalVesting",
      args: [address],
    });
  const { data: userInfoDetail, refetch: refetchUserDetailinfo } =
    useReadContract({
      abi: VestingAbi,
      address: VESTING_ADDRESS,
      functionName: "userInfo",
      args: [address],
    });
  const {
    convertedData: convertedDataFromHook,
    refetchData: refetchContractList,
  } = useVestingData(Number(userTotalVesting), VestingAbi, address);

  const handleClaim = async (id) => {
    try {
      setisLoading(true);
      setSelectedIndex(id);
      const hash = await writeContractAsync({
        abi: VestingAbi,
        address: VESTING_ADDRESS,
        functionName: "claimTokens",
        args: [address, id],
      });
      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Claiming...",
          success: () => {
            refetchContractList();
            refetchUserDetailinfo();
            refetchTotalvesting();
            return "Claimed successfully.";
          },
          error: (error) => error?.shortMessage || "",
        }
      );
    } catch (error) {
      toast.error(error?.shortMessage || "");
      console.log(error);
    } finally {
      setisLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="w-full flex items-end justify-end">
        <BreadCrumb routes={breadCrumb} />
      </div>
      <div className="grid grid-cols-12 my-10 gap-6">
        <div className="col-span-12 flex">
          <PageTitle
            title={"Vesting"}
            subtitle={
              "Secure Your Project's Future—Create Vesting Plans That Promote Trust, Transparency, and Sustainable Growth."
            }
          />
        </div>
        <div className="col-span-12 overflow-auto">
          <table className="table table-pin-rows table-pin-cols min-w-[1000px]">
            <thead>
              <tr className="bg-stroke">
                <td>Allocated</td>
                <td>Claimed</td>
                <td>Claim Start</td>
                <td>Claim End</td>
                <td>Next Claim</td>
                <td>Claim Amount</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {convertedDataFromHook?.map((data, idx) => {
                return (
                  <tr key={idx}>
                    <td>{formatNice(data.allocatedAmount || 0)} TAN</td>
                    <td> {formatNice(data.claimedAmount || 0)} TAN</td>
                    <td>
                      {data.startClaimTimestamp
                        ? moment.unix(data.startClaimTimestamp)?.format("lll")
                        : "--"}
                    </td>
                    <td>
                      {data.claimEndTimestamp
                        ? moment.unix(data.claimEndTimestamp)?.format("lll")
                        : "--"}
                    </td>

                    <td>
                      {data.nextClaimTimestamp
                        ? moment.unix(data.nextClaimTimestamp)?.format("lll")
                        : "--"}
                    </td>
                    <td>
                      {data.claimedAmount ? formatNice(data.claimedAmount) : 0}{" "}
                      TAN
                    </td>
                    <td>
                      <div className="flex items-center ">
                        {Number(data.unlockedAmount) > 0 ? (
                          <CustomButton
                            isConnected={isConnected}
                            isLoading={selectedIndex == idx && isLoading}
                            clickHandler={() => {
                              handleClaim(idx);
                            }}
                          >
                            Claim
                          </CustomButton>
                        ) : (
                          <>
                            {data.claimedAmount == 0 ? (
                              <></>
                            ) : (
                              <CustomButton outlined>Claimed</CustomButton>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* <ConfirmationModal
        modalRef={unstakeModalRef}
        fxn={unStakeHandler}
        title={"Confirm Unstake"}
        subtitle={"Are you sure,  you want to unstake from the invested pool?"}
        confirmText={"Unstake"}
        isLoading={writeContractPending}
      />
      */}
    </div>
  );
};

export default Vesting;
