import React from "react";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { OrderItem,  CompactInfoProps } from "@/scripts/interface";
import axios from "axios";


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
  location, oldestDispatchTime, 
}) => {
   const [showExtraPayment, setShowExtraPayment] = useState(false);
   const [extraPaymentType, setExtraPaymentType] = useState<
     "cash" | "upi" | null
   >(null);
   const [extraPaymentAmount, setExtraPaymentAmount] = useState("");

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [dispatchTimeoutId, setDispatchTimeoutId] =
    useState<NodeJS.Timeout | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState({
    cash: false,
    gpay: false,
  });
  const [paymentAmounts, setPaymentAmounts] = useState({
    cash: "0",
    gpay: "0",
  });
const [showPhoneNumber, setShowPhoneNumber] = useState(false);
    const handleExtraPaymentToggle = () => {
      setShowExtraPayment(!showExtraPayment);
      setExtraPaymentType(null);
      setExtraPaymentAmount("");
    };
 const handleExtraPaymentTypeSelect = (type: "cash" | "upi") => {
   setExtraPaymentType(type);
  };
   const [selectedItems, setSelectedItems] = useState<
     Array<{ orderId: string; itemIndex: number }>
   >([]);
   const [isRejecting, setIsRejecting] = useState(false);

   const toggleItemSelection = (orderId: string, itemIndex: number) => {
     setSelectedItems((prev) => {
       const existingIndex = prev.findIndex(
         (item) => item.orderId === orderId && item.itemIndex === itemIndex
       );

       if (existingIndex >= 0) {
         return prev.filter((_, index) => index !== existingIndex);
       } else {
         return [...prev, { orderId, itemIndex }];
       }
     });
   };

   // New function to handle partial rejection
   const handlePartialReject = async () => {
     if (isRejecting || selectedItems.length === 0) return;

     try {
       setIsRejecting(true);

       // Group selected items by order ID
       const itemsByOrder = selectedItems.reduce(
         (acc, { orderId, itemIndex }) => {
           if (!acc[orderId]) {
             acc[orderId] = [];
           }
           acc[orderId].push(itemIndex);
           return acc;
         },
         {} as Record<string, number[]>
       );

       // Process each order's rejections
       await Promise.all(
         Object.entries(itemsByOrder).map(([orderId, itemsToRemove]) =>
           axios.post("/api/updateOrderStatus", {
             orderId,
             type: "/remove",
             itemsToRemove,
           })
         )
       );

       setIsRejectModalOpen(false);
       setSelectedItems([]);

       // Refresh the orders list or update the UI as needed
       // You might want to add a prop for this: onOrdersUpdate()
     } catch (error) {
       console.error("Error rejecting items:", error);
     } finally {
       setIsRejecting(false);
     }
   };
const renderSelectedOptions = (item: any) => {
  if (!item.selectedOptions) return null;

  return Object.entries(item.selectedOptions).map(
    ([category, options]: [string, any]) => (
      <div key={category} className="ml-6 text-sm text-gray-400">
        <span className="font-medium"></span>{" "}
        {Array.isArray(options) ? options.join(", ") : options}
      </div>
    )
  );
 };
const togglePhoneNumber = async () => {
  setShowPhoneNumber(true);
  setTimeout(() => setShowPhoneNumber(false), 10000); // 10 seconds

  // Send email notification
  try {
    const response = await fetch("/api/sendNumberEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName,
        phoneNumber,
        location,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email notification");
    }
  } catch (error) {
    console.error("Error sending email notification:", error);
    // You might want to show an error message to the user here
  }
};

 const handleExtraPaymentAmountChange = (value: string) => {
   const cleanedValue = value.replace(/[^0-9]/g, "");
   setExtraPaymentAmount(cleanedValue === "" ? "" : cleanedValue);
 };

   const toggleMethod = (method: "cash" | "gpay") => {
     setSelectedMethods((prev) => {
       const newMethods = {
         ...prev,
         [method]: !prev[method],
       };

       // If no methods are selected, reset both amounts to 0
       if (!newMethods.cash && !newMethods.gpay) {
         setPaymentAmounts({ cash: "0", gpay: "0" });
       } else {
         // Always set GPay to the total amount and Cash to 0 when any method is selected
         setPaymentAmounts({
           gpay: nonRejectedTotal.toString(),
           cash: "0",
         });
       }

       return newMethods;
     });
   };
 const handlePaymentChange = (method: "cash" | "gpay", value: string) => {
   // Remove leading zeros and non-numeric characters
   const cleanedValue = value.replace(/^0+/, "").replace(/[^0-9]/g, "");

   // If the cleaned value is empty, set it to "0"
   const finalValue = cleanedValue === "" ? "0" : cleanedValue;

   const numValue = Math.max(0, Math.min(Number(finalValue), nonRejectedTotal));

   setPaymentAmounts((prev) => {
     const otherMethod = method === "cash" ? "gpay" : "cash";
     const otherAmount = Math.max(0, nonRejectedTotal - numValue);
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
      return cashAmount + gpayAmount !== nonRejectedTotal;
    }
    return !selectedMethods.cash && !selectedMethods.gpay;
  };
  const handleOpenFulfillModal = () => {
    setIsFulfillModalOpen(true);
  };

 const confirmFulfill = async () => {
   if (isProcessing) return;
   try {
     setIsProcessing(true);
     await onFulfillAll(orders.map((order) => order._id));
     setIsFulfilled(true);

     if (selectedMethods.gpay) {
       const amountToSend = selectedMethods.cash
         ? Number(paymentAmounts.gpay)
         : nonRejectedTotal;

       await updateOnlinePayment(location, amountToSend, customerName, "upi");
     }

     if (extraPaymentAmount && extraPaymentType) {
       const extraAmount = Number(extraPaymentAmount);
       const paymentType =
         extraPaymentType === "upi" ? "extraUpi" : "extraCash";
       await updateOnlinePayment(
         location,
         extraAmount,
         customerName,
         paymentType
       );
     }

     setIsFulfillModalOpen(false);
   } catch (error) {
     console.error("Error fulfilling orders:", error);
   } finally {
     setIsProcessing(false);
   }
 };

   const updateOnlinePayment = async (location: string, amount: number, name: string, paymentType: string) => {
    const response = await fetch("/api/updateOnline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location,
        amount,
        name,
        paymentType,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update online payment");
    }
  };
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
        event.target.closest("a") ||
        event.target.closest(".modal")) // Add this line to check for clicks within the modal
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
        hasDeliveryCharge ? "bg-slate-700" : "bg-neutral-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full lg:w-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base sm:text-lg">
              {customerName}
            </span>
            <span className="text-blue-400 text-sm sm:text-base">
              {showPhoneNumber ? (
                <a href={`tel:${phoneNumber}`}>{phoneNumber}</a>
              ) : (
                <button onClick={togglePhoneNumber} className="text-blue-400 ">
                  Show Number
                </button>
              )}
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
                    onClick={handleOpenFulfillModal}
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
      <div className="modal">
        <div className="modal-box bg-neutral-800">
          <h3 className="font-bold text-lg">Select Items to Reject</h3>
          <div className="py-4">
            {orders.map((order) => (
              <div key={order._id} className="mb-4">
                {order.items.map((item: OrderItem, index: number) => (
                  <div
                    key={`${order._id}-${index}`}
                    className="border-b border-gray-700 pb-2 hover:bg-neutral-700 cursor-pointer flex items-center gap-2 p-3"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItems.some(
                        (sel) =>
                          sel.orderId === order._id && sel.itemIndex === index
                      )}
                      onChange={(e) => {
                        e.stopPropagation(); // Stop event propagation for checkbox
                        toggleItemSelection(order._id, index);
                      }}
                      className="checkbox"
                    />

                    {/* Item Details (Clickable Area) */}
                    <div
                      className="flex-1"
                      onClick={() => toggleItemSelection(order._id, index)}
                    >
                      <span className="font-medium">
                        {item.item.name} - ₹{item.totalPrice} (Qty:{" "}
                        {item.quantity})
                      </span>
                      {renderSelectedOptions(item)}
                      {item.specialRequests && (
                        <div className="ml-6 text-sm text-gray-400">
                          <span className="font-medium">Special Requests:</span>{" "}
                          {item.specialRequests}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Modal Actions */}
          <div className="modal-action">
            <button
              className="btn btn-error text-white"
              onClick={handlePartialReject}
              disabled={selectedItems.length === 0 || isRejecting}
            >
              {isRejecting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "Reject"
              )}
            </button>
            <button
              className="btn"
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedItems([]);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <input
        type="checkbox"
        id="fulfill-modal"
        className="modal-toggle"
        checked={isFulfillModalOpen}
        onChange={() => setIsFulfillModalOpen(!isFulfillModalOpen)}
      />
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-box bg-neutral-800">
          <h3 className="font-bold text-lg">Confirm Fulfillment</h3>
          <p className="font-semibold py-2">Total: ₹{nonRejectedTotal}</p>
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
                <g fill="none" fillRule="nonzero">
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
            <button
              className={`w-16 h-16 flex items-center justify-center rounded border ${
                showExtraPayment
                  ? "border-2 border-blue-500"
                  : "border-gray-500"
              }`}
              onClick={handleExtraPaymentToggle}
            >
              <Plus size={24} />
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
          {showExtraPayment && (
            <div className="mt-4">
              <div className="flex space-x-4 mb-2">
                <button
                  className={`btn btn-sm ${
                    extraPaymentType === "cash"
                      ? "btn-primary"
                      : "btn-outline btn-secondary"
                  }`}
                  onClick={() => handleExtraPaymentTypeSelect("cash")}
                >
                  Cash
                </button>
                <button
                  className={`btn btn-sm ${
                    extraPaymentType === "upi"
                      ? "btn-primary"
                      : "btn-outline btn-secondary"
                  }`}
                  onClick={() => handleExtraPaymentTypeSelect("upi")}
                >
                  UPI
                </button>
              </div>
              {extraPaymentType && (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={extraPaymentAmount}
                  onChange={(e) =>
                    handleExtraPaymentAmountChange(e.target.value)
                  }
                  className="mt-1 block w-full p-1 rounded-md bg-neutral-700 border-gray-600 text-white"
                  placeholder="Enter extra amount"
                />
              )}
            </div>
          )}
          <div className="modal-action">
            <button
              className="btn btn-primary"
              onClick={confirmFulfill}
              disabled={isSubmitDisabled() || isProcessing}
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

export default CompactInfo;