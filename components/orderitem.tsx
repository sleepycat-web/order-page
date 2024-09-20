import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  
  return date.toLocaleString("en-US", options).replace(",", "");
};

// Interfaces
interface OrderItem {
  item: {
    name: string;
  };
  totalPrice: number;
  quantity: number;
  selectedOptions: {
    [key: string]: string[];
  };
  specialRequests: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  appliedPromo?: {
    code: string;
    percentage: number;
  };
  order: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  selectedLocation: string;
  tableDeliveryCharge?: number;
  dispatchedAt?: string;
  fulfilledAt?: string;
  rejectedAt?: string;
  phoneNumber: string; // Add this line
  customerName: string; // Add this line
}


interface OrderItemProps {
  item: {
    name: string;
    totalPrice: number;
    quantity: number;
    selectedOptions: { [key: string]: string[] };
    specialRequests?: string;
  };
}

interface OrderComponentProps {
  order: Order;
  onDispatch: (orderId: string) => void;
  onPayment: (orderId: string) => void;
}

interface TimerProps {
  startTime: string;
  dispatchTime?: string; // Optional, since it might not be available initially
  isDispatched: boolean;
  isFulfilled: boolean;
  isRejected: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({ item }) => (
  <div className="bg-neutral-700 p-3 rounded-lg flex flex-col h-full">
    <div className="flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-purple-700 px-2 py-1 rounded font-bold text-sm">
          {item.name}
        </span>
        <span className="bg-orange-500 px-2 py-1 rounded-full text-xs font-semibold ml-2">
          Qty: {item.quantity}
        </span>
      </div>
      <p className="font-semibold mb-2">₹{item.totalPrice}</p>
    </div>
    <div className="space-y-1 flex-grow">
      {Object.entries(item.selectedOptions).map(
        ([optionName, selectedValues]) => (
          <div key={optionName} className="flex items-start ">
            <p className="font-bold text-sm mr-1">{optionName}:</p>
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((value, index) => (
                <div
                  key={index}
                  className="bg-blue-500 text-white text-sm px-1 rounded"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
    {item.specialRequests && (
      <div className="mt-3 flex items-start">
        <p className="font-bold text-sm mr-2 ">
          Special Requests:
        </p>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded inline-block">
          {item.specialRequests}
        </span>
      </div>
    )}
  </div>
);






const OrderStatus: React.FC<OrderComponentProps> = ({
  order,
  onDispatch,
  onPayment,
}) => {
  const [dispatchCountdown, setDispatchCountdown] = useState<number | null>(
    null
  );
  const [dispatchTimeoutId, setDispatchTimeoutId] =
    useState<NodeJS.Timeout | null>(null);

  const handleDispatchClick = () => {
    setDispatchCountdown(5);
    const timeoutId = setTimeout(() => {
      onDispatch(order._id);
      setDispatchCountdown(null);
    }, 5000);
    setDispatchTimeoutId(timeoutId);
  };

  const handleUndoDispatch = () => {
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

  return (
    <div className="flex items-center mb-2">
      <p className="mr-2">Order Status:</p>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <span
            className={`p-1 rounded text-sm ${
              order.order === "rejected"
                ? "bg-red-500"
                : order.order === "dispatched"
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          >
            {order.order === "rejected"
              ? "Rejected"
              : order.order === "dispatched"
              ? "Dispatched"
              : "Pending"}
          </span>
          {order.order !== "dispatched" && order.order !== "rejected" && (
            <>
              <button
                className="btn btn-primary btn-sm ml-1"
                onClick={handleDispatchClick}
                disabled={dispatchCountdown !== null}
              >
                Dispatch
              </button>
              {dispatchCountdown !== null && (
                <span className="ml-2 text-sm">
                  Dispatching in {dispatchCountdown}s
                  <button
                    className="btn btn-secondary btn-sm ml-1"
                    onClick={handleUndoDispatch}
                  >
                    Undo
                  </button>
                </span>
              )}
            </>
          )}
        </div>
        {order.order === "dispatched" && (
          <div className="flex items-center text-sm">
            <span
              className={`p-1 rounded ${
                order.status === "fulfilled" ? "bg-green-500" : "bg-yellow-500"
              }`}
            >
              {order.status === "fulfilled" ? "Fulfilled" : "Pending"}
            </span>
            {order.status !== "fulfilled" && (
              <button
                className="btn btn-primary btn-sm ml-1"
                onClick={() => onPayment(order._id)}
              >
                Fulfill
              </button>
            )}
          </div>
        )}
        
      </div>
      
    
    </div>
  );
};

const SingleItemOrder: React.FC<OrderComponentProps> = ({
  order,
  onDispatch,
  onPayment,
}) => {
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState({
    cash: false,
    gpay: false,
  });
  const [paymentAmounts, setPaymentAmounts] = useState({
    cash: "0",
    gpay: "0",
  });

  const toggleMethod = (method: "cash" | "gpay") => {
    setSelectedMethods((prev) => {
      const newMethods = {
        ...prev,
        [method]: !prev[method],
      };
      if (!newMethods.cash && !newMethods.gpay) {
        setPaymentAmounts({ cash: "0", gpay: "0" });
      } else if (newMethods.cash && !newMethods.gpay) {
        setPaymentAmounts({ cash: order.total.toString(), gpay: "0" });
      } else if (!newMethods.cash && newMethods.gpay) {
        setPaymentAmounts({ cash: "0", gpay: order.total.toString() });
      } else {
        setPaymentAmounts((prev) => ({
          cash: prev.cash,
          gpay: prev.gpay === "0" ? order.total.toString() : prev.gpay,
        }));
      }
      return newMethods;
    });
  };

  const handlePaymentChange = (method: "cash" | "gpay", value: string) => {
    const cleanedValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");
    const finalValue = cleanedValue === "" ? "0" : cleanedValue;
    const numValue = Math.max(0, Math.min(Number(finalValue), order.total));

    setPaymentAmounts((prev) => {
      const otherMethod = method === "cash" ? "gpay" : "cash";
      const otherAmount = Math.max(0, order.total - numValue);
      return {
        ...prev,
        [method]: finalValue,
        [otherMethod]: otherAmount.toString(),
      };
    });
  };

  const isSubmitDisabled = () => {
    if (selectedMethods.cash && selectedMethods.gpay) {
      const cashAmount = Number(paymentAmounts.cash) || 0;
      const gpayAmount = Number(paymentAmounts.gpay) || 0;
      return cashAmount + gpayAmount !== order.total;
    }
    return !selectedMethods.cash && !selectedMethods.gpay;
  };

  const handleOpenFulfillModal = () => {
    setIsFulfillModalOpen(true);
  };

  const confirmFulfill = async () => {
    try {
      await onPayment(order._id);

      if (selectedMethods.gpay) {
        const amountToSend = selectedMethods.cash
          ? Number(paymentAmounts.gpay)
          : order.total;

        const response = await axios.post("/api/updateOnline", {
          location: order.selectedLocation,
          amount: amountToSend,
          name: order.customerName,
        });

        if (response.status !== 200) {
          throw new Error("Failed to update online payment");
        }
      }

      setIsFulfillModalOpen(false);
    } catch (error) {
      console.error("Error fulfilling order:", error);
    }
  };

  return (
    <div
      className={`rounded-lg p-4 ${
        order.selectedLocation.includes("Sevoke Road") &&
        order.tableDeliveryCharge
          ? "bg-slate-700"
          : "bg-neutral-800"
      }`}
    >
      {" "}
      <OrderStatus
        order={order}
        onDispatch={onDispatch}
        onPayment={handleOpenFulfillModal}
      />{" "}
      <p className="mb-2 ">Date: {formatDate(order.createdAt)} </p>
      <div className="mt-2">
        <OrderItem
          item={{
            name: order.items[0].item.name,
            totalPrice: order.items[0].totalPrice,
            quantity: order.items[0].quantity,
            selectedOptions: order.items[0].selectedOptions,
            specialRequests: order.items[0].specialRequests,
          }}
        />
      </div>
      <p className="mt-2 font-semibold">Subtotal: ₹{order.total}</p>
      {order.appliedPromo && (
        <p className="mt-1 text-green-500 text-sm">
          Promo Applied: {order.appliedPromo.code} (
          {order.appliedPromo.percentage}% off)
        </p>
      )}
      {order.selectedLocation.includes("Sevoke Road") &&
      order.tableDeliveryCharge ? (
        <p className="mt-1 text-blue-500 text-sm">
          Delivery Charge: ₹{order.tableDeliveryCharge}
        </p>
      ) : null}
      {order.dispatchedAt && (
        <p className="mt-1 text-sm  text-yellow-500">
          Dispatched at: {formatDate(order.dispatchedAt)}
        </p>
      )}
      {order.fulfilledAt && (
        <p className="mt-1 text-sm text-green-500">
          Fulfilled at: {formatDate(order.fulfilledAt)}
        </p>
      )}
      {order.rejectedAt && (
        <p className="mt-1 text-sm text-red-500">
          Rejected at: {formatDate(order.rejectedAt)}
        </p>
      )}
      {/* Fulfill Modal */}
      <input
        type="checkbox"
        id={`fulfill-modal-${order._id}`}
        className="modal-toggle"
        checked={isFulfillModalOpen}
        onChange={() => setIsFulfillModalOpen(!isFulfillModalOpen)}
      />
      <div className="modal">
        <div className="modal-box bg-neutral-800">
          <h3 className="font-bold text-lg">Confirm Fulfillment</h3>
          <p className="font-semibold py-2">Total: ₹{order.total}</p>
          <div className="flex space-x-4 my-4">
            <button
              className={`p-2 border rounded ${
                selectedMethods.cash
                  ? "border-blue-500 border-2"
                  : "border-gray-500"
              }`}
              onClick={() => toggleMethod("cash")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 122.88 71.26"
                className="w-12 h-12"
              >
                <path
                  fill="#427d2a"
                  fillRule="evenodd"
                  d="M13.37,0H122.88V60.77l-7.74,0,.54-44.59,0-.53a7.14,7.14,0,0,0-7.13-7.14l-95.2,0V0ZM0,14.42H109.51V71.26H0V14.42Z"
                />
                <path
                  fill="#87cc71"
                  fillRule="evenodd"
                  d="M91.72,23.25a8.28,8.28,0,0,0,8,8.11V53.85a8.51,8.51,0,0,0-8.5,8.71H18.42a8.38,8.38,0,0,0-8.06-8.5V31.57a8.43,8.43,0,0,0,8.52-8.32Z"
                />
                <path
                  fill="#427d2a"
                  fillRule="evenodd"
                  d="M40.28,35.18a16.76,16.76,0,1,1,6.91,22.67,16.75,16.75,0,0,1-6.91-22.67Z"
                />
                <path
                  fill="#fff"
                  d="M55.22,55.38a1.54,1.54,0,0,1-1.56-1.56V52.3A11.09,11.09,0,0,1,51,51.82,13.32,13.32,0,0,1,49.06,51a1.61,1.61,0,0,1-.9-1,2,2,0,0,1,.06-1.27,1.66,1.66,0,0,1,.83-.88,1.57,1.57,0,0,1,1.38.12,10.45,10.45,0,0,0,1.73.69,9.31,9.31,0,0,0,2.72.35,4.27,4.27,0,0,0,2.53-.57A1.73,1.73,0,0,0,58.16,47a1.49,1.49,0,0,0-.52-1.16,4.11,4.11,0,0,0-1.86-.75l-2.84-.62q-4.71-1-4.71-5a5.07,5.07,0,0,1,1.48-3.68,6.84,6.84,0,0,1,3.95-1.88V32.29a1.53,1.53,0,0,1,.44-1.1,1.52,1.52,0,0,1,1.12-.45,1.44,1.44,0,0,1,1.08.45,1.53,1.53,0,0,1,.44,1.1v1.55a10.83,10.83,0,0,1,2,.46,7.18,7.18,0,0,1,1.8.88,1.62,1.62,0,0,1,.76,1,1.75,1.75,0,0,1-.12,1.15,1.43,1.43,0,0,1-.84.76,1.76,1.76,0,0,1-1.41-.19,8.26,8.26,0,0,0-1.52-.57,7.57,7.57,0,0,0-2-.23,3.88,3.88,0,0,0-2.35.62,1.89,1.89,0,0,0-.85,1.6,1.48,1.48,0,0,0,.5,1.15,4.11,4.11,0,0,0,1.77.74l2.87.62a7,7,0,0,1,3.64,1.77,4.36,4.36,0,0,1,1.17,3.14,4.79,4.79,0,0,1-1.48,3.62,7.28,7.28,0,0,1-3.87,1.84v1.62a1.52,1.52,0,0,1-.44,1.1,1.45,1.45,0,0,1-1.08.46Z"
                />
              </svg>
            </button>
            <button
              className={`p-2 rounded border ${
                selectedMethods.gpay
                  ? "border-blue-500 border-2 "
                  : "border-gray-500"
              }`}
              onClick={() => toggleMethod("gpay")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="437"
                height="174"
                viewBox="0 0 437 174"
                className="w-12 h-12"
              >
                <g fill="none" fill-rule="nonzero">
                  <path
                    fill="#5F6368"
                    d="M207.2 84.6v50.8h-16.1V10h42.7c10.3-.2 20.2 3.7 27.7 10.9 7.5 6.7 11.7 16.4 11.5 26.4.2 10.1-4 19.8-11.5 26.6-7.5 7.1-16.7 10.7-27.6 10.7h-26.7zm0-59.2v43.8h27c6 .2 11.8-2.2 15.9-6.5 8.5-8.2 8.6-21.7.4-30.2l-.4-.4c-4.1-4.4-9.9-6.8-15.9-6.6l-27-.1zM310.1 46.8c11.9 0 21.3 3.2 28.2 9.5 6.9 6.4 10.3 15.1 10.3 26.2v52.8h-15.4v-11.9h-.7c-6.7 9.8-15.5 14.7-26.6 14.7-9.4 0-17.4-2.8-23.7-8.4-6.2-5.2-9.7-12.9-9.5-21 0-8.9 3.4-15.9 10.1-21.2 6.7-5.3 15.7-7.9 26.9-7.9 9.6 0 17.4 1.8 23.6 5.2v-3.7c0-5.5-2.4-10.7-6.6-14.2-4.3-3.8-9.8-5.9-15.5-5.9-9 0-16.1 3.8-21.4 11.4l-14.2-8.9c7.7-11.1 19.2-16.7 34.5-16.7zm-20.8 62.3c0 4.2 2 8.1 5.3 10.5 3.6 2.8 8 4.3 12.5 4.2 6.8 0 13.3-2.7 18.1-7.5 5.3-5 8-10.9 8-17.7-5-4-12-6-21-6-6.5 0-12 1.6-16.4 4.7-4.3 3.2-6.5 7.1-6.5 11.8zM437 49.6l-53.8 123.6h-16.6l20-43.2-35.4-80.3h17.5l25.5 61.6h.4l24.9-61.6z"
                  />
                  <path
                    fill="#4285F4"
                    d="M142.1 73.6c0-4.9-.4-9.8-1.2-14.6H73v27.7h38.9c-1.6 8.9-6.8 16.9-14.4 21.9v18h23.2c13.6-12.5 21.4-31 21.4-53z"
                  />
                  <path
                    fill="#34A853"
                    d="M73 144c19.4 0 35.8-6.4 47.7-17.4l-23.2-18c-6.5 4.4-14.8 6.9-24.5 6.9-18.8 0-34.7-12.7-40.4-29.7H8.7v18.6C20.9 128.6 45.8 144 73 144z"
                  />
                  <path
                    fill="#FBBC04"
                    d="M32.6 85.8c-3-8.9-3-18.6 0-27.6V39.7H8.7a71.39 71.39 0 0 0 0 64.6l23.9-18.5z"
                  />
                  <path
                    fill="#EA4335"
                    d="M73 28.5c10.3-.2 20.2 3.7 27.6 10.8l20.5-20.5C108.1 6.5 90.9-.2 73 0 45.8 0 20.9 15.4 8.7 39.7l23.9 18.6C38.3 41.2 54.2 28.5 73 28.5z"
                  />
                </g>
              </svg>
            </button>
          </div>
          {selectedMethods.cash && selectedMethods.gpay && (
            <div className="flex space-x-4 my-4">
              <div>
                <label
                  htmlFor="cashAmount"
                  className="block text-sm font-medium text-gray-300"
                >
                  Cash Amount
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="cashAmount"
                  value={paymentAmounts.cash}
                  onChange={(e) => handlePaymentChange("cash", e.target.value)}
                  className="mt-1 block w-full p-1 rounded-md bg-neutral-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="gpayAmount"
                  className="block text-sm font-medium text-gray-300"
                >
                  GPay Amount
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="gpayAmount"
                  value={paymentAmounts.gpay}
                  onChange={(e) => handlePaymentChange("gpay", e.target.value)}
                  className="mt-1 p-1 block w-full rounded-md bg-neutral-700 border-gray-600 text-white"
                />
              </div>
            </div>
          )}
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={confirmFulfill}
              disabled={isSubmitDisabled()}
            >
              Confirm
            </button>
            <button
              className="btn"
              onClick={() => setIsFulfillModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MultiItemOrder: React.FC<OrderComponentProps> = ({
  order,
  onDispatch,
  onPayment,
}) => {
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState({
    cash: false,
    gpay: false,
  });
  const [paymentAmounts, setPaymentAmounts] = useState({
    cash: "0",
    gpay: "0",
  });

  const toggleMethod = (method: "cash" | "gpay") => {
    setSelectedMethods((prev) => {
      const newMethods = {
        ...prev,
        [method]: !prev[method],
      };
      if (!newMethods.cash && !newMethods.gpay) {
        setPaymentAmounts({ cash: "0", gpay: "0" });
      } else if (newMethods.cash && !newMethods.gpay) {
        setPaymentAmounts({ cash: order.total.toString(), gpay: "0" });
      } else if (!newMethods.cash && newMethods.gpay) {
        setPaymentAmounts({ cash: "0", gpay: order.total.toString() });
      } else {
        setPaymentAmounts((prev) => ({
          cash: prev.cash,
          gpay: prev.gpay === "0" ? order.total.toString() : prev.gpay,
        }));
      }
      return newMethods;
    });
  };

  const handlePaymentChange = (method: "cash" | "gpay", value: string) => {
    const cleanedValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");
    const finalValue = cleanedValue === "" ? "0" : cleanedValue;
    const numValue = Math.max(0, Math.min(Number(finalValue), order.total));

    setPaymentAmounts((prev) => {
      const otherMethod = method === "cash" ? "gpay" : "cash";
      const otherAmount = Math.max(0, order.total - numValue);
      return {
        ...prev,
        [method]: finalValue,
        [otherMethod]: otherAmount.toString(),
      };
    });
  };

  const isSubmitDisabled = () => {
    if (selectedMethods.cash && selectedMethods.gpay) {
      const cashAmount = Number(paymentAmounts.cash) || 0;
      const gpayAmount = Number(paymentAmounts.gpay) || 0;
      return cashAmount + gpayAmount !== order.total;
    }
    return !selectedMethods.cash && !selectedMethods.gpay;
  };

  const handleOpenFulfillModal = () => {
    setIsFulfillModalOpen(true);
  };

  const confirmFulfill = async () => {
    try {
      await onPayment(order._id);

      if (selectedMethods.gpay) {
        const amountToSend = selectedMethods.cash
          ? Number(paymentAmounts.gpay)
          : order.total;

        const response = await axios.post("/api/updateOnline", {
          location: order.selectedLocation,
          amount: amountToSend,
          name: order.customerName,
        });

        if (response.status !== 200) {
          throw new Error("Failed to update online payment");
        }
      }

      setIsFulfillModalOpen(false);
    } catch (error) {
      console.error("Error fulfilling order:", error);
    }
  };

  return (
    <div
      className={`rounded-lg p-4 ${
        order.selectedLocation.includes("Sevoke Road") &&
        order.tableDeliveryCharge
          ? "bg-slate-700"
          : "bg-neutral-800"
      }`}
    >
      <OrderStatus
        order={order}
        onDispatch={onDispatch}
        onPayment={handleOpenFulfillModal}
      />
      <p className="mb-2">Date: {formatDate(order.createdAt)}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {order.items.map((orderItem, index) => (
          <OrderItem
            key={index}
            item={{
              name: orderItem.item.name,
              totalPrice: orderItem.totalPrice,
              quantity: orderItem.quantity,
              selectedOptions: orderItem.selectedOptions,
              specialRequests: orderItem.specialRequests,
            }}
          />
        ))}
      </div>
      <p className="mt-2 font-semibold">Subtotal: ₹{order.total}</p>
      {order.appliedPromo && (
        <p className="mt-1 text-green-500 text-sm">
          Promo Applied: {order.appliedPromo.code} (
          {order.appliedPromo.percentage}% off)
        </p>
      )}
      {order.selectedLocation.includes("Sevoke Road") &&
      order.tableDeliveryCharge ? (
        <p className="mt-1 text-blue-500 text-sm">
          Delivery Charge: ₹{order.tableDeliveryCharge}
        </p>
      ) : null}
      {order.dispatchedAt && (
        <p className="mt-1 text-sm text-yellow-500">
          Dispatched at: {formatDate(order.dispatchedAt)}
        </p>
      )}
      {order.fulfilledAt && (
        <p className="mt-1 text-sm text-green-500">
          Fulfilled at: {formatDate(order.fulfilledAt)}
        </p>
      )}
      {order.rejectedAt && (
        <p className="mt-1 text-sm text-red-500">
          Rejected at: {formatDate(order.rejectedAt)}
        </p>
      )}

      {/* Fulfill Modal */}
      <input
        type="checkbox"
        id={`fulfill-modal-${order._id}`}
        className="modal-toggle"
        checked={isFulfillModalOpen}
        onChange={() => setIsFulfillModalOpen(!isFulfillModalOpen)}
      />
      <div className="modal">
        <div className="modal-box bg-neutral-800">
          <h3 className="font-bold text-lg">Confirm Fulfillment</h3>
          <p className="font-semibold py-2">Total: ₹{order.total}</p>
          <div className="flex space-x-4 my-4">
            <button
              className={`p-2 border rounded ${
                selectedMethods.cash
                  ? "border-blue-500 border-2"
                  : "border-gray-500"
              }`}
              onClick={() => toggleMethod("cash")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 122.88 71.26"
                className="w-12 h-12"
              >
                <path
                  fill="#427d2a"
                  fillRule="evenodd"
                  d="M13.37,0H122.88V60.77l-7.74,0,.54-44.59,0-.53a7.14,7.14,0,0,0-7.13-7.14l-95.2,0V0ZM0,14.42H109.51V71.26H0V14.42Z"
                />
                <path
                  fill="#87cc71"
                  fillRule="evenodd"
                  d="M91.72,23.25a8.28,8.28,0,0,0,8,8.11V53.85a8.51,8.51,0,0,0-8.5,8.71H18.42a8.38,8.38,0,0,0-8.06-8.5V31.57a8.43,8.43,0,0,0,8.52-8.32Z"
                />
                <path
                  fill="#427d2a"
                  fillRule="evenodd"
                  d="M40.28,35.18a16.76,16.76,0,1,1,6.91,22.67,16.75,16.75,0,0,1-6.91-22.67Z"
                />
                <path
                  fill="#fff"
                  d="M55.22,55.38a1.54,1.54,0,0,1-1.56-1.56V52.3A11.09,11.09,0,0,1,51,51.82,13.32,13.32,0,0,1,49.06,51a1.61,1.61,0,0,1-.9-1,2,2,0,0,1,.06-1.27,1.66,1.66,0,0,1,.83-.88,1.57,1.57,0,0,1,1.38.12,10.45,10.45,0,0,0,1.73.69,9.31,9.31,0,0,0,2.72.35,4.27,4.27,0,0,0,2.53-.57A1.73,1.73,0,0,0,58.16,47a1.49,1.49,0,0,0-.52-1.16,4.11,4.11,0,0,0-1.86-.75l-2.84-.62q-4.71-1-4.71-5a5.07,5.07,0,0,1,1.48-3.68,6.84,6.84,0,0,1,3.95-1.88V32.29a1.53,1.53,0,0,1,.44-1.1,1.52,1.52,0,0,1,1.12-.45,1.44,1.44,0,0,1,1.08.45,1.53,1.53,0,0,1,.44,1.1v1.55a10.83,10.83,0,0,1,2,.46,7.18,7.18,0,0,1,1.8.88,1.62,1.62,0,0,1,.76,1,1.75,1.75,0,0,1-.12,1.15,1.43,1.43,0,0,1-.84.76,1.76,1.76,0,0,1-1.41-.19,8.26,8.26,0,0,0-1.52-.57,7.57,7.57,0,0,0-2-.23,3.88,3.88,0,0,0-2.35.62,1.89,1.89,0,0,0-.85,1.6,1.48,1.48,0,0,0,.5,1.15,4.11,4.11,0,0,0,1.77.74l2.87.62a7,7,0,0,1,3.64,1.77,4.36,4.36,0,0,1,1.17,3.14,4.79,4.79,0,0,1-1.48,3.62,7.28,7.28,0,0,1-3.87,1.84v1.62a1.52,1.52,0,0,1-.44,1.1,1.45,1.45,0,0,1-1.08.46Z"
                />
              </svg>
            </button>
            <button
              className={`p-2 rounded border ${
                selectedMethods.gpay
                  ? "border-blue-500 border-2 "
                  : "border-gray-500"
              }`}
              onClick={() => toggleMethod("gpay")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="437"
                height="174"
                viewBox="0 0 437 174"
                className="w-12 h-12"
              >
                <g fill="none" fill-rule="nonzero">
                  <path
                    fill="#5F6368"
                    d="M207.2 84.6v50.8h-16.1V10h42.7c10.3-.2 20.2 3.7 27.7 10.9 7.5 6.7 11.7 16.4 11.5 26.4.2 10.1-4 19.8-11.5 26.6-7.5 7.1-16.7 10.7-27.6 10.7h-26.7zm0-59.2v43.8h27c6 .2 11.8-2.2 15.9-6.5 8.5-8.2 8.6-21.7.4-30.2l-.4-.4c-4.1-4.4-9.9-6.8-15.9-6.6l-27-.1zM310.1 46.8c11.9 0 21.3 3.2 28.2 9.5 6.9 6.4 10.3 15.1 10.3 26.2v52.8h-15.4v-11.9h-.7c-6.7 9.8-15.5 14.7-26.6 14.7-9.4 0-17.4-2.8-23.7-8.4-6.2-5.2-9.7-12.9-9.5-21 0-8.9 3.4-15.9 10.1-21.2 6.7-5.3 15.7-7.9 26.9-7.9 9.6 0 17.4 1.8 23.6 5.2v-3.7c0-5.5-2.4-10.7-6.6-14.2-4.3-3.8-9.8-5.9-15.5-5.9-9 0-16.1 3.8-21.4 11.4l-14.2-8.9c7.7-11.1 19.2-16.7 34.5-16.7zm-20.8 62.3c0 4.2 2 8.1 5.3 10.5 3.6 2.8 8 4.3 12.5 4.2 6.8 0 13.3-2.7 18.1-7.5 5.3-5 8-10.9 8-17.7-5-4-12-6-21-6-6.5 0-12 1.6-16.4 4.7-4.3 3.2-6.5 7.1-6.5 11.8zM437 49.6l-53.8 123.6h-16.6l20-43.2-35.4-80.3h17.5l25.5 61.6h.4l24.9-61.6z"
                  />
                  <path
                    fill="#4285F4"
                    d="M142.1 73.6c0-4.9-.4-9.8-1.2-14.6H73v27.7h38.9c-1.6 8.9-6.8 16.9-14.4 21.9v18h23.2c13.6-12.5 21.4-31 21.4-53z"
                  />
                  <path
                    fill="#34A853"
                    d="M73 144c19.4 0 35.8-6.4 47.7-17.4l-23.2-18c-6.5 4.4-14.8 6.9-24.5 6.9-18.8 0-34.7-12.7-40.4-29.7H8.7v18.6C20.9 128.6 45.8 144 73 144z"
                  />
                  <path
                    fill="#FBBC04"
                    d="M32.6 85.8c-3-8.9-3-18.6 0-27.6V39.7H8.7a71.39 71.39 0 0 0 0 64.6l23.9-18.5z"
                  />
                  <path
                    fill="#EA4335"
                    d="M73 28.5c10.3-.2 20.2 3.7 27.6 10.8l20.5-20.5C108.1 6.5 90.9-.2 73 0 45.8 0 20.9 15.4 8.7 39.7l23.9 18.6C38.3 41.2 54.2 28.5 73 28.5z"
                  />
                </g>
              </svg>
            </button>
          </div>
          {selectedMethods.cash && selectedMethods.gpay && (
            <div className="flex space-x-4 my-4">
              <div>
                <label
                  htmlFor="cashAmount"
                  className="block text-sm font-medium text-gray-300"
                >
                  Cash Amount
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="cashAmount"
                  value={paymentAmounts.cash}
                  onChange={(e) => handlePaymentChange("cash", e.target.value)}
                  className="mt-1 block w-full p-1 rounded-md bg-neutral-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="gpayAmount"
                  className="block text-sm font-medium text-gray-300"
                >
                  GPay Amount
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="gpayAmount"
                  value={paymentAmounts.gpay}
                  onChange={(e) => handlePaymentChange("gpay", e.target.value)}
                  className="mt-1 p-1 block w-full rounded-md bg-neutral-700 border-gray-600 text-white"
                />
              </div>
            </div>
          )}
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={confirmFulfill}
              disabled={isSubmitDisabled()}
            >
              Confirm
            </button>
            <button
              className="btn"
              onClick={() => setIsFulfillModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main OrderManagementPage component
const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const handleDispatch = async (orderId: string) => {
    try {
      const order = orders.find((o) => o._id === orderId);

      if (!order) return;

      const response = await axios.post("/api/updateOrderStatus", {
        orderId,
        type: "/dispatch",
      });

      if (response.status === 200) {
        const { dispatchedAt } = response.data.updatedFields;
        setOrders(
          orders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  order: "dispatched",
                  dispatchedAt: dispatchedAt,
                }
              : order
          )
        );

        const { phoneNumber, customerName } = order;
        const smsResponse = await axios.post("/api/sendConfirmationSms", {
          phoneNumber,
          customerName,
        });

        if (smsResponse.status === 200) {
          console.log("Confirmation SMS sent successfully.");
        } else {
          console.error("Failed to send confirmation SMS.");
        }
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      const response = await axios.post("/api/updateOrderStatus", {
        orderId,
        type: "/payment",
      });

      if (response.status === 200) {
        const { fulfilledAt } = response.data.updatedFields;
        setOrders(
          orders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: "fulfilled",
                  fulfilledAt: fulfilledAt,
                }
              : order
          )
        );
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>
      <div className="space-y-4">
        {orders.map((order) =>
          order.items.length === 1 ? (
            <SingleItemOrder
              key={order._id}
              order={order}
              onDispatch={handleDispatch}
              onPayment={handlePayment}
            />
          ) : (
            <MultiItemOrder
              key={order._id}
              order={order}
              onDispatch={handleDispatch}
              onPayment={handlePayment}
            />
          )
        )}
      </div>
    </div>
  );
};

export default OrderManagementPage;

export { SingleItemOrder, MultiItemOrder };