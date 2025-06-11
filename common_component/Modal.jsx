import { IconX } from "@tabler/icons-react";
import React, { useEffect } from "react";
import { useRef } from "react";

const Modal = ({ modalRef, component, title }) => {
  return (
    <dialog id="my_modal_2" className="modal" ref={modalRef}>
      <div className="modal-box ">
        <div className="relative flex justify-between">
          <h3 className="font-bold text-lg">{title || ""}</h3>
          <IconX
            className="cursor-pointer"
            onClick={() => {
              modalRef?.current?.close();
            }}
          />
        </div>
        <div className="mt-6">{component}</div>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default Modal;
