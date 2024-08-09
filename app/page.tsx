"use client";
import { menuItems } from "../scripts/items";
import { useState } from "react";
import Image from "next/image";
import LocationSelector from "@/components/location";
import { Menu, MenuItem } from "@/components/menu";

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
    const istDate = new Date(currentDate.getTime());

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
        className="btn my-8  disabled:text-neutral-200/40 "
        onClick={handleSubmit}
        disabled={!selectedLocation || !selectedCabin}
      >
        Submit
      </button>
    </main>
  );
}
