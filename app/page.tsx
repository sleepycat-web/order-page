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
  basePrice: number; // Add this line
  totalPrice: number;
  calculatedPrice: number; // Add this line
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
  const [tableDeliveryCharge, setTableDeliveryCharge] = useState(0);
 const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  const getWarning = () => {
    if (!selectedLocation && !selectedCabin) {
      return "Please select both location and cabin. ";
    } else if (!selectedLocation) {
      return "Please select a location.";
    } else if (!selectedCabin) {
      return "Please select a cabin.";
    }
    return "";
  };
 const shouldHideFooter = () => {
   return (
     isBillSectionOpen ||
     isCheckoutOpen ||
     isCartOpen ||
     selectedItem !== null ||
     cartItems.length > 0 
   );
 };
  const toggleBillSection = () => {
    setIsBillSectionOpen((prev) => {
      if (prev) {
        // If the bill section is being closed, scroll to the top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return !prev;
    });
  };
 const showTemporaryWarning = () => {
   setWarningMessage(getWarning());
   setShowWarning(true);
   setTimeout(() => {
     setShowWarning(false);
   }, 5000); // Hide warning after 3 seconds
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
      i === index
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice: item.basePrice * newQuantity,
          }
        : item
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
    basePrice: totalPrice / quantity,
    calculatedPrice: totalPrice,
  };

  setCartItems((prevItems) => {
    const existingItemIndex = prevItems.findIndex((cartItem) =>
      areItemsIdentical(cartItem, newItem)
    );

    if (existingItemIndex !== -1) {
      // If an identical item exists, update its quantity and recalculate total price
      return prevItems.map((cartItem, index) =>
        index === existingItemIndex
          ? {
              ...cartItem,
              quantity: cartItem.quantity + quantity,
              totalPrice: (cartItem.quantity + quantity) * cartItem.basePrice,
            }
          : cartItem
      );
    } else {
      // If no identical item exists, add the new item
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
    <div>
      <div className="relative min-h-svh flex flex-col">
        {" "}
        {selectedItem && (
          <div className="fixed inset-0 bg-black opacity-50 z-40"></div>
        )}
        <main className="p-4 relative z-30 flex-grow pb-28">
          {showWarning && <p className="text-red-500 mb-4">{warningMessage}</p>}
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
          <Menu
            items={menuItems}
            onSelectItem={setSelectedItem}
            selectedLocation={selectedLocation}
            selectedCabin={selectedCabin}
            setShowWarning={showTemporaryWarning}
            getWarning={getWarning}
          />
          {cartItems.length > 0 && (
            <div className="absolute bottom-8 md:bottom-4 left-4 right-4">
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
            tableDelivery={tableDelivery}
            tableDeliveryCharge={tableDeliveryCharge}
           />
        )}
      </div>
      {!shouldHideFooter() && (
        <footer className="footer grid grid-flow-col bg-neutral-950 p-6 pt-10 pb-10 gap-4 text-neutral-content">
          <aside>
            <span className="cursor-pointer w-auto" onClick={toggleBillSection}>
              Check Your Bill
            </span>
          </aside>
        </footer>
      )}
      {/* BillSection component */}
      {isBillSectionOpen && <BillSection onClose={toggleBillSection} />}
    </div>
  );
}
