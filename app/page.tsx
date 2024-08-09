"use client";
import { menuItems } from "../scripts/menu";
import { useState } from "react";
import Image from "next/image";
import Popup from "@/components/popup";
import LocationSelector from "@/components/location";

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

const MenuItem: React.FC<MenuItem> = ({
  name,
  price,
  description,
  soldOut,
}) => (
  <div className="p-4 bg-neutral-950 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className={`text-xl ${soldOut ? "text-red-500" : "text-green-600"}`}>
      ₹{price} {soldOut && "Sold Out"}
    </p>
    {description && <p className="text-sm text-gray-600">{description}</p>}
  </div>
);

const Menu: React.FC<{ items: MenuItem[] }> = ({ items }) => {
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
          <MenuItem {...item} />
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

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCabin, setSelectedCabin] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  const handleLocationSelect = (location: string, cabin: string) => {
    setSelectedLocation(location);
    setSelectedCabin(cabin);
  };

  const handleSubmit = async () => {
    if (!selectedLocation || !selectedCabin) return;

   const currentDate = new Date();

   // Convert the date to IST (Indian Standard Time)
   const istTimeZoneOffset = 5.5; // IST is 5.5 hours ahead of UTC
   const istDate = new Date(
     //  currentDate.getTime() + istTimeZoneOffset * 60 * 60 * 1000
     currentDate.getTime()
   );

   const formattedDate = istDate.toLocaleString("en-GB", {
     day: "numeric",
     month: "long",
     year: "numeric",
     hour: "numeric",
     minute: "numeric",
     hour12: true,
   });

    const response = await fetch("/api/submitOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: selectedLocation,
        cabin: selectedCabin,
        timestamp: formattedDate,
      }),
    });

    if (response.ok) {
      setOrderStatus("Order placed successfully!");
      setSelectedLocation("");
      setSelectedCabin("");
    } else {
      setOrderStatus("Failed to submit order.");
    }
  };

  return (
    <main className="p-4">
      <LocationSelector
        onLocationSelect={handleLocationSelect}
        selectedLocation={selectedLocation}
        selectedCabin={selectedCabin}
      />

      {orderStatus && (
        <p
          className={`mt-4 ${
            orderStatus.includes("successfully")
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {orderStatus}
        </p>
      )}

      <Menu items={menuItems} />
      <button
        className="btn my-8"
        onClick={handleSubmit}
        disabled={!selectedLocation || !selectedCabin}
      >
        Submit
      </button>
    </main>
  );
}
