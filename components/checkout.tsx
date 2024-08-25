import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { CartItem } from "../app/page";
import dotenv from "dotenv";
import axios from "axios";
import { Promo } from "../scripts/promo";

dotenv.config({ path: "local.env" });

interface CheckoutProps {
  items: CartItem[];
  selectedLocation: string;
  selectedCabin: string;
  onClose: () => void;
  total: number;
  appliedPromo: Promo | null;
}

interface UserData {
  name: string;
  email?: string;
}

const Checkout: React.FC<CheckoutProps> = ({
  items,
  selectedLocation,
  selectedCabin,
  onClose,
  total,
  appliedPromo,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", ""]);
  const [otpMessage, setOtpMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: "", email: "" });
  const [customerName, setCustomerName] = useState("");
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
    const response = await axios.post("/api/userData", {
      action: "checkUserExists",
      phoneNumber,
    });
    return response.data.exists;
  };

  const addNewUser = async (
    phoneNumber: string,
    name: string,
    email?: string
  ): Promise<void> => {
    await axios.post("/api/userData", {
      action: "addNewUser",
      phoneNumber,
      name,
      email,
    });
  };

  const getUserData = async (
    phoneNumber: string
  ): Promise<{ name: string; email?: string }> => {
    const response = await axios.post("/api/userData", {
      action: "getUserData",
      phoneNumber,
    });
    return response.data;
  };

  const shouldSkipOtp = () => {
    const allowedItems = items.every(
      (item) =>
        (item.item.name === "Beverages" &&
          item.selectedOptions["Select Beverage"]?.includes("Water")) ||
        (item.item.name === "Others" &&
          item.selectedOptions["Cigarette"]?.length > 0)
    );
    return allowedItems;
  };

  useEffect(() => {
    if (shouldSkipOtp()) {
      setOtpVerified(true);
    } else {
      const cachedVerification = localStorage.getItem("otpVerified");
      if (cachedVerification) {
        const { verified, expiry } = JSON.parse(cachedVerification);
        if (verified && new Date().getTime() < expiry) {
          setOtpVerified(true);
          setIsOtpSent(true);
        } else {
          localStorage.removeItem("otpVerified");
        }
      }
    }
  }, [items]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };
const closeUserModal = () => {
  setShowUserModal(false);
};
  const handleGetOtp = async () => {
    try {
      const userExists = await checkUserExists(phoneNumber);
      if (userExists) {
        const fetchedUserData = await getUserData(phoneNumber);
        setCustomerName(fetchedUserData.name.split(" ")[0]);
      } else {
        setShowUserModal(true);
        return;
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      setIsOtpSent(true);
      setTimer(30);
      setOtpMessage(`Your OTP is: ${otp}`);
    } catch (error) {
      console.error("Error checking user or generating OTP:", error);
      setOtpMessage("An error occurred. Please try again.");
    }
  };

  const handleUserDataSubmit = async () => {
    if (userData.name) {
      try {
        await addNewUser(phoneNumber, userData.name, userData.email);
        setCustomerName(userData.name.split(" ")[0]);
        setShowUserModal(false);

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedOtp(otp);
        setIsOtpSent(true);
        setTimer(30);
        setOtpMessage(`Your OTP is: ${otp}`);
      } catch (error) {
        console.error("Error adding new user:", error);
        setOtpMessage("An error occurred. Please try again.");
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtpInputs = [...otpInputs];
      newOtpInputs[index] = value;
      setOtpInputs(newOtpInputs);

      if (value !== "" && index < 3) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && otpInputs[index] === "") {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otpInputs.join("");
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      localStorage.setItem(
        "otpVerified",
        JSON.stringify({
          verified: true,
          expiry: midnight.getTime(),
        })
      );
    } else {
      console.log("Incorrect OTP");
      setOtpMessage("Incorrect OTP. Please try again.");
    }
  };

  const isGetOtpDisabled = phoneNumber.length !== 10 || timer > 0;

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-y-auto">
      <div className="container bg-neutral-900 rounded-lg px-4 py-8 pb-16 md:pb-12  w-full h-full relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button onClick={onClose} className="text-3xl">
            &times;
          </button>
        </div>
        {!otpVerified ? (
          <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)]">
            <div className="flex items-center mb-4 w-full max-w-md">
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="input w-full bg-neutral-800 rounded-r-none"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                pattern="[0-9]{10}"
                required
              />
              <button
                className={`btn btn-primary rounded-l-none ${
                  isGetOtpDisabled ? " cursor-not-allowed" : ""
                }`}
                onClick={handleGetOtp}
                disabled={isGetOtpDisabled}
              >
                Get OTP
              </button>
            </div>
            {timer > 0 && (
              <p className="text-sm mt-2">Resend OTP in {timer}s</p>
            )}

            {isOtpSent && (
              <div className="flex flex-col items-center mt-4">
                <p className="text-sm mb-2">{otpMessage}</p>
                <div className="flex space-x-2">
                  {otpInputs.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      className="w-12 h-12 text-center bg-neutral-800 text-lg rounded"
                      value={digit}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        handleOtpChange(index, value);
                      }}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      ref={otpRefs[index]}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  ))}
                </div>
                <button
                  className="btn btn-primary w-full mt-4 max-w-xs"
                  onClick={handleVerifyOtp}
                >
                  Verify
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="orderitems pb-16">
            <p className="text-lg font-semibold mb-4">
              Dear {customerName}, Kindly Confirm your order
            </p>
            <div className="mb-4 bg-neutral-800 rounded-lg p-4">
              <p className="text-md">{selectedLocation}</p>
              <p className="text-md">{selectedCabin}</p>
            </div>
            <ul className="space-y-4">
              {items.map((item, index) => (
                <li key={index} className="border-b border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {item.item.name}
                  </h3>
                  <p>Quantity: {item.quantity}</p>
                  <div className="mt-2 flex items-center">
                    <span className="mr-2">Price:</span>
                    <div className="px-2 py- bg-blue-600 rounded text-white font-semibold">
                      ₹{(item.totalPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  {Object.entries(item.selectedOptions).map(
                    ([optionName, values]) => (
                      <div
                        key={optionName}
                        className="flex flex-wrap items-center gap-1"
                      >
                        <span className="text-sm py-2 text-gray-400">
                          {optionName}:{" "}
                        </span>
                        {values.map((value) => (
                          <span
                            key={value}
                            className="text-sm px-2 py-0.5 rounded bg-blue-600 text-white"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    )
                  )}
                  {item.specialRequests && (
                    <p className="text-sm text-gray-400 ">
                      Special: {item.specialRequests}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-2  mb-2">
              {appliedPromo && (
                <div className="text-green-500">
                  Applied Promo: {appliedPromo.code} ({appliedPromo.percentage}%
                  off)
                </div>
              )}
              <div className="text-xl font-bold">
                Total: ₹{total.toFixed(2)}
              </div>
            </div>
            <div className="fixed bottom-8 md:bottom-4 left-4 right-4 flex justify-center">
              <div className="container mx-auto max-w-3xl">
                <button className="btn btn-primary w-full">Confirm</button>
              </div>
            </div>
          </div>
        )}
        {showUserModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            onClick={closeUserModal}
          >
            <div
              className="bg-neutral-900 p-6 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Enter Your Details</h3>
              <input
                type="text"
                placeholder="Name"
                className="input w-full mb-4 bg-neutral-800"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input w-full mb-4 bg-neutral-800"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
              />
              <button
                className="btn btn-primary w-full"
                onClick={handleUserDataSubmit}
                disabled={!userData.name}
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
