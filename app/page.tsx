"use client";
import { menuItems } from "../scripts/items";
import { useState, useEffect } from "react";
import LocationSelector from "@/components/location";
import { Menu, MenuItem } from "@/components/menu";
import Popup from "@/components/popup";
import Cart from "@/components/cart";
import { Promo, validatePromo } from "../scripts/promo"; // Make sure to create this file
import Checkout from "@/components/checkout";
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleLocationSelect = (location: string, cabin: string) => {
    setSelectedLocation(location);
    setSelectedCabin(cabin);
  };

    const handleOpenCheckout = () => {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    };

    const handleCloseCheckout = () => {
      setIsCheckoutOpen(false);
      setIsCartOpen(true);

    };
  
  

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

const areItemsIdentical = (item1: CartItem, item2: CartItem) => {
  return (
    item1.item.name === item2.item.name &&
    JSON.stringify(item1.selectedOptions) ===
      JSON.stringify(item2.selectedOptions) &&
    item1.specialRequests === item2.specialRequests
  );
};

const handleAddToCart = (
  item: MenuItem,
  selectedOptions: Record<string, string[]>,
  quantity: number,
  specialRequests: string,
  totalPrice: number
) => {
  const newItem: CartItem = {
    item,
    selectedOptions,
    quantity,
    specialRequests,
    totalPrice,
  };

  setCartItems((prevItems) => {
    const existingItemIndex = prevItems.findIndex((cartItem) =>
      areItemsIdentical(cartItem, newItem)
    );

    if (existingItemIndex !== -1) {
      // If an identical item exists, update its quantity by adding only the new quantity
      return prevItems.map((cartItem, index) =>
        index === existingItemIndex
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      );
    } else {
      // If no identical item exists, add the new item with its quantity
      return [...prevItems, newItem];
    }
  });

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
  const handleOrderSuccess = () => {
    setCartItems([]); // Reset cart items
    setAppliedPromo(null); // Reset applied promo
    setTotal(0); // Reset total
    setIsCheckoutOpen(false); // Close checkout
    setIsCartOpen(false); // Close cart
    // You might also want to show a success message here
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
            onCheckout={handleOpenCheckout}
            selectedLocation={selectedLocation}
            selectedCabin={selectedCabin}
            onApplyPromo={handleApplyPromo}
            appliedPromo={appliedPromo}
            total={calculateTotal()}
            setTotal={setTotal} // Add this line
            onOrderSuccess={handleOrderSuccess}
            onResetCart={handleOrderSuccess}
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
              className="btn btn-primary w-full max-w-lg"
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
      {isCheckoutOpen && (
        <Checkout
          items={cartItems}
          selectedLocation={selectedLocation}
          selectedCabin={selectedCabin}
          onClose={handleCloseCheckout}
          total={total} // Pass the total amount
          appliedPromo={appliedPromo} // Pass the applied promo code
          onOrderSuccess={handleOrderSuccess}
          onResetCart={handleOrderSuccess}
        />
      )}
    </div>
  );
}
