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

interface MenuProps {
  items: MenuItem[];
  onSelectItem: (item: MenuItem) => void; // Add this line to define the onSelectItem prop
}

export const MenuItemComponent: React.FC<MenuItem> = ({
  name,
  price,
  description,
  soldOut,
}) => (
  <div className="p-4 bg-neutral-950 rounded-lg shadow-sm hover:cursor-pointer ">
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className={`text-lg ${soldOut ? "text-red-500" : "text-green-600"}`}>
      ₹{price} {soldOut && "Sold Out"}
    </p>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

export const Menu: React.FC<MenuProps> = ({ items, onSelectItem }) => {
  // Updated to use MenuProps
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    if (!item.soldOut) {
      setSelectedItem(item);
      onSelectItem(item); // Invoke onSelectItem when an item is clicked
    }
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
  };

const handleAddToOrder = (
  item: MenuItem,
  selectedOptions: Record<string, string[]>,
  quantity: number,
  specialRequests: string,
  totalPrice: number // Add this parameter
) => {
  console.log("Added to order:", item, selectedOptions, quantity, totalPrice);
  // You might want to do something with this data, like adding it to a cart state
};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
