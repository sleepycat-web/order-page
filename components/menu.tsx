import React, { useState } from "react";
import Popup from "@/components/popup";

export interface MenuItem {
  name: string;
  price: string;
  description?: string;
  soldOut?: boolean;
  outOfStock?: boolean;
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
  onSelectItem: (item: MenuItem) => void;
  selectedLocation: string;
  selectedCabin: string;
  setShowWarning: () => void; // Changed to a function with no parameters
  getWarning: () => string;
}

export const MenuItemComponent: React.FC<MenuItem> = ({
  name,
  price,
  description,
  soldOut,
}) => (
  <div className="p-4 bg-neutral-950 rounded-lg hover:cursor-pointer">
    <h3 className="text-base font-semibold">{name}</h3>
    <p className={`text-base ${soldOut ? "text-red-500" : "text-green-600"}`}>
      ₹{price} {soldOut && "Unavailable"}
    </p>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

export const Menu: React.FC<MenuProps> = ({
  items,
  onSelectItem,
  selectedLocation,
  selectedCabin,
  setShowWarning,
  getWarning,
}) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    if (!selectedLocation || !selectedCabin) {
      setShowWarning(); // Call the function to show the warning
    } else if (!item.soldOut) {
      setSelectedItem(item);
      onSelectItem(item);
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
    totalPrice: number
  ) => {
    console.log("Added to order", {
    });
    // You might want to do something with this data, like adding it to a cart state
  };

  return (
    <div className="grid bg-red-500y grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
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
