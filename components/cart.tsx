import React, { useState, useEffect } from "react";
import { CartItem } from "../app/page"; // Adjust the import path as needed
import { validatePromo, Promo } from "../scripts/promo"; // Adjust the import path as needed
import Checkout from "./checkout";
import BillSection from "./bill"; // Make sure to import BillSection

interface CartProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onToggle: () => void;
  isOpen: boolean;
  onCheckout: () => void;
  selectedLocation: string;
  selectedCabin: string;
  onApplyPromo: (promo: Promo | null) => void;
  appliedPromo: Promo | null;
  total: number;
  setTotal: (total: number) => void;
  onOrderSuccess: () => void;
  onResetCart: () => void;
  tableDelivery: boolean; // Add this line
  onTableDeliveryChange: (isChecked: boolean) => void;
  
}

const Cart: React.FC<CartProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onToggle,
  isOpen,
  onCheckout,
  onOrderSuccess,
  selectedLocation,
  selectedCabin,
  onApplyPromo,
  appliedPromo,
  total,
  setTotal,
  onResetCart,
  onTableDeliveryChange,
 }) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [tableDelivery, setTableDelivery] = useState(false);
  const [ultraGrandTotal, setUltraGrandTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
const [isBillSectionOpen, setIsBillSectionOpen] = useState(false);
 const [tableDeliveryCharge, setTableDeliveryCharge] = useState(0);

 const handleOpenBillSection = () => {
   setIsBillSectionOpen(true);
 };

 const handleCloseBillSection = () => {
   setIsBillSectionOpen(false);
 };
const handleApplyPromo = () => {
  const validPromo = validatePromo(promoCode);
  if (validPromo) {
    onApplyPromo(validPromo);
    setPromoError("");
  } else {
    setPromoError("Invalid promo code");
    onApplyPromo(null);
  }
};

const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newPromoCode = e.target.value;
  setPromoCode(newPromoCode);

  // If there's an applied promo and the input changes, remove the promo
  if (appliedPromo) {
    onApplyPromo(null);
  }

  // Clear error when input changes
  if (promoError) {
    setPromoError("");
  }
};

 const handleUpdateQuantity = (index: number, newQuantity: number) => {
   onUpdateQuantity(index, newQuantity);
 };
