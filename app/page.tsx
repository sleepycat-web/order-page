"use client";
import { menuItems } from "../scripts/items";
import { useState, useEffect } from "react";
import LocationSelector from "@/components/location";
import { Menu, MenuItem } from "@/components/menu";
import Popup from "@/components/popup";
import Cart from "@/components/cart";
import { Promo, validatePromo } from "../scripts/promo"; // Make sure to create this file

export interface CartItem {
  item: MenuItem;
  selectedOptions: Record<string, string[]>;
  quantity: number;
  specialRequests: string;
  totalPrice: number;
}

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCabin, setSelectedCabin] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [total, setTotal] = useState(0);
  
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
        appliedPromo: appliedPromo,
      }),
    });

    if (response.ok) {
      setOrderStatus("Order placed successfully!");
      setSelectedLocation("");
      setSelectedCabin("");
      setCartItems([]);
      setAppliedPromo(null);
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
    totalPrice: number
  ) => {
    setCartItems((prevItems) => [
      ...prevItems,
      { item, selectedOptions, quantity, specialRequests, totalPrice },
    ]);
    setSelectedItem(null);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    handleSubmit();
  };

  const handleApplyPromo = (promo: Promo | null) => {
    setAppliedPromo(promo);
  };

  const calculateTotal = () => {
    let total = cartItems.reduce(
      (sum, item) => sum + item.totalPrice * item.quantity,
      0
    );
    if (appliedPromo) {
      total = total * (1 - appliedPromo.percentage / 100);
    }
    return total;
  };

  return (
    <div className="relative">
      {selectedItem && (
        <div className="fixed inset-0 bg-black opacity-50 z-40"></div>
      )}

      <main className="p-4 relative z-30">
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
            onCheckout={handleCheckout}
            selectedLocation={selectedLocation}
            selectedCabin={selectedCabin}
            onApplyPromo={handleApplyPromo}
            appliedPromo={appliedPromo}
            total={calculateTotal()}
            setTotal={setTotal} // Add this line
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

        {cartItems.length > 0 && (
          <div className="fixed bottom-8 md:bottom-4 left-4 right-4 flex justify-center">
            <button
              className="btn btn-primary w-full max-w-md"
              onClick={handleProceedToCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </main>

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
