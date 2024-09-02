import React from "react";
import { useState, useEffect } from "react";

interface CompactInfoProps {
  customerName: string;
  phoneNumber: string;
  cabin: string;
  total: number;
  orders: {
    _id: string;
    order: string;
    status: string;
    price: number;
  }[];
  onDispatchAll: (orderIds: string[]) => void;
  onFulfillAll: (orderIds: string[]) => void;
  onRejectAll: (orderIds: string[]) => Promise<void>;
  activeTab: "new" | "active" | "previous"; // Add this line
}

const CompactInfo: React.FC<CompactInfoProps> = ({
  customerName,
  phoneNumber,
  cabin,
  total,
  orders,
  onDispatchAll,
  onFulfillAll,
  onRejectAll,
  activeTab,
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
    <div className="bg-neutral-800 py-3 px-3 sm:px-3 sm:py-3 rounded-lg mb-4 flex flex-wrap lg:flex-nowrap lg:justify-between">
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