const handleCheckout = () => {
  // Calculate the items with calculated price
  const itemsWithCalculatedPrice = items.map((item) => ({
    ...item,
    calculatedPrice: item.totalPrice * item.quantity,
  }));

  setIsCheckoutOpen(true);
  onToggle(); // This will close the cart
};

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false);
    if (items.length > 0) {
      onToggle(); // This will open the cart if it's closed
    }
  };

   const calculateTotal = () => {
     const newSubtotal = items.reduce(
       (total, item) => total + item.totalPrice,
       0
     );
     setSubtotal(newSubtotal);

     const newTableDeliveryCharge = tableDelivery ? newSubtotal * 0.05 : 0;
     setTableDeliveryCharge(newTableDeliveryCharge);

     const discountableTotal = newSubtotal;
     const discount = appliedPromo
       ? discountableTotal * (appliedPromo.percentage / 100)
       : 0;

     return discountableTotal - discount + newTableDeliveryCharge;
   };

  useEffect(() => {
    const newTotal = calculateTotal();
    setUltraGrandTotal(newTotal);
    setTotal(newTotal);
  }, [items, appliedPromo, tableDelivery, setTotal, selectedLocation]);

  const deliveryCharge = subtotal * 0.05;
  return (
    <>
      {!isOpen && (
        <div
          className="fixed top-4 right-4 z-50 cursor-pointer"
          onClick={onToggle}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            className="w-6 h-6 fill-current"
          >
            <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
          </svg>
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {items.length}
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-neutral-900 z-40 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 pb-24 md:pb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Cart</h2>{" "}
              <button onClick={onToggle} className="text-3xl">
                &times;
              </button>
            </div>
            {selectedLocation && (
              <div className="mb-4 p-4 bg-neutral-800 rounded-lg ">
                <p className="text-md ">{selectedLocation}</p>
                {selectedCabin && <p className="text-md"> {selectedCabin}</p>}
              </div>
            )}{" "}
            <button
              onClick={handleOpenBillSection}
              className=" btn btn-primary btn-sm  text-black mb-4   font-bold rounded-lg  "
            >
              Check Your Bill
            </button>
            {items.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                <ul className="space-y-6">
                  {items.map((item, index) => (
                    <li key={index} className="border-b border-gray-700 pb-4">
                      <div className="flex justify-between items-start space-x-1">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg">
                            {item.item.name}
                          </h3>
                          <div className="flex items-center mt-2">
                            <button
                              onClick={() =>
                                onUpdateQuantity(index, item.quantity - 1)
                              }
                              className="btn btn-sm mr-2"
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="mx-2">
                              Quantity: {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateQuantity(index, item.quantity + 1)
                              }
                              className="btn btn-sm ml-2"
                            >
                              +
                            </button>
                          </div>
                          <div className="mt-2 flex items-center">
                            <span className="mr-2">Price:</span>
                            <div className="px-2 mb-0.5 bg-blue-600 rounded text-white font-semibold">
                              ₹{item.totalPrice.toFixed(2)}
                            </div>
                          </div>
                          {Object.entries(item.selectedOptions).map(
                            ([optionName, values]) => (
                              <div
                                key={optionName}
                                className="flex flex-wrap items-center gap-1 "
                              >
                                <span className="text-sm py-1 text-gray-400">
                                  {optionName}:{" "}
                                </span>
                                {values.map((value) => (
                                  <span
                                    key={value}
                                    className="text-sm px-2 py-0.5  rounded bg-blue-600 text-white"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            )
                          )}
                          {item.specialRequests && (
                            <p className="text-sm text-gray-400 mt-1 ">
                              Special:
                              <span
                                key={item.specialRequests}
                                className=" ml-1  text-sm px-2 py-1  rounded bg-blue-600 text-white"
                              >
                                {item.specialRequests}
                              </span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveItem(index)}
                          className="text-red-500 hover:text-red-700 pr-16 md:pr-0"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-4">
                  <div className="sticky bottom-0 bg-neutral-900  mt-auto">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        className="input bg-neutral-800  max-w-xs"
                        value={promoCode}
                        onChange={handlePromoCodeChange}
                      />
                      {!appliedPromo && (
                        <button
                          className="btn btn-primary"
                          onClick={handleApplyPromo}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {promoError && <p className="text-red-500">{promoError}</p>}
                    <div className="mt-6 space-y-4  mb-4">
                      {appliedPromo && (
                        <div className="text-green-500 text-left">
                          Applied Promo: {appliedPromo.code} (
                          {appliedPromo.percentage}% off)
                        </div>
                      )}
                      {selectedLocation === "Sevoke Road" && (
                        <label className="flex items-center justify-between w-full max-w-xs">
                          <span className="label-text">
                            Select Table Delivery (5% charge) - ₹
                            {deliveryCharge.toFixed(2)}
                          </span>
                          <input
                            type="checkbox"
                            checked={tableDelivery}
                            onChange={(e) => setTableDelivery(e.target.checked)}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                        </label>
                      )}
                      <div className="text-xl font-bold text-left">
                        Total: ₹{ultraGrandTotal.toFixed(2)}
                      </div>
                    </div>

                    <div className="fixed bottom-8 md:bottom-4 left-4 right-4 flex justify-center">
                      <div className="container mx-auto max-w-lg">
                        <button
                          className="btn btn-primary w-full"
                          onClick={handleCheckout}
                          disabled={!selectedLocation || !selectedCabin}
                        >
                          Checkout
                        </button>
                        <p className="text-red-500 text-center mt-2 w-full max-w-lg">
                          {!selectedLocation && !selectedCabin
                            ? "Please select location and cabin before checkout"
                            : !selectedLocation
                            ? "Please select location before checkout"
                            : !selectedCabin
                            ? "Please select cabin before checkout"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isCheckoutOpen && (
        <Checkout
          items={items}
          selectedLocation={selectedLocation}
          selectedCabin={selectedCabin}
          onClose={handleCloseCheckout}
          total={ultraGrandTotal}
          appliedPromo={appliedPromo}
          onOrderSuccess={onOrderSuccess}
          onResetCart={onResetCart} // Pass this prop to Checkout
          tableDeliveryCharge={tableDeliveryCharge}
        />
      )}
      {isBillSectionOpen && <BillSection onClose={handleCloseBillSection} />}
    </>
  );
};

export default Cart;
