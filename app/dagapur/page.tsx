"use client";
import React, { useEffect, useState } from "react";

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
}

export default function OrderDagapur() {
  const slug = "dagapur";
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
          type: "order",
          newStatus: "dispatched",
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
          type: "payment",
          newStatus: "fulfilled",
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

  if (loading) return <div>Loading orders...</div>;
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
    const midPoint = Math.ceil(orderEntries.length / 2);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[orderEntries.slice(0, midPoint), orderEntries.slice(midPoint)].map(
          (column, colIndex) => (
            <div key={colIndex} className="space-y-8">
              {column.map(([phoneNumber, orders]) => (
                <div
                  key={phoneNumber}
                  className="bg-neutral-900 rounded-lg p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 bg-neutral-700 p-2 rounded-lg inline-block">
                    Orders for {orders[0].customerName}
                  </h2>
                  <p className="mb-2">
                    Phone:{" "}
                    <span className="bg-blue-600 rounded p-1">
                      {phoneNumber}
                    </span>
                  </p>
                  <p className="mb-2">
                    Cabin:{" "}
                    <span className="bg-blue-600 rounded p-1">
                      {orders[0].selectedCabin}
                    </span>
                  </p>
                  {orders.map((order, orderIndex) => (
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
                        Date: {formatDate(order.createdAt)}
                      </p>
                      <h3 className="text-xl font-semibold mb-2">Items:</h3>
                      <ul className="space-y-4 mb-4">
                        {order.items.map((item, index) => (
                          <li
                            key={index}
                            className="bg-neutral-700 px-4 py-4 rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="bg-purple-700 p-1 rounded font-bold">
                                {item.item.name}
                              </span>
                              <span className="bg-orange-500 px-2 py-1 rounded-full text-sm font-semibold">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            <p className="mb-2">₹{item.totalPrice}</p>
                            {Object.entries(item.selectedOptions).map(
                              ([optionName, selectedValues]) => (
                                <p key={optionName} className="mb-2">
                                  {optionName}:{" "}
                                  <span className="bg-blue-500 p-1 rounded">
                                    {selectedValues.join(", ")}
                                  </span>
                                </p>
                              )
                            )}
                            {item.specialRequests && (
                              <p className="">
                                Special Requests:{" "}
                                <span className="bg-blue-500 p-1 rounded">
                                  {item.specialRequests}
                                </span>
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="font-semibold">Subtotal: ₹{order.total}</p>
                      {order.appliedPromo && (
                        <p className="mt-1 text-green-500">
                          Promo Applied: {order.appliedPromo.code} (
                          {order.appliedPromo.percentage}% off)
                        </p>
                      )}
                      {orderIndex < orders.length - 1 && (
                        <hr className="my-4 border-gray-600" />
                      )}
                    </div>
                  ))}
                  <p className="text-xl font-bold mb-1 ">
                    <span className="bg-rose-800 p-2 rounded">
                      Total: ₹
                      {orders.reduce((sum, order) => sum + order.total, 0)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Dagapur Orders</h1>

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
