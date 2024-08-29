import React from "react";

interface ItemOption {
  [key: string]: string[];
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
const OrderItem: React.FC<OrderItemProps> = ({ item }) => (
  <div className="bg-neutral-700 p-4 rounded-lg flex flex-col h-full">
    <div className="flex justify-between items-center mb-2">
      <span className="bg-purple-700 p-1 rounded font-bold">{item.name}</span>
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
      <p className="mt-auto">
        Special Requests:{" "}
        <span className="bg-blue-500 p-1 rounded">{item.specialRequests}</span>
      </p>
    )}
  </div>
);

export default OrderItem;
