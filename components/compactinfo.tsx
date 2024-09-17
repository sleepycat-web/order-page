import React from "react";
import { useState, useEffect } from "react";

import { CompactInfoProps } from "@/scripts/interface";

const CompactInfo: React.FC<CompactInfoProps> = ({
  customerName,
  phoneNumber,
  cabin,
  total,
  orders,
  onDispatchAll,
  onToggle,
  onFulfillAll,
  onRejectAll,
  activeTab,
  initialExpanded,
  oldestOrderTime,
}) => {
  const [isDispatched, setIsDispatched] = useState(
    orders.every((order) => order.order === "dispatched")
  );
  const [isFulfilled, setIsFulfilled] = useState(
    orders.every((order) => order.status === "fulfilled")
  );
  const [isRejected, setIsRejected] = useState(
    orders.some(
      (order) => order.order === "rejected" || order.status === "rejected"
    )
  );
  const [dispatchCountdown, setDispatchCountdown] = useState<number | null>(
    null
  );
  const [dispatchTimeoutId, setDispatchTimeoutId] =
    useState<NodeJS.Timeout | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  useEffect(() => {
    // This effect now only runs once when the component mounts
    onToggle(isExpanded);
  }, []);

  const handleToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    onToggle(newExpandedState);
  };
  const [elapsedTime, setElapsedTime] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

