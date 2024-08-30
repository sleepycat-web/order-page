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

export default function OrderPage() {
  const slug = "sevoke";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreviousOrders, setShowPreviousOrders] = useState(false);
const sendConfirmation = async (order: Order) => {
  try {
    const response = await fetch("/api/sendConfirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: order.phoneNumber,
        customerName: order.customerName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send confirmation message");
    }

    console.log("Confirmation message sent successfully");
  } catch (error) {
    console.error("Error sending confirmation message:", error);
  }
};
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
  const sendDispatchSms = async (phoneNumber: string, customerName: string) => {
    try {
      const response = await fetch("/api/sendDispatchSms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, customerName }),
      });

      if (!response.ok) {
        throw new Error("Failed to send dispatch SMS");
      }

      console.log("Dispatch SMS sent successfully");
    } catch (error) {
      console.error("Error sending dispatch SMS:", error);
    }
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
  
  const handleDispatchSms = async (orderId: string) => {
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
        prevOrders.map((order) => {
          if (order._id === orderId) {
            sendDispatchSms(order.phoneNumber, order.customerName);
            return { ...order, order: "dispatched" };
          }
          return order;
        })
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
    let phoneNumber = "";
    let customerName = "";

    for (const orderId of orderIds) {
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        await handleDispatch(orderId);
        // Store the phone number and customer name from the first order
        if (!phoneNumber && !customerName) {
          phoneNumber = order.phoneNumber;
          customerName = order.customerName;
        }
      }
    }

    // Send dispatch SMS once after processing all orders
    if (phoneNumber && customerName) {
      await sendDispatchSms(phoneNumber, customerName);
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
  // Sort the order groups based on the most recent order in each group
  
  const sortedOrderEntries = Object.entries(orders).sort((a, b) => {
    const latestOrderA = a[1].reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest
    );
    const latestOrderB = b[1].reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest
    );
    return (
      new Date(latestOrderB.createdAt).getTime() -
      new Date(latestOrderA.createdAt).getTime()
    );
  });

  return (
    <div className="space-y-8">
      {sortedOrderEntries.map(([phoneNumber, customerOrders]) => {
        const singleItemOrders = customerOrders.filter(
          (order) => order.items.length === 1
        );
        const multiItemOrders = customerOrders.filter(
          (order) => order.items.length > 1
        );
        const sortOrders = (orders: Order[]) =>
          orders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        // Sort customerOrders to get the newest order first
        const sortedCustomerOrders = sortOrders(customerOrders);
        const newestOrder = sortedCustomerOrders[0];

        return (
          <div key={phoneNumber} className="bg-neutral-900 rounded-lg p-4">
            <CompactOrderInfo
              customerName={newestOrder.customerName}
              phoneNumber={phoneNumber}
              cabin={newestOrder.selectedCabin}
              total={customerOrders.reduce(
                (sum, order) => sum + order.total,
                0
              )}
              orders={sortedCustomerOrders.map((order) => ({
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
                  {sortOrders(singleItemOrders).map((order) => (
                    <SingleItemOrder
                      key={order._id}
                      order={order}
                      onDispatch={handleDispatchSms}
                      onPayment={handlePayment}
                    />
                  ))}
                </div>
              </div>
            )}

            {multiItemOrders.length > 0 && (
              <div className="mt-4">
                <div className="space-y-4">
                  {sortOrders(multiItemOrders).map((order) => (
                    <MultiItemOrder
                      key={order._id}
                      order={order}
                      onDispatch={handleDispatchSms}
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
      <h1 className="text-3xl font-bold mb-6">
        {" "}
        {slug.charAt(0).toUpperCase() + slug.slice(1)} Orders
      </h1>

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
