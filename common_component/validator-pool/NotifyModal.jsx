import React from "react";
import Modal from "../Modal";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import CustomButton from "../CustomButton";
import { api } from "@/services/apiServices";
import * as yup from "yup";

const NotifyModal = ({ modalRef, currentSelectedData }) => {
  return (
    <Modal
      modalRef={modalRef}
      component={
        <NotifyComponent
          currentSelectedData={currentSelectedData}
          modalRef={modalRef}
        />
      }
      title={"Notify"}
    />
  );
};

export default NotifyModal;

const notifyModalSchema = yup.object({
  email: yup
    .string()
    .email("Email is required.")
    .required("Email is required."),
});

const NotifyComponent = ({ currentSelectedData, modalRef }) => {
  const { mutateAsync: notifyMeMutation, isPending: notifyPending } =
    useMutation({
      onSuccess: (data) => {
        toast.success(data?.data?.responseMessage);
        formik?.resetForm();
        modalRef?.current?.close();
      },
      onError: (error) => {
        toast.error(error?.response?.data?.responseMessage);
      },
      mutationFn: () => {
        return api({
          url: "participateStack/notifyMe",
          method: "POST",
          data: {
            email: formik?.values?.email,
            planId: currentSelectedData?.id,
          },
        });
      },
    });
  const formik = useFormik({
    initialValues: {
      email: "",
    },
    onSubmit: notifyMeMutation,
    validationSchema: notifyModalSchema,
  });
  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col gap-1 items-center justify-center"
    >
      <div className="flex flex-col gap-1 w-full">
        <label htmlFor="email">Email*</label>
        <input
          placeholder="Enter your email address."
          id="email"
          name="email"
          type="text"
          onChange={formik.handleChange}
          value={formik.values.email}
          className="border border-stroke outline-0 h-8 rounded-sm px-2"
        />
        <p className="text-xs text-error">{formik?.errors?.email}</p>
      </div>
      <CustomButton
        className={"mt-8 min-w-full"}
        type="submit"
        isLoading={notifyPending}
      >
        Submit
      </CustomButton>
    </form>
  );
};
