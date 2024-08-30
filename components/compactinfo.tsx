import React from "react";
import { useState } from "react";

interface CompactInfoProps {
  customerName: string;
  phoneNumber: string;
  cabin: string;
  total: number;
  orders: {
    _id: string;
    order: string;
    status: string;
  }[];
  onDispatchAll: (orderIds: string[]) => void;
  onFulfillAll: (orderIds: string[]) => void;
}

const CompactInfo: React.FC<CompactInfoProps> = ({
  customerName,
  phoneNumber,
  cabin,
  total,
  orders,
  onDispatchAll,
  onFulfillAll,
}) => {
  const [isDispatched, setIsDispatched] = useState(
    orders.every((order) => order.order === "dispatched")
  );
  const [isFulfilled, setIsFulfilled] = useState(
    orders.every((order) => order.status === "fulfilled")
  );

  const handleDispatchAll = () => {
    const orderIds = orders
      .filter((order) => order.order !== "dispatched")
      .map((order) => order._id);
    onDispatchAll(orderIds);
    setIsDispatched(true);
  };

  const handleFulfillAll = () => {
    const orderIds = orders
      .filter((order) => order.status !== "fulfilled")
      .map((order) => order._id);
    onFulfillAll(orderIds);
    setIsFulfilled(true);
  };

  return (
    <div className="bg-neutral-800 py-3 px-3 sm:px-3 sm:py-3 rounded-lg mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg">
              {customerName}
            </span>
            <span className="text-blue-400 text-sm sm:text-base">
              <a
                href={`tel:${phoneNumber}`}>
                {phoneNumber}
              </a>
            </span>
            <span className="bg-blue-600 px-2 py-0.5 rounded text-xs sm:text-sm">
              {cabin}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <span className="text-sm">Status:</span>
            <span
              className={`px-1 py-1 rounded text-sm ${
                isDispatched ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {isDispatched ? "Dispatched" : "Pending"}
            </span>
            {!isDispatched && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleDispatchAll}
              >
                Dispatch All
              </button>
            )}
            {isDispatched && (
              <>
                <span
                  className={`px-1 py-1 rounded text-sm  ${
                    isFulfilled ? "bg-green-500" : "bg-red-500"
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
        <div className="bg-rose-800 px-2 py-0.5 sm:px-3 sm:py-1 rounded text-sm sm:text-base font-bold whitespace-nowrap">
          Total: ₹{total}
        </div>
      </div>
    </div>
  );
};

export default CompactInfo;