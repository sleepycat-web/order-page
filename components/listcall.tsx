import React, { useState } from "react";
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

interface CallListDropdownProps {
  orders: { [key: string]: Order[] };
}

const CallListDropdown: React.FC<CallListDropdownProps> = ({ orders }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

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
    <div className="relative mb-4">
      <button
        onClick={toggleDropdown}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
      >
        {isOpen ? "Hide Call List" : "Show Call List"}
      </button>
      {isOpen && (
        <div className="absolute z-10 bg-neutral-800 text-white rounded-lg p-4 shadow-lg  max-h-60 overflow-y-auto mt-2 gap-x-4">
          <ul>
            {sortedOrderEntries.map(([phoneNumber, customerOrders]) => {
                const { customerName, status } = customerOrders[0];
                  const bgColor =
                    status === "Pending"
                      ? "bg-yellow-500"
                      : status === "Dispatched"
                      ? "bg-green-500"
                      : "";

              return (
                <li
                  key={phoneNumber}
                  className=" py-2 flex justify-between items-center"
                >
                  <span className="font-semibold p-0.5 mx-1 rounded">
                    {customerName}
                  </span>
                  <span className={`mx-2 p-1 rounded text-sm ${bgColor}`}>
                    {status}
                  </span>
                  <a href={`tel:${phoneNumber}`} className="text-blue-300 ">
                    {phoneNumber}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CallListDropdown;
