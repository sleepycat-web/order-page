"use client";
import { menuItems } from "../scripts/items";
import { useState, useEffect } from "react";
import LocationSelector from "@/components/location";
import { Menu, MenuItem } from "@/components/menu";
import Popup from "@/components/popup";
import Cart from "@/components/cart";
import { Promo, validatePromo } from "../scripts/promo"; // Make sure to create this file
import Checkout from "@/components/checkout";
import BillSection from "@/components/bill";
 
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
  const [tableDelivery, setTableDelivery] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isBillSectionOpen, setIsBillSectionOpen] = useState(false); // New state for BillSection visibility
  const [isHomepage, setIsHomepage] = useState(true);
  
const shouldHideFooter = () => {
  if (isHomepage) {
    return (
      isBillSectionOpen || isCheckoutOpen || isCartOpen || selectedItem !== null
    );
  } else {
    return (
      isBillSectionOpen ||
      isCheckoutOpen ||
      isCartOpen ||
      selectedItem !== null ||
      cartItems.length > 0
    );
  }
};useEffect(() => {
  setIsHomepage(true);
  return () => {
    setIsHomepage(false);
  };
}, []);
  const toggleBillSection = () => {
    setIsBillSectionOpen((prev) => {
      if (prev) {
        // If the bill section is being closed, scroll to the top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return !prev;
    });
  };

  useEffect(() => {
   let timer: NodeJS.Timeout;
   if (showError) {
     timer = setTimeout(() => {
       setShowError(false);
     }, 5000);
   }
   return () => {
     if (timer) clearTimeout(timer);
   };
 }, [showError]);

  const handleTableDeliveryChange = (isChecked: boolean) => {
    setTableDelivery(isChecked);
  };

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
     if (cartItems.length > 0) {
       setIsCartOpen(true);
     }
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
    if (!selectedLocation || !selectedCabin) {
      setShowError(true);
    } else {
      setIsCartOpen(true);
    }
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
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow relative">
        <LocationSelector
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          selectedCabin={selectedCabin}
        />
        <div className="fixed top-4 right-4 z-50 w-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto">
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
            setTotal={setTotal}
            onOrderSuccess={handleOrderSuccess}
            onResetCart={handleOrderSuccess}
            tableDelivery={tableDelivery}
            onTableDeliveryChange={handleTableDeliveryChange}
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
          <div className="fixed bottom-8 md:bottom-4 left-4 right-4 z-40">
            <div className="max-w-lg mx-auto">
              <button
                className="btn btn-primary w-full"
                onClick={handleProceedToCheckout}
              >
                Proceed to Checkout
              </button>
              {showError && (!selectedLocation || !selectedCabin) && (
                <p className="text-red-500 text-center mt-2">
                  Please select{" "}
                  {!selectedLocation && !selectedCabin
                    ? "location and cabin"
                    : !selectedLocation
                    ? "location"
                    : "cabin"}{" "}
                  before checkout
                </p>
              )}
            </div>
          </div>
        )}
      </main>
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <Popup
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToOrder={handleAddToCart}
            />
          </div>
        </div>
      )}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <Checkout
              items={cartItems}
              selectedLocation={selectedLocation}
              selectedCabin={selectedCabin}
              onClose={handleCloseCheckout}
              total={total}
              appliedPromo={appliedPromo}
              onOrderSuccess={handleOrderSuccess}
              onResetCart={handleOrderSuccess}
              tableDelivery={tableDelivery}
            />
          </div>
        </div>
      )}
      {!shouldHideFooter() && (
        <footer className="footer grid grid-flow-col bg-neutral-950 p-6 pt-10 pb-10 gap-4 text-neutral-content">
          <aside>
            <span className="cursor-pointer w-auto" onClick={toggleBillSection}>
              Check Bill
            </span>
          </aside>
        </footer>
      )}
      {isBillSectionOpen && <BillSection onClose={toggleBillSection} />}
    </div>
  );
}
