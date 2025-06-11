"use client";
import BreadCrumb from "@/common_component/BreadCrumb";
import CustomButton from "@/common_component/CustomButton";
import PageTitle from "@/common_component/PageTitle";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import BurnAbi from "@/abi/BurnAbi.json";
import {
  useAccount,
  useBalance,
  useConfig,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { BURN_ADDRESS } from "@/modules/burn-vesting/config";
import { toast } from "sonner";
import { formatNice } from "coin-format";
import { useFormik } from "formik";
import * as yup from "yup";
import { TANConfig } from "@/modules/globals/BlockChainWrapper";
const breadCrumb = [
  {
    text: "Home",
    href: "/home",
  },
  {
    text: "Burn",
    href: "/burn",
  },
];

const Burn = () => {
  const [quantity, setQuantity] = useState(null);
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isExecution, setIsExecuting] = useState();
  const chainConfig = useConfig();
  const { data: balance } = useBalance({
    chainId: TANConfig.chainId,
    address: address,
  });

  const { data: totalBurns, refetch: refetchTotalBurn } = useReadContract({
    abi: BurnAbi,
    address: BURN_ADDRESS,
    functionName: "totalBurns",
  });
  const { data: minBurnAmount, refetch: refetchminimumBurn } = useReadContract({
    abi: BurnAbi,
    address: BURN_ADDRESS,
    functionName: "minimumBurn",
  });
  const { data: yourBurning, refetch: refetchYourBurning } = useReadContract({
    abi: BurnAbi,
    address: BURN_ADDRESS,
    functionName: "burns",
    args: [address],
  });
  const { data: yourVesting, refetch: refetchYourVesting } = useReadContract({
    abi: BurnAbi,
    address: BURN_ADDRESS,
    functionName: "totalSubsidy",
    args: [address],
  });
  const tanClaim = async () => {
    try {
      const hash = await writeContractAsync({
        abi: BurnAbi,
        address: BURN_ADDRESS,
        functionName: "burn",
        value: String(formik?.values?.amount * 1e18),
      });

      toast.promise(
        waitForTransactionReceipt(chainConfig, {
          hash: hash,
        }),
        {
          loading: "Burning...",
          success: () => {
            refetchTotalBurn();
            refetchminimumBurn();
            refetchYourBurning();
            refetchYourVesting();
            formik.resetForm();
            return `Burn successfully.`;
          },
          error: (err) => err?.shortMessage,
        }
      );
    } catch (error) {
      console.log(error, "");
      toast.error(error?.shortMessage);
    }
  };
  const convertedContractData = useMemo(() => {
    const minBurn = Number(minBurnAmount) / 1e18;
    const totalBurn = Number(totalBurns) / 1e18;
    const yourBurn = Number(yourBurning) / 1e18;
    const yourVest = Number(yourVesting) / 1e18;
    return { minBurn, totalBurn, yourBurn, yourVest };
  }, [minBurnAmount, totalBurns, yourBurning, yourVesting]);
  const amountSchema = yup.object({
    amount: yup
      .number()
      .required("Amount is required.")
      .min(
        convertedContractData?.minBurn,
        `Minimum ${convertedContractData?.minBurn} is required.`
      ),
  });

  const formik = useFormik({
    initialValues: {
      amount: "",
    },
    onSubmit: tanClaim,
    validationSchema: amountSchema,
  });

  const detailCard = useMemo(() => {
    return [
      {
        label: "Total Users Burning",
        value: isConnected
          ? convertedContractData?.totalBurn
            ? formatNice(Number(convertedContractData?.totalBurn ?? 0))
            : 0
          : 0,
      },
      {
        label: "My Burning",
        value: convertedContractData?.yourBurn
          ? formatNice(Number(convertedContractData?.yourBurn ?? 0))
          : 0,
      },
      {
        label: "My Vesting",
        value: convertedContractData?.yourVest
          ? formatNice(Number(convertedContractData?.yourVest ?? 0))
          : 0,
      },
    ];
  }, [convertedContractData]);
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

            <Link href={"/vesting"}>
              <CustomButton className={"min-w-40 rounded-sm"}>
                My Vesting
              </CustomButton>
            </Link>
          </div>
          <div className="w-full flex justify-center items-center py-16 md:py-32 rounded-2xl relative gap-4  flex-col">
            <div className="w-full md:w-[500px] rounded-md">
              <div className="flex flex-col items-end">
                <p className="text-error text-xs">{formik?.errors?.amount}</p>
              </div>
              <div className="border border-stroke col-span-12 p-4 flex flex-col justify-between rounded-sm min-h-32">
                <input
                  name="amount"
                  type="number"
                  className="outline-0 text-3xl"
                  placeholder="0.00"
                  value={formik?.values?.amount}
                  onChange={formik.handleChange}
                />
                <div className="flex justify-between">
                  <p
                    className="border border-stroke text-sm px-2 py-0.5 rounded-sm cursor-pointer font-semibold"
                    onClick={() => {
                      formik.setFieldValue(
                        "amount",
                        Number(balance?.formatted - 1 ?? 0)
                      );
                    }}
                  >
                    MAX
                  </p>
                  <p>
                    Balance:{" "}
                    {balance?.formatted ? formatNice(balance?.formatted) : 0}{" "}
                    TAN
                  </p>
                </div>
              </div>
              <CustomButton
                className={"w-full mt-8 rounded-sm py-6"}
                clickHandler={() => {
                  formik.handleSubmit();
                }}
                isLoading={isPending}
              >
                Burn{" "}
                {formik.values?.amount ? formatNice(formik.values?.amount) : ""}{" "}
                TAN
              </CustomButton>
            </div>
            <div className="min-w-full md:min-w-[550px] ">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                {detailCard?.map((item, idx) => {
                  return (
                    <div key={idx} className="border w-full p-4 rounded-sm">
                      <p className="text-description text-sm">{item?.label}</p>
                      <p className="text-3xl">{item?.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Burn;
