import React, { useEffect, useState } from "react";

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
  return date.toLocaleString("en-US", options);
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
}

// Components
const OrderItem: React.FC<OrderItemProps> = ({ item }) => (
  <div className="bg-neutral-700 p-3 rounded-lg flex flex-col h-full">
    <div className="flex justify-between items-start mb-2">
      <span className="bg-purple-700 px-2 py-1 rounded font-bold text-sm">
        {item.name}
      </span>
      <span className="bg-orange-500 px-2 py-1 rounded-full text-xs font-semibold ml-2">
        Qty: {item.quantity}
      </span>
    </div>
    <p className=" font-semibold ">₹{item.totalPrice}</p>
    <div className="space-y-1">
      {Object.entries(item.selectedOptions).map(
        ([optionName, selectedValues]) => (
          <div key={optionName} className="flex items-center">
            <p className="font-bold text-sm mr-1">
              {optionName}:
            </p>
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
      <div className="mt-3 flex items-center">
        <p className="font-bold text-sm mr-2 min-w-[100px]">
          Special Requests:
        </p>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded inline-block">
          {item.specialRequests}
        </span>
      </div>
    )}
  </div>
);

const Timer: React.FC<TimerProps> = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const difference = start + 15 * 60 * 1000 - now;
      return difference > 0 ? Math.floor(difference / 1000) : null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  if (timeLeft === null) {
    return (
      <span className="bg-red-500 p-1 ml-1 text-sm rounded font-bold"> Time up</span>
    );
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
  return (
    <div className="flex items-center mb-2">
      <p className="mr-2">Order Status:</p>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <span
            className={`p-1 rounded text-sm ${
              order.order === "dispatched" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {order.order === "dispatched" ? "Dispatched" : "Pending"}
          </span>
          {order.order !== "dispatched" && (
            <button
              className="btn btn-primary btn-sm ml-1"
              onClick={() => onDispatch(order._id)}
            >
              Dispatch
            </button>
          )}
        </div>
        {order.order === "dispatched" && (
          <div className="flex items-center text-sm">
            <span
              className={`p-1 rounded ${
                order.status === "fulfilled" ? "bg-green-500" : "bg-red-500"
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
      <Timer startTime={order.updatedAt || order.createdAt} />
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
      order.tableDeliveryCharge && (
        <p className="mt-1 text-blue-500 text-sm">
          Delivery Charge: ₹{order.tableDeliveryCharge}
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
      <Timer startTime={order.updatedAt || order.createdAt} />
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
    <p className="mt-4 font-semibold">Subtotal: ₹{order.total}</p>
    {order.appliedPromo && (
      <p className="mt-1 text-green-500 text-sm">
        Promo Applied: {order.appliedPromo.code} (
        {order.appliedPromo.percentage}% off)
      </p>
    )}
    {order.selectedLocation.includes("Sevoke Road") &&
      order.tableDeliveryCharge && (
        <p className="mt-1 text-blue-500 text-sm">
          Delivery Charge: ₹{order.tableDeliveryCharge}
        </p>
      )}
  </div>
);

// Main OrderManagementPage component
const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Mock function to fetch orders
  const fetchOrders = async () => {
    // This would typically be an API call
    const mockOrders: Order[] = [
      // Add mock order data here
    ];
    setOrders(mockOrders);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDispatch = (orderId: string) => {
    // Update order status to dispatched
    setOrders(
      orders.map((order) =>
        order._id === orderId ? { ...order, order: "dispatched" } : order
      )
    );
    // In a real app, you'd also make an API call to update the backend
  };

  const handlePayment = (orderId: string) => {
    // Update order status to fulfilled
    setOrders(
      orders.map((order) =>
        order._id === orderId ? { ...order, status: "fulfilled" } : order
      )
    );
    // In a real app, you'd also make an API call to update the backend
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