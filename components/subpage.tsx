"use client";
import CallListDropdown from "@/components/listcall";
import { ChevronDown, ChevronUp } from "lucide-react";

import React, { useEffect, useState, useRef, useCallback } from "react";
import CompactOrderInfo from "@/components/compactinfo";
import { SingleItemOrder, MultiItemOrder } from "@/components/orderitem";
import OrderTabs from "@/components/tabview"; // Adjust the import path as needed
import OrderSearch from "@/components/searchbox"; // Adjust the import path as needed
import { Order } from "@/scripts/interface";
import Expense from "@/components/expense";
import ChangeHandler from "@/components/changehandler";
import CallStaff from "./callstaff";

export default function OrderPage() {
  const [slug, setSlug] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedOrderId, setLastUpdatedOrderId] = useState<string | null>(
    null
  );
  const orderRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>(
    {}
  );
  const [payLaterOrders, setPayLaterOrders] = useState<Order[]>([]);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"new" | "active" | "previous">(
    "new"
  );
  const [expandedOrders, setExpandedOrders] = useState<{
    [key: string]: boolean;
  }>({});
  const [tabInitialStates, setTabInitialStates] = useState({
    new: true,
    active: false,
    previous: false,
  });
  const [networkError, setNetworkError] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pathSegments = window.location.pathname.split("/");
      const urlSlug = pathSegments[pathSegments.length - 1];
      setSlug(urlSlug || "default"); // Use 'default' or any fallback value if the slug is empty
    }
  }, []);
  const [payLaterExpanded, setPayLaterExpanded] = useState(false);



  const handleTabChange = (tab: "new" | "active" | "previous") => {
    setActiveTab(tab);
  };
  const handleOrderToggle = (phoneNumber: string, isExpanded: boolean) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [phoneNumber]: isExpanded,
    }));
  };
  const handleRejectAll = async (orderIds: string[]) => {
    try {
      const response = await fetch("/api/updateOrderStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderIds,
          type: "/reject",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order reject status");
      }

      // Update local state after successful API call
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          orderIds.includes(order._id)
            ? { ...order, order: "rejected", status: "rejected" }
            : order
        )
      );
    } catch (error) {
      console.error("Error updating order reject status:", error);
      // Provide user feedback about the error
    }
  };
  useEffect(() => {
    orders.forEach((order) => {
      if (!orderRefs.current[order._id]) {
        orderRefs.current[order._id] = React.createRef();
      }
    });
  }, [orders]);

  const scrollToOrder = useCallback((orderId: string) => {
    const orderElement = orderRefs.current[orderId]?.current;
    if (orderElement) {
      orderElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);
  useEffect(() => {
    if (highlightedOrderId) {
      // Delay the scroll to ensure the component has re-rendered
      setTimeout(() => {
        scrollToOrder(highlightedOrderId);
      }, 100);

      // Remove the highlight after 5 seconds
      const timer = setTimeout(() => {
        setHighlightedOrderId(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [highlightedOrderId, scrollToOrder]);

  const getHighlightStyle = (orderId: string) => {
    if (orderId === highlightedOrderId) {
      return {
        animation: "highlightAnimation 5s ease-out ",
      };
    }
    return {};
  };

  useEffect(() => {
    if (!slug) return;
    const fetchOrders = async () => {
      try {
        const response = await fetch(`/api/getOrders?slug=${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await response.json();

        // Ensure data.currentOrders and data.payLaterOrders are arrays
        setOrders(Array.isArray(data.currentOrders) ? data.currentOrders : []);
        setPayLaterOrders(
          Array.isArray(data.payLaterOrders) ? data.payLaterOrders : []
        );

        setLoading(false);
        setNetworkError(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setNetworkError(true);
        setLoading(false);
      }
    };
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 3000);
    return () => clearInterval(intervalId);
  }, [slug]);
  useEffect(() => {
    if (lastUpdatedOrderId && orderRefs.current[lastUpdatedOrderId]) {
      const ref = orderRefs.current[lastUpdatedOrderId];
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [lastUpdatedOrderId]);

  const sendDispatchSms = async (
    phoneNumber: string,
    customerName: string,
    deliveryCharge: number
  ) => {
    try {
      const response = await fetch("/api/sendConfirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, customerName, deliveryCharge }),
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
      await handleDispatch(orderId);

      const updatedOrder = orders.find((o) => o._id === orderId);
      if (updatedOrder) {
        await sendDispatchSms(
          updatedOrder.phoneNumber,
          updatedOrder.customerName,
          updatedOrder.tableDeliveryCharge || 0
        );
      }
    } catch (error) {
      console.error("Error dispatching order and sending SMS:", error);
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
    try {
      for (const orderId of orderIds) {
        await handleDispatch(orderId);
      }

      const ordersToDispatch = orders.filter((o) => orderIds.includes(o._id));
      const totalDeliveryCharge = ordersToDispatch.reduce(
        (sum, order) => sum + (order.tableDeliveryCharge || 0),
        0
      );

      if (ordersToDispatch.length > 0) {
        const firstOrder = ordersToDispatch[0];
        await sendDispatchSms(
          firstOrder.phoneNumber,
          firstOrder.customerName,
          totalDeliveryCharge
        );
      }
    } catch (error) {
      console.error("Error dispatching all orders:", error);
    }
  };
  const handleFulfillAll = async (orderIds: string[]) => {
    for (const orderId of orderIds) {
      await handlePayment(orderId);
    }
  };
  const calculateTotalSales = (orders: Order[]) => {
    return orders
      .filter(
        (order) =>
          order.order !== "rejected" &&
          order.status !== "rejected" &&
          new Date(order.createdAt).setHours(0, 0, 0, 0) >=
            new Date().setHours(0, 0, 0, 0) // Only include orders from today
      )
      .reduce((total, order) => total + order.total, 0);
  };

  const calculateTotalDeliveryCharges = (orders: Order[]) => {
    return orders.reduce((total, order) => {
      return total + (order.tableDeliveryCharge || 0);
    }, 0);
  };
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error) return <div>{error}</div>;

  const groupedOrders = orders.reduce(
    (acc, order) => {
      let key: "new" | "active" | "previous";
      if (
        order.status === "fulfilled" ||
        order.status === "rejected" ||
        order.order === "rejected"
      ) {
        key = "previous";
      } else if (order.order === "dispatched" && order.status !== "fulfilled") {
        key = "active";
      } else {
        key = "new";
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    },
    { new: [], active: [], previous: [] } as {
      [key in "new" | "active" | "previous"]: Order[];
    }
  );

  const counts = {
    new: groupedOrders.new.length,
    active: groupedOrders.active.length,
    previous: groupedOrders.previous.length + payLaterOrders.length,
  };

  const renderOrders = (orders: Order[], isPayLater: boolean = false) => {
    const groupedByPhone = orders.reduce((acc, order) => {
      if (!acc[order.phoneNumber]) {
        acc[order.phoneNumber] = [];
      }
      acc[order.phoneNumber].push(order);
      return acc;
    }, {} as { [key: string]: Order[] });

    const sortedOrderEntries = Object.entries(groupedByPhone).sort((a, b) => {
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
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          const initialExpanded = tabInitialStates[activeTab];
          const sortedCustomerOrders = sortOrders(customerOrders);
          const newestOrder = sortedCustomerOrders[0];

          // Calculate the oldest order time
          const oldestOrderTime = customerOrders.reduce((oldest, current) =>
            new Date(current.createdAt) < new Date(oldest.createdAt)
              ? current
              : oldest
          ).createdAt;

          return (
            <div
              key={phoneNumber}
              className="bg-neutral-900 rounded-lg p-4"
              style={getHighlightStyle(newestOrder._id)}
              ref={(el) => {
                if (el) {
                  orderRefs.current[newestOrder._id] = { current: el };
                }
              }}
            >
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
                  price: order.total,
                }))}
                onDispatchAll={handleDispatchAll}
                onFulfillAll={handleFulfillAll}
                onRejectAll={handleRejectAll}
                activeTab={activeTab}
                onToggle={(isExpanded) =>
                  handleOrderToggle(phoneNumber, isExpanded)
                }
                initialExpanded={initialExpanded}
                oldestOrderTime={oldestOrderTime} // Pass the oldest order time
              />
              {expandedOrders[phoneNumber] && (
                <>
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
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const combinedOrders = (orders: Order[]) => {
    return orders.reduce((acc, order) => {
      const phoneNumber = order.phoneNumber; // Use phone number as the key
      if (!acc[phoneNumber]) {
        acc[phoneNumber] = [];
      }
      acc[phoneNumber].push({
        ...order,
        status: capitalizeFirstLetter(order.order), // Capitalize the status
      });
      return acc;
    }, {} as { [key: string]: Order[] });
  };

  return (
    <>
      <style jsx global>{`
        @keyframes highlightAnimation {
          0% {
            background-color: #ffd700;
          }
        }
      `}</style>
      <div className="container mx-auto  px-4 py-8 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-6">
          {slug.charAt(0).toUpperCase() + slug.slice(1)} Orders
        </h1>
        {networkError && null}
        <OrderSearch
          orders={orders}
          setActiveTab={setActiveTab}
          orderRefs={orderRefs}
          setHighlightedOrderId={setHighlightedOrderId}
        />
        {(activeTab === "new" || activeTab === "active") && (
          <div className="">
            <CallListDropdown
              orders={combinedOrders([
                ...Object.values(groupedOrders.new).flat(),
                ...Object.values(groupedOrders.active).flat(),
              ])} // Pass the grouped orders as an object
            />
          </div>
        )}
        <div className="mb-8">
          <OrderTabs
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            counts={counts}
          />
        </div>
        {activeTab === "new" && (
          <div className="mb-8">{renderOrders(groupedOrders.new)}</div>
        )}
        {activeTab === "active" && (
          <div className="mb-8">{renderOrders(groupedOrders.active)}</div>
        )}
        {activeTab === "previous" && (
          <div className="mb-8">
            <Expense
              slug={slug}
              totalSales={calculateTotalSales([
                ...groupedOrders.previous,
                ...payLaterOrders,
              ])}
              totalTips={calculateTotalDeliveryCharges([
                ...groupedOrders.previous,
                ...payLaterOrders,
              ])}
            />
            {renderOrders(groupedOrders.previous)}

            {/* Pay Later Orders Section */}
            {payLaterOrders.length > 0 && (
              <div className="mt-8">
                <div
                  className="flex items-center cursor-pointer mb-4"
                  onClick={() => setPayLaterExpanded(!payLaterExpanded)}
                >
                  <h2 className="text-2xl font-bold mr-2">Pay Later Orders</h2>
                  {payLaterExpanded ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
                {payLaterExpanded && renderOrders(payLaterOrders, true)}
              </div>
            )}
          </div>
        )}
        <ChangeHandler slug={slug} />
        {counts.new === 0 && counts.active === 0 && counts.previous === 0 && (
          <p className="text-center text-xl">No orders at the moment.</p>
        )}
        {activeTab === "previous" && <CallStaff slug={slug} />}
      </div>
    </>
  );
}