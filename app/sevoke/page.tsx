"use client";
import React, { useEffect, useState } from "react";
import CompactOrderInfo from "@/components/compactinfo";
import OrderItem from "@/components/orderitem";

interface Order {
  _id: string;
  items: Array<{
    item: {
      name: string;
      price: string;
      customizationOptions: Array<{
        name: string;
        type: string;
        options: Array<{
          label: string;
          price: string;
        }>;
      }>;
    };
    selectedOptions: {
      [key: string]: string[];
    };
    quantity: number;
    specialRequests: string;
    totalPrice: number;
  }>;
  selectedLocation: string;
  selectedCabin: string;
  total: number;
  appliedPromo?: {
    code: string;
    percentage: number;
  };
  phoneNumber: string;
  customerName: string;
  status: string;
  order: string;
  createdAt: string;
  updatedAt?: string;
}
const Timer: React.FC<{ startTime: string }> = ({ startTime }) => {
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
    return <span className="bg-red-500 p-1 ml-1 rounded font-bold"> Time up</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <span className="bg-yellow-500 p-1 rounded ml-1 font-bold">
      {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
};
export default function OrderSevoke() {
  const slug = "sevoke";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviousOrders, setShowPreviousOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/getOrders?slug=${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError("Error fetching orders. Please try again later.");
        setLoading(false);
      }
    };
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 3000);
    return () => clearInterval(intervalId);
  }, []);
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
  const handleDispatch = async (orderId: string) => {
    try {
      const response = await fetch("/api/updateOrderStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          type: "/dispatch",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order dispatch status");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, order: "dispatched" } : order
        )
      );
    } catch (error) {
      console.error("Error updating order dispatch status:", error);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      const response = await fetch("/api/updateOrderStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          type: "/payment",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: "fulfilled" } : order
        )
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error) return <div>{error}</div>;

  const groupedOrders = orders.reduce(
    (acc, order) => {
      const key =
        order.status === "fulfilled" && order.order === "dispatched"
          ? "previous"
          : "current";
      if (!acc[key]) {
        acc[key] = {};
      }
      if (!acc[key][order.phoneNumber]) {
        acc[key][order.phoneNumber] = [];
      }
      acc[key][order.phoneNumber].push(order);
      return acc;
    },
    { current: {}, previous: {} } as {
      [key: string]: { [key: string]: Order[] };
    }
    );
    
    
  const renderOrders = (orders: { [key: string]: Order[] }) => {
    const orderEntries = Object.entries(orders);

    return (
      <div className="space-y-8">
        {orderEntries.map(([phoneNumber, customerOrders]) => (
          <div key={phoneNumber} className="bg-neutral-900 rounded-lg p-4">
            <CompactOrderInfo
              customerName={customerOrders[0].customerName}
              phoneNumber={phoneNumber}
              cabin={customerOrders[0].selectedCabin}
              total={customerOrders.reduce(
                (sum, order) => sum + order.total,
                0
              )}
            />
            {customerOrders
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((order, orderIndex) => (
                <div key={order._id} className="mb-6">
                  <div className="flex items-center mb-2">
                    <p className="mr-2">
                      Order Delivery:
                      <span
                        className={`p-1 rounded ml-2 ${
                          order.order === "dispatched"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {order.order}
                      </span>
                    </p>
                    {order.order !== "dispatched" && (
                      <button
                        className="btn py-1 btn-primary btn-sm"
                        onClick={() => handleDispatch(order._id)}
                      >
                        Dispatch
                      </button>
                    )}
                  </div>
                  <div className="flex items-center mb-2">
                    <p className="mr-2">
                      Payment Status:
                      <span
                        className={`p-1 rounded ml-2 ${
                          order.status === "fulfilled"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </p>
                    {order.status !== "fulfilled" && (
                      <button
                        className="btn py-1 btn-primary btn-sm"
                        onClick={() => handlePayment(order._id)}
                      >
                        Fulfill
                      </button>
                    )}
                  </div>
                  <p className="mb-4">
                    Date: {formatDate(order.createdAt)}{" "}
                    <Timer startTime={order.updatedAt || order.createdAt} />
                  </p>
                  <h3 className="text-xl font-semibold mb-2">Items:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  <p className="font-semibold">Subtotal: ₹{order.total}</p>
                  {order.appliedPromo && (
                    <p className="mt-1 text-green-500">
                      Promo Applied: {order.appliedPromo.code} (
                      {order.appliedPromo.percentage}% off)
                    </p>
                  )}
                  {orderIndex < customerOrders.length - 1 && (
                    <hr className="my-4 border-gray-600" />
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Sevoke Orders</h1>

      {renderOrders(groupedOrders.current)}

      <div className="mt-8">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setShowPreviousOrders(!showPreviousOrders)}
        >
          {showPreviousOrders ? "Hide Previous Orders" : "Show Previous Orders"}
        </button>
      </div>

      {showPreviousOrders && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">Previous Orders</h2>
          {renderOrders(groupedOrders.previous)}
        </div>
      )}

      {Object.keys(groupedOrders.current).length === 0 &&
        Object.keys(groupedOrders.previous).length === 0 && (
          <p className="text-center text-xl">No orders at the moment.</p>
        )}
    </div>
  );
}
