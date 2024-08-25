import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { CartItem } from "./app/page"; // Adjust the import path as needed
import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: "local.env" });

interface CheckoutProps {
  items: CartItem[];
  selectedLocation: string;
  selectedCabin: string;
  onClose: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({
  items,
  selectedLocation,
  selectedCabin,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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

  const handleGetOtp = async () => {
    try {
      const response = await axios.post("/api/sendOtp", { phoneNumber });
      if (response.status === 200) {
        const { otp } = response.data;
        console.log("Generated OTP:", otp); // Log the OTP to the console
        setGeneratedOtp(otp); // Store OTP for later verification
        setIsOtpSent(true); // Update state to show OTP input fields
        setTimer(30); // Start the timer for OTP resend
        console.log("OTP sent successfully");
      } else {
        console.error("Failed to send OTP");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
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
    } else {
      // Handle incorrect OTP
      console.log("Incorrect OTP");
    }
  };

  const isGetOtpDisabled = phoneNumber.length !== 10 || timer > 0;

  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-y-auto">
      <div className="container bg-neutral-900 rounded-lg px-4 py-8 pb-16 md:pb-12 shadow-lg w-full h-full relative">
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
          <div>Hi, I'll edit this div later</div>
        )}
      </div>
    </div>
  );
};

export default Checkout;