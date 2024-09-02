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
  isDispatched: boolean;
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

const Timer: React.FC<TimerProps> = ({
  startTime,
  isDispatched,
  isRejected,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isCountingUp, setIsCountingUp] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const difference = start + 15 * 60 * 1000 - now;

      if (difference > 0) {
        setIsCountingUp(false);
        return Math.floor(difference / 1000); // Initial countdown (15 mins to 0)
      } else {
        setIsCountingUp(true);
        return Math.floor((now - start - 15 * 60 * 1000) / 1000); // Count-up timer after 15 mins
      }
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  if (isDispatched && !isCountingUp) {
    return (
      <span className="bg-green-500 p-1 ml-1 text-sm rounded">On Time</span>
    );
  }

  if (isRejected) {
    return (
      <span className="bg-red-500 p-1 ml-1 text-sm rounded">Rejected</span>
    );
  }

  if (isCountingUp && timeLeft !== null && timeLeft <= 15 * 60) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <span className="bg-orange-500 p-1 rounded ml-1 text-sm font-bold">
        -{minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    );
  }

  if (timeLeft === null || (isCountingUp && timeLeft > 15 * 60)) {
    return <span className="bg-red-500 p-1 ml-1 text-sm rounded">Time up</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="bg-yellow-500 p-1 rounded ml-1 text-sm font-bold">
      {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
};


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
}) => (
  <div className="bg-neutral-800 rounded-lg p-4">
    <OrderStatus order={order} onDispatch={onDispatch} onPayment={onPayment} />
    <p className="mb-2 ">
      Date: {formatDate(order.createdAt)}{" "}
      <Timer
        startTime={order.updatedAt || order.createdAt}
        isDispatched={order.order === "dispatched"}
        isRejected={order.order === "rejected" || order.status === "rejected"}
      />{" "}
    </p>
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
  </div>
);

const MultiItemOrder: React.FC<OrderComponentProps> = ({
  order,
  onDispatch,
  onPayment,
}) => (
  <div className="bg-neutral-800 rounded-lg p-4">
    <OrderStatus order={order} onDispatch={onDispatch} onPayment={onPayment} />
    <p className="mb-2">
      Date: {formatDate(order.createdAt)}{" "}
      <Timer
        startTime={order.updatedAt || order.createdAt}
        isDispatched={order.order === "dispatched"}
        isRejected={order.order === "rejected" || order.status === "rejected"}
      />{" "}
    </p>
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
  </div>
);

// Main OrderManagementPage component
const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);


  const handleDispatch = async (orderId: string) => {
    try {
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