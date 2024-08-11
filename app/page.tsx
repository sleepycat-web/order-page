"use client";
import { menuItems } from "../scripts/items";
import { useState } from "react";
import LocationSelector from "@/components/location";
import { Menu, MenuItem } from "@/components/menu";
import Popup from "@/components/popup";
import Cart from "@/components/cart";

export interface CartItem {
  item: MenuItem;
  selectedOptions: Record<string, string[]>;
  quantity: number;
  specialRequests: string;
  totalPrice: number; // Add this line
}
export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCabin, setSelectedCabin] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleLocationSelect = (location: string, cabin: string) => {
    setSelectedLocation(location);
    setSelectedCabin(cabin);
  };

  const handleSubmit = async () => {
    if (!selectedLocation || !selectedCabin) return;

    const currentDate = new Date();
    const istTimeZoneOffset = 5.5;
    const istDate = new Date(
      currentDate.getTime() + istTimeZoneOffset * 60 * 60 * 1000
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
        items: cartItems,
      }),
    });

    if (response.ok) {
      setOrderStatus("Order placed successfully!");
      setSelectedLocation("");
      setSelectedCabin("");
      setCartItems([]);
    } else {
      setOrderStatus("Failed to submit order.");
    }
  };
const handleUpdateQuantity = (index: number, newQuantity: number) => {
  setCartItems((prevItems) =>
    prevItems.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity } : item
    )
  );
};
 const handleAddToCart = (
   item: MenuItem,
   selectedOptions: Record<string, string[]>,
   quantity: number,
   specialRequests: string,
   totalPrice: number // Add this parameter
 ) => {
   setCartItems((prevItems) => [
     ...prevItems,
     { item, selectedOptions, quantity, specialRequests, totalPrice }, // Include totalPrice
   ]);
   setSelectedItem(null);
 };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <div className="relative ">
      {/* Overlay div for background opacity */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black opacity-50 z-40 "></div>
      )}

      <main className="p-4 relative z-30 ">
        <LocationSelector
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          selectedCabin={selectedCabin}
        />

        <div className="fixed top-4 right-4 z-50 w-1/2">
          <Cart
            items={cartItems}
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onToggle={toggleCart}
            isOpen={isCartOpen}
          />
        </div>

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

        <Menu items={menuItems} onSelectItem={setSelectedItem} />

        <button
          className="btn my-8 disabled:text-neutral-200/40"
          onClick={handleSubmit}
          disabled={
            !selectedLocation || !selectedCabin || cartItems.length === 0
          }
        >
          Submit Order
        </button>
      </main>

      {/* Popup component with higher z-index */}
      {selectedItem && (
        <div className="relative z-50">
          <Popup
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAddToOrder={handleAddToCart}
          />
        </div>
      )}
    </div>
  );
}
