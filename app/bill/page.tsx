"use client"
import React, { useState } from "react";

interface CartItem {
  item: {
    name: string;
    price: string;
    customizationOptions?: Array<{
      name: string;
      type: string;
      options: Array<{ label: string; price?: string }>;
    }>;
  };
  quantity: number;
  totalPrice: number;
  selectedOptions?: { [key: string]: string[] };
  specialRequests?: string;
}

interface Order {
  _id: { $oid: string };
  items: CartItem[];
  selectedLocation: string;
  selectedCabin: string;
  total: number;
  status: string;
  order: string;
  createdAt: string;
  customerName: string;
  tableDeliveryCharge: number;
  appliedPromo: string | { code: string; percentage: number } | null;
}

interface BillSectionProps {
  onClose: () => void;
}

const BillSection: React.FC<BillSectionProps> = ({ onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "previous">("active");

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
    setError("");
  };

  const handleCheck = async () => {
    if (isLoading) return;

    if (phoneNumber.length === 10) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/checkBill", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber }),
          });

          if (response.ok) {
            const result = await response.json();
            setOrders(result);
          } else if (response.status === 404) {
            setError("No orders found for this phone number.");
          } else {
            throw new Error("Failed to fetch order details");
          }
        } catch (error) {
          setError(
            "An error occurred while checking the bill. Please try again."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Please enter a valid phone number");
      }
    } else {
      setError("Please enter a valid phone number");
    }
  };

  const groupOrdersByCustomer = (orders: Order[]) => {
    const groupedOrders: { [key: string]: Order[] } = {};
    orders.forEach((order) => {
      if (!groupedOrders[order.customerName]) {
        groupedOrders[order.customerName] = [];
      }
      groupedOrders[order.customerName].push(order);
    });
    return groupedOrders;
  };

  const groupedOrders = groupOrdersByCustomer(orders);

  const filteredOrders = Object.entries(groupedOrders).reduce(
    (acc, [customerName, customerOrders]) => {
      const filteredCustomerOrders = customerOrders.filter((order) =>
        activeTab === "active"
          ? order.status === "pending"
          : order.status !== "pending"
      );
      if (filteredCustomerOrders.length > 0) {
        acc[customerName] = filteredCustomerOrders;
      }
      return acc;
    },
    {} as { [key: string]: Order[] }
  );

  const hasOrders = Object.keys(filteredOrders).length > 0;

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-y-auto">
      <div className="container bg-neutral-900 rounded-lg px-4 py-8 pb-16 md:pb-12 w-full h-full relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Check Bills</h2>
        
        </div>
{/* bill */}
        <div className="flex flex-col lg:w-1/3 w-auto mb-4">
          <div className="flex">
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="input w-full bg-neutral-800 rounded-r-none"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              pattern="[0-9]*"
              inputMode="numeric"
              required
            />
            <button
              className="btn btn-primary rounded-l-none w-32 flex justify-center items-center"
              onClick={handleCheck}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="text-sm whitespace-nowrap">Check</span>
              )}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>

        {orders.length > 0 && (
          <>
            <OrderTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)]">
              {hasOrders ? (
                <div className="flex flex-wrap -mx-2">
                  {Object.entries(filteredOrders).flatMap(
                    ([customerName, customerOrders]) =>
                      customerOrders.map((order) => (
                        <div
                          key={order._id.$oid}
                          className="w-full sm:w-1/2 px-2 mb-4"
                        >
                          <OrderCard
                            order={order}
                            customerName={customerName}
                          />
                        </div>
                      ))
                  )}
                </div>
              ) : (
                <div className="text-center text-neutral-300 mt-8">
                  {activeTab === "active"
                    ? "No active orders for today."
                    : "No previous orders found."}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface OrderTabsProps {
  activeTab: "active" | "previous";
  setActiveTab: (tab: "active" | "previous") => void;
}

const OrderTabs: React.FC<OrderTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { key: "active" as const, label: "Active" },
    { key: "previous" as const, label: "Previous" },
  ];

  return (
    <div className="flex mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`px-4 py-2 ${
            activeTab === tab.key
              ? "bg-primary text-white"
              : "bg-neutral-800 text-neutral-400"
          } rounded-t-lg mr-2`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  customerName: string;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

  return `${day} ${month} ${year} at ${formattedHours}:${formattedMinutes} ${ampm}`;
};
const OrderCard: React.FC<OrderCardProps> = ({ order, customerName }) => {
  return (
    <div className="bg-neutral-800 rounded-lg p-4 h-full shadow-md">
      <h3 className="text-xl font-semibold mb-2 text-white">{customerName}</h3>
      <div className="grid grid-cols-6 gap-2 mb-4">
        <p className="text-neutral-300 col-span-2">
          Status:{" "}
          <span className="text-white">
            {order.order === "pending" && "Pending"}
            {order.order === "dispatched" &&
              order.status !== "fulfilled" &&
              "Dispatched"}
            {order.status === "fulfilled" && "Fulfilled"}
            {order.status === "rejected" && "Rejected"}
          </span>
        </p>
        <p className="text-neutral-300 col-span-4">
          Location: <span className="text-white">{order.selectedLocation}</span>
        </p>
        <p className="text-neutral-300 col-span-2">
          Cabin: <span className="text-white">{order.selectedCabin}</span>
        </p>
        <p className="text-neutral-300 col-span-4">
          Date:{" "}
          <span className="text-white">{formatDate(order.createdAt)}</span>
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-lg mb-2 text-white">Items</h4>
        <div className="bg-neutral-700 p-2 rounded">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="mb-2 border-b border-neutral-600 pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-white font-medium mr-2">
                    {item.item.name}
                  </span>
                  <span className="bg-neutral-800 px-1  rounded text-sm text-neutral-400">
                    Qty: {item.quantity}
                  </span>
                </div>
                <span className="text-white">₹{item.totalPrice}</span>
              </div>
              {item.selectedOptions &&
                Object.entries(item.selectedOptions).map(
                  ([optionName, selectedValues]) => (
                    <p key={optionName} className="text-sm text-neutral-300">
                      {optionName}: {selectedValues.join(", ")}
                    </p>
                  )
                )}
              {item.specialRequests && (
                <p className="text-sm text-neutral-300">
                  Special Requests: {item.specialRequests}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
          {order.tableDeliveryCharge > 0 && (
            <p className="text-neutral-300">
              Table Delivery Charge:{" "}
              <span className="text-white">₹{order.tableDeliveryCharge}</span>
            </p>
          )}
          {order.appliedPromo && (
            <p className="text-neutral-300">
              Promo Applied{" "}
              <span className="text-white">
                {typeof order.appliedPromo === "string"
                  ? order.appliedPromo
                  : ` (${order.appliedPromo.percentage}% off)`}
              </span>
            </p>
          )}
        </div>
        <p className="font-semibold text-lg text-white">
          Total: ₹{order.total}
        </p>
      </div>
    </div>
  );
};

export default BillSection;
