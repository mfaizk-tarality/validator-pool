"use client";
import React, { Fragment } from "react";
import { useTimer } from "react-timer-hook";

const Timer = ({ expiryTimestamp, setIsExpired }) => {
  const {
    totalSeconds,
    seconds,
    minutes,
    hours,
    days,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp: expiryTimestamp,
    onExpire: () => {
      if (setIsExpired) {
        setIsExpired();
      }
    },
  });

  return (
    <div className="flex font-semibold gap-2 justify-center items-center">
      <p className="border border-tanborder px-2 py-1 rounded-sm">
        {String(days).padStart(2, 0)}
      </p>
      :
      <p className="border border-tanborder px-2 py-1 rounded-sm">
        {String(minutes).padStart(2, 0)}
      </p>
      :
      <p className="border border-tanborder px-2 py-1 rounded-sm">
        {String(seconds).padStart(2, 0)}
      </p>
    </div>
  );
};

export default Timer;