const hasDeliveryCharge = orders.some((order) => order.deliveryCharge > 0);
useEffect(() => {
  const updateElapsedTime = () => {
    const now = new Date();
    const orderTime = new Date(oldestOrderTime);

    // Get the time difference in milliseconds between now and the order time
    const diff = now.getTime() - orderTime.getTime();

    // Calculate how much time has passed since the order and adjust by 15 minutes (900,000 ms)
    const adjustedDiffInMs = diff - 15 * 60 * 1000;
    const isCountingUp = adjustedDiffInMs >= 0;

    // Get the total minutes and seconds from the adjusted time
    const totalMinutes = Math.floor(Math.abs(adjustedDiffInMs) / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor(
      (Math.abs(adjustedDiffInMs) % (1000 * 60)) / 1000
    );

    // Format the elapsed time
    let timeString = "";
    if (hours > 0) {
      timeString += `${hours}:`;
    }
    timeString += `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // If counting down, prefix with a minus sign
    const sign = isCountingUp ? "-" : "";
    setElapsedTime(`${sign}${timeString}`);

    // Update the overdue state once the countdown has passed 0:00
    setIsOverdue(isCountingUp);
  };

  updateElapsedTime();
  const interval = setInterval(updateElapsedTime, 1000);

  return () => clearInterval(interval);
}, [oldestOrderTime]);

  const handleDispatchAll = () => {
    const orderIds = orders
      .filter((order) => order.order !== "dispatched")
      .map((order) => order._id);

    setDispatchCountdown(5);
    const timeoutId = setTimeout(() => {
      onDispatchAll(orderIds);
      setIsDispatched(true);
      setDispatchCountdown(null);
    }, 5000);
    setDispatchTimeoutId(timeoutId);
  };

  const nonRejectedTotal = orders
    .filter((order) => order.status !== "rejected")
    .reduce((sum, order) => sum + order.price, 0);
  const handleUndoDispatchAll = () => {
    if (dispatchTimeoutId) {
      clearTimeout(dispatchTimeoutId);
      setDispatchTimeoutId(null);
    }
    setDispatchCountdown(null);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (dispatchCountdown !== null && dispatchCountdown > 0) {
      intervalId = setInterval(() => {
        setDispatchCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispatchCountdown]);

  const handleFulfillAll = () => {
    const orderIds = orders
      .filter((order) => order.status !== "fulfilled")
      .map((order) => order._id);
    onFulfillAll(orderIds);
    setIsFulfilled(true);
  };

  const handleRejectAll = () => {
    setIsRejectModalOpen(true);
  };
  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Prevent toggling if the click is on a button or interactive element
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === "BUTTON" ||
        event.target.tagName === "A" ||
        event.target.closest("button") ||
        event.target.closest("a"))
    ) {
      return;
    }
    handleToggle();
  };
  const confirmReject = async () => {
    const orderIds = orders.map((order) => order._id);
    try {
      await onRejectAll(orderIds);
      setIsRejected(true);
      setIsDispatched(false);
      setIsFulfilled(false);
    } catch (error) {
      console.error("Error rejecting orders:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsRejectModalOpen(false);
    }
  };
  return (
    <div
      onClick={handleContainerClick}
      className={`py-3 px-3 sm:px-3 sm:py-3 rounded-lg mb-2 flex flex-wrap lg:flex-nowrap lg:justify-between ${
        hasDeliveryCharge ? "bg-slate-800" : "bg-neutral-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full lg:w-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg">
              {customerName}
            </span>
            <span className="text-blue-400 text-sm sm:text-base">
              <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
            </span>
            <span className="bg-blue-600 px-2 py-0.5 rounded text-xs sm:text-sm">
              {cabin}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            {activeTab != "previous" && (
              <div
                className={` px-2 py-1 rounded text-center text-sm font-semibold ${
                  isOverdue ? "bg-orange-500" : "bg-yellow-500"
                }`}
              >
                <> {elapsedTime}</>
              </div>
            )}
            <span className="text-sm">Status:</span>
            <span
              className={`px-1 py-1 rounded text-sm ${
                isRejected
                  ? "bg-red-500"
                  : isDispatched
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            >
              {isRejected
                ? "Rejected"
                : isDispatched
                ? "Dispatched"
                : "Pending"}
            </span>

            {!isDispatched && !isRejected && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleDispatchAll}
                  disabled={dispatchCountdown !== null}
                >
                  Dispatch All
                </button>
                {dispatchCountdown !== null && (
                  <span className="text-sm">
                    Dispatching all orders in {dispatchCountdown}s
                    <button
                      className="btn btn-secondary btn-sm ml-2"
                      onClick={handleUndoDispatchAll}
                    >
                      Undo
                    </button>
                  </span>
                )}
              </>
            )}
            {isDispatched && !isRejected && (
              <>
                <span
                  className={`px-1 py-1 rounded text-sm ${
                    isFulfilled ? "bg-green-500" : "bg-yellow-500"
                  }`}
                >
                  {isFulfilled ? "Fulfilled" : "Pending"}
                </span>
                {!isFulfilled && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleFulfillAll}
                  >
                    Fulfill All
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="resdiv w-full lg:w-auto mt-1 lg:mt-0 flex lg:justify-end items-center">
        <div className="flex items-center gap-2">
          {activeTab === "new" && (
            <button
              className="btn btn-error text-white btn-sm"
              onClick={handleRejectAll}
              disabled={isRejected}
            >
              Reject
            </button>
          )}
          <div className="bg-rose-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded text-sm sm:text-base font-bold whitespace-nowrap">
            Total: ₹{nonRejectedTotal}
          </div>
        </div>
        <button onClick={handleToggle} className="ml-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <path
              fill="currentColor"
              d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"
            />
          </svg>
        </button>
      </div>
      {/* Reject Confirmation Modal */}
      <input
        type="checkbox"
        id="reject-modal"
        className="modal-toggle"
        checked={isRejectModalOpen}
        onChange={() => setIsRejectModalOpen(!isRejectModalOpen)}
      />
      <div className="modal ">
        <div className="modal-box bg-neutral-800">
          <h3 className="font-bold text-lg">Confirm Rejection</h3>
          <p className="py-4">
            Are you sure you want to reject all orders for this customer?
          </p>
          <div className="modal-action">
            <button
              className="btn btn-error text-white"
              onClick={confirmReject}
            >
              Confirm
            </button>
            <button className="btn" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactInfo;
