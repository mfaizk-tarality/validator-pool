import React from "react";
import CustomButton from "./CustomButton";
import Modal from "./Modal";

const ConfirmationModal = ({
  modalRef,
  title,
  subtitle,
  fxn,
  confirmText,
  isLoading,
}) => {
  return (
    <Modal
      modalRef={modalRef}
      component={
        <ConfirmationModalComponent
          modalRef={modalRef}
          subtitle={subtitle}
          fxn={fxn}
          confirmText={confirmText}
          isLoading={isLoading}
        />
      }
      title={title || ""}
    />
  );
};

export default ConfirmationModal;

const ConfirmationModalComponent = ({
  modalRef,
  subtitle,
  fxn,
  confirmText,
  isLoading,
}) => {
  return (
    <div className="flex flex-col gap-1 items-center justify-center">
      <div className="flex flex-col gap-1 w-full">
        <p>{subtitle || ""}</p>
      </div>
      <div className="flex flex-row mt-8 gap-4">
        <CustomButton
          className={"w-32"}
          clickHandler={() => modalRef?.current?.close()}
          disabled={isLoading}
        >
          Cancel
        </CustomButton>
        <CustomButton
          isLoading={isLoading}
          className={"w-32"}
          clickHandler={() => {
            if (fxn) {
              fxn();
              modalRef?.current?.close();
            }
          }}
        >
          {confirmText || "Confirm"}
        </CustomButton>
      </div>
    </div>
  );
};
