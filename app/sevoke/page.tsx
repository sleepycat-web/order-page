"use client";
import React, { useEffect, useState } from "react";
import CompactOrderInfo from "@/components/compactinfo";
import { SingleItemOrder, MultiItemOrder } from "@/components/orderitem";

interface OrderItem {
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
}

interface Order {
  _id: string;
  items: OrderItem[];
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
  dispatchedAt?: string;
  fulfilledAt?: string;
  tableDeliveryCharge?: number;
}

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

  const handleDispatchAll = async (orderIds: string[]) => {
    for (const orderId of orderIds) {
      await handleDispatch(orderId);
    }
  };

  const handleFulfillAll = async (orderIds: string[]) => {
    for (const orderId of orderIds) {
      await handlePayment(orderId);
    }
  };

  const calculateTotalDeliveryCharges = (orders: {
    [key: string]: Order[];
  }) => {
    return Object.values(orders)
      .flat()
      .reduce((total, order) => {
        return total + (order.tableDeliveryCharge || 0);
      }, 0);
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
        {orderEntries.map(([phoneNumber, customerOrders]) => {
          const singleItemOrders = customerOrders.filter(
            (order) => order.items.length === 1
          );
          const multiItemOrders = customerOrders.filter(
            (order) => order.items.length > 1
          );

          return (
            <div key={phoneNumber} className="bg-neutral-900 rounded-lg p-4">
              <CompactOrderInfo
                customerName={customerOrders[0].customerName}
                phoneNumber={phoneNumber}
                cabin={customerOrders[0].selectedCabin}
                total={customerOrders.reduce(
                  (sum, order) => sum + order.total,
                  0
                )}
                orders={customerOrders.map((order) => ({
                  _id: order._id,
                  order: order.order,
                  status: order.status,
                }))}
                onDispatchAll={handleDispatchAll}
                onFulfillAll={handleFulfillAll}
              />

              {singleItemOrders.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {singleItemOrders
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((order) => (
                        <SingleItemOrder
                          key={order._id}
                          order={order}
                          onDispatch={handleDispatch}
                          onPayment={handlePayment}
                        />
                      ))}
                  </div>
                </div>
              )}

              {multiItemOrders.length > 0 && (
                <div className="mt-4">
                  <div className="space-y-4">
                    {multiItemOrders
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((order) => (
                        <MultiItemOrder
                          key={order._id}
                          order={order}
                          onDispatch={handleDispatch}
                          onPayment={handlePayment}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
          {Object.values(groupedOrders.previous).some((orders) =>
            orders.some((order) =>
              order.selectedLocation.includes("Sevoke Road")
            )
          ) && (
            <div className="mb-4 ">
              <span className="bg-teal-600 p-2 rounded">
                <span className="font-semibold">Total tips for the day: </span>
                <span className="">
                  ₹{calculateTotalDeliveryCharges(groupedOrders.previous)}
                </span>
              </span>
            </div>
          )}
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
