import React, { useState, useEffect } from "react";
import { CartItem } from "../app/page"; // Adjust the import path as needed
import { Promo } from "../scripts/promo"; // Adjust the import path as needed

interface BillSectionProps {
  items: CartItem[];
  total: number;
  appliedPromo: Promo | null;
  onClose: () => void;
}

const BillSection: React.FC<BillSectionProps> = ({ onClose }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showNoOrderModal, setShowNoOrderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
    setError("");
  };

  const handleCheck = async () => {
    if (isLoading) return; // Prevent multiple requests while loading

    if (phoneNumber.length === 10) {
      if (/^[6-9]\d{9}$/.test(phoneNumber)) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/checkBill", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber }),
          });

          if (response.ok) {
            const result = await response.json();
            setOrderDetails(result);
            setIsVerified(true);
          } else if (response.status === 404) {
            setShowNoOrderModal(true);
          } else {
            throw new Error("Failed to fetch order details");
          }
        } catch (error) {
          setError(
            "An error occurred while checking the bill. Please try again."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Please enter a valid phone number");
      }
    } else {
      setError("Please enter a valid phone number");
    }
  };

  const closeNoOrderModal = () => {
    setShowNoOrderModal(false);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-y-auto">
      <div className="container bg-neutral-900 rounded-lg px-4 py-8 pb-16 md:pb-12 w-full h-full relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Check Bill</h2>
          <div className="flex-grow" />
          <button onClick={onClose} className="text-3xl">
            &times;
          </button>
        </div>
        {isVerified ? (
          <div>
            {orderDetails ? (
              <div>
                <h3>Order Details:</h3>
                <p>Customer Name: {orderDetails.customerName}</p>
                <p>Total: ₹{orderDetails.total}</p>
                <p>Location: {orderDetails.selectedLocation}</p>
                <p>Cabin: {orderDetails.selectedCabin}</p>
                <h4>Items:</h4>
                <ul>
                  {orderDetails.items.map((item: any, index: number) => (
                    <li key={index}>
                      {item.item.name} - Quantity: {item.quantity} - Price: ₹
                      {item.totalPrice}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>No order details available.</div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:w-1/3 w-auto">
            <div className="flex">
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="input w-full bg-neutral-800 rounded-r-none"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                pattern="[0-9]*"
                inputMode="numeric"
                required
              />
              <button
                className="btn btn-primary rounded-l-none w-32 flex justify-center items-center"
                onClick={handleCheck}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span className="text-sm whitespace-nowrap">Check</span>
                )}
              </button>
            </div>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>
        )}
      </div>

      {/* No Order Found Modal */}
      <dialog
        id="no_order_modal"
        className={`modal ${showNoOrderModal ? "modal-open" : ""}`}
      >
        <div className="modal-box bg-neutral-900">
          <h3 className="font-bold text-lg">No Orders Found</h3>
          <p className="py-4">
            No orders were found for this phone number today.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={closeNoOrderModal}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default BillSection;
