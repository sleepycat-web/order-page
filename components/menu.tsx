// @/components/menu.tsx
import React, { useState } from "react";
import Popup from "@/components/popup";

export interface MenuItem {
  name: string;
  price: string;
  description?: string;
  soldOut?: boolean;
  customizationOptions?: CustomizationOption[];
}

export interface CustomizationOption {
  name: string;
  type: "radio" | "checkbox";
  options: {
    label: string;
    price?: string;
  }[];
}

export const MenuItemComponent: React.FC<MenuItem> = ({
  name,
  price,
  description,
  soldOut,
}) => (
  <div className="p-4 bg-neutral-950 rounded-lg shadow-sm hover:cursor-pointer">
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className={`text-lg ${soldOut ? "text-red-500" : "text-green-600"}`}>
      ₹{price} {soldOut && "Sold Out"}
    </p>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

export const Menu: React.FC<{ items: MenuItem[] }> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
  };

  const handleAddToOrder = (
    item: MenuItem,
    selectedOptions: Record<string, string[]>,
    quantity: number
  ) => {
    // Implement your logic to add the item to the order
    console.log("Added to order:", item, selectedOptions, quantity);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
      {items.map((item, index) => (
        <div key={index} onClick={() => handleItemClick(item)}>
          <MenuItemComponent {...item} />
        </div>
      ))}
      {selectedItem && (
        <Popup
          item={selectedItem}
          onClose={handleClosePopup}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </div>
  );
};
