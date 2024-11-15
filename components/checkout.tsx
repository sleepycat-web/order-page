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
  onOrderSuccess: () => void;
  onResetCart: () => void;
  tableDeliveryCharge: number; // Add this line
  tableDelivery: boolean; // Add this line
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
  onOrderSuccess,
  total,
  appliedPromo,
  onResetCart,
  tableDeliveryCharge, // Add this line
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpInputs, setOtpInputs] = useState(["", "", "", ""]);
  const [otpMessage, setOtpMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: "", email: "" });
  const [customerName, setCustomerName] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
const [isAutoPlacingOrder, setIsAutoPlacingOrder] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<UserData | null>(null);

  const [otpState, setOtpState] = useState<"idle" | "loading" | "sent">("idle");
  const [isOtpRequested, setIsOtpRequested] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isOtpRequestInProgress, setIsOtpRequestInProgress] = useState(false);

  const resetCheckoutState = () => {
    setOtpVerified(false);
    setPhoneNumber("");
    setIsOtpSent(false);
    setCustomerName("");
    setOtpInputs(["", "", "", ""]);
    setOtpMessage("");
    setTimer(0);
    setShowUserModal(false);
    setOrderPlaced(false);
    setIsBanned(false);
    setPhoneError("");
  };
  const subtotal = items.reduce(
    (sum, item) => sum + item.totalPrice * item.quantity,
    0
  );

  const handleClick = () => {
    if (!isOtpRequested) {
      setIsCheckboxChecked(!isCheckboxChecked);
    } else if (!isCheckboxChecked) {
      setIsCheckboxChecked(true);
    }
  };

  // Calculate table delivery charge
  // const tableDeliveryCharge = tableDelivery ? subtotal * 0.05 : 0;

  useEffect(() => {
    const handleUserBanned = () => {
      resetCheckoutState();
      localStorage.removeItem("otpVerified");
      setIsLoading(false);
    };

    window.addEventListener("userBanned", handleUserBanned);

    return () => {
      window.removeEventListener("userBanned", handleUserBanned);
    };
  }, []);

  const handleClose = () => {
    if (orderPlaced) {
      // If order is placed, reset everything and go to homepage
      onResetCart();
      onClose();
    } else {
      // If order is not placed, go back to cart
      onClose();
    }
  };

  const checkUserExists = async (
    phoneNumber: string
  ): Promise<{ exists: boolean; banStatus: boolean }> => {
    const response = await axios.post("/api/userData", {
      action: "checkUserExists",
      phoneNumber,
    });
    return response.data;
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
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
      setPhoneError(""); // Clear any existing error message
    }
  };
  const closeUserModal = () => {
    setShowUserModal(false);
  };
  const validatePhoneNumber = (number: string): boolean => {
    const validStartDigits = ["9", "8", "7", "6"];
    return number.length === 10 && validStartDigits.includes(number[0]);
  };
  const handleGetOtp = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Please enter a valid phone number");
      setTimeout(() => setPhoneError(""), 5000);
      return;
    }

    if (isOtpRequestInProgress) return;

    setIsOtpRequestInProgress(true);
    setOtpState("loading");
    setIsOtpRequested(true); // Set this to true when OTP is requested
    try {
      // First, check if the user exists and their ban status
      const { exists, banStatus } = await checkUserExists(phoneNumber);

      if (banStatus) {
        setIsBanned(true);
        setShowUserModal(true);
        setOtpState("idle");
        return;
      }

      if (!exists) {
        setShowUserModal(true);
        setOtpState("idle");
        return;
      }

      // If the user exists and is not banned, fetch user data
      const fetchedUserData = await getUserData(phoneNumber);
      setCustomerName(fetchedUserData.name.split(" ")[0]);

      // Now, send the OTP
      const otpResponse = await axios.post("/api/sendOtp", { phoneNumber });

      if (otpResponse.status === 200) {
        const { otp } = otpResponse.data;
        setGeneratedOtp(otp);
        setOtpState("sent");
        setTimer(30);
        // setOtpMessage(`OTP sent successfully to ${phoneNumber}. Please check your SMS for order updates`);
      } else {
        setOtpMessage("Failed to send OTP. Please try again.");
        setOtpState("idle");
      }
    } catch (error) {
      console.error("Error checking user or sending OTP:", error);
      setOtpMessage("An error occurred. Please try again.");
      setOtpState("idle");
    } finally {
      setIsOtpLoading(false);
      setTimeout(() => setIsOtpRequestInProgress(false), 5000); // Allow new requests after 5 seconds
    }
  };

   const handleUserDataSubmit = async () => {
     if (userData.name) {
       try {
         setOtpState("loading");
         setPendingUserData(userData);
         setShowUserModal(false);

         // Send OTP for the new user
         const otpResponse = await axios.post("/api/sendOtp", { phoneNumber });

         if (otpResponse.status === 200) {
           const { otp } = otpResponse.data;
           setGeneratedOtp(otp);
           setOtpState("sent");
           setIsOtpSent(true);
           setTimer(30);
         } else {
           setOtpMessage("Failed to send OTP. Please try again.");
           setOtpState("idle");
         }
       } catch (error) {
         console.error("Error sending OTP:", error);
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
      } else if (index === 3 && value !== "") {
        otpRefs[index].current?.blur();
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && otpInputs[index] === "") {
      otpRefs[index - 1].current?.focus();
    }
  };

  
 const [shouldPlaceOrder, setShouldPlaceOrder] = useState(false);

 useEffect(() => {
   const checkVerificationAndSetOrderFlag = async () => {
     setIsLoading(true);
     setIsAutoPlacingOrder(true); // Add this line

     const cachedVerification = localStorage.getItem("otpVerified");
     if (cachedVerification) {
       const { verified, phoneNumber: cachedPhoneNumber } =
         JSON.parse(cachedVerification);
       if (verified) {
         try {
           const response = await axios.post(`/api/banValidate`, {
             phoneNumber: cachedPhoneNumber,
           });
           if (!response.data.isBanned) {
             setOtpVerified(true);
             setIsOtpSent(true);
             setPhoneNumber(cachedPhoneNumber);
             const cachedName = localStorage.getItem("userName");
             if (cachedName) {
               setCustomerName(cachedName);
             } else {
               const userData = await getUserData(cachedPhoneNumber);
               setCustomerName(userData.name.split(" ")[0]);
             }
             setShouldPlaceOrder(true);
           } else {
             resetCheckoutState();
             localStorage.removeItem("otpVerified");
             localStorage.removeItem("userName");
           }
         } catch (error) {
           console.error("Error checking ban status:", error);
           resetCheckoutState();
         }
       } else {
         localStorage.removeItem("otpVerified");
         localStorage.removeItem("userName");
         resetCheckoutState();
       }
     } else {
       resetCheckoutState();
     }

     setIsLoading(false);
     setIsAutoPlacingOrder(false); // Add this line
   };

   checkVerificationAndSetOrderFlag();
 }, []);

 useEffect(() => {
   if (shouldPlaceOrder && !isSubmitting && !orderPlaced) {
     handleConfirmOrder();
   }
 }, [shouldPlaceOrder, isSubmitting, orderPlaced]);

 const handleVerifyOtp = async () => {
   const enteredOtp = otpInputs.join("");
   if (enteredOtp === generatedOtp) {
     setOtpVerified(true);

     if (pendingUserData) {
       try {
         await addNewUser(
           phoneNumber,
           pendingUserData.name,
           pendingUserData.email
         );
         setCustomerName(pendingUserData.name.split(" ")[0]);
       } catch (error) {
         console.error("Error adding new user:", error);
         setOtpMessage("Failed to add user. Please try again.");
         return;
       }
     }

     localStorage.setItem(
       "otpVerified",
       JSON.stringify({
         verified: true,
         phoneNumber: phoneNumber,
       })
     );
     // Fetch and save user name
     const userData = await getUserData(phoneNumber);
     const userName = userData.name.split(" ")[0];
     setCustomerName(userName);
     localStorage.setItem("userName", userName);

     // Set flag to place order
     setShouldPlaceOrder(true);
   } else {
     console.log("Incorrect OTP");
     setOtpMessage("Incorrect OTP. Please try again.");
   }
 };


 const handleConfirmOrder = async () => {
   if (isSubmitting) return; // Prevent double submission

   try {
     setIsSubmitting(true);
     const response = await axios.post("/api/submitOrder", {
       items,
       selectedLocation,
       selectedCabin,
       total,
       appliedPromo,
       phoneNumber,
       customerName,
       tableDeliveryCharge,
     });

     if (response.status === 200) {
       console.log("Order submitted:", response.data.orderId);
       setOrderPlaced(true);
       onOrderSuccess();
       onResetCart();
     }
   } catch (error) {
     console.error("Error submitting order:", error);
   } finally {
     setIsSubmitting(false);
     setShouldPlaceOrder(false);
   }
 };

  const isGetOtpDisabled = phoneNumber.length !== 10 || timer > 0;
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50">
        <div className="text-white text-2xl">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 overflow-y-auto">
      <div className="container bg-neutral-900 rounded-lg px-4 py-8 pb-16 md:pb-12  w-full h-full relative">
        <div className="flex justify-between items-center mb-6">
          {/* {!orderPlaced && <h2 className="text-2xl font-bold">Checkout</h2>} */}
          <div className="flex-grow" />
          <button onClick={handleClose} className="text-3xl">
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
                className={`
                btn btn-primary rounded-l-none
                w-32
                flex justify-center items-center 
                ${isGetOtpDisabled ? "cursor-not-allowed " : ""}
              `}
                onClick={handleGetOtp}
                disabled={isGetOtpDisabled || !isCheckboxChecked}
              >
                {otpState === "loading" ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : otpState === "sent" || timer > 0 ? (
                  <span className="text-sm whitespace-nowrap">
                    {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                  </span>
                ) : (
                  <span className="text-sm whitespace-nowrap">Get OTP</span>
                )}
              </button>
            </div>
            <div
              className="flex items-center cursor-pointer"
              onClick={handleClick}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={isCheckboxChecked}
                onChange={() => {}} // Empty onChange to avoid React warning
              />
              <span className="text-sm ml-2">
                I agree to receive messages from Chai Mine
              </span>
            </div>
            {phoneError && (
              <p className="text-red-500 text-sm mt-2">{phoneError}</p>
            )}
            {isOtpLoading ? (
              <div></div>
            ) : otpState == "sent" ? (
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
            ) : null}
          </div>
        ) : (
          <div className="orderitems pb-16">
            <div className="text-center">
              <p className="hidden md:block text-xl font-bold ">
                Order Placed Successfully! Check SMS for Order Updates.
              </p>

              <div className="block md:hidden">
                <p className="text-xl font-bold ">Order Placed Successfully!</p>
                <p className="text-xl font-bold ">
                  Check SMS for Order Updates.
                </p>
              </div>

              <p>
                <a className="underline" href="https://www.chaimine.com">
                  {" "}
                  Go to Home Page
                </a>
              </p>
            </div>
          </div>
        )}
        {showUserModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            onClick={closeUserModal}
          >
            <div
              className="bg-neutral-900 p-6 rounded-lg w-full max-w-md m-4"
              onClick={(e) => e.stopPropagation()}
            >
              {isBanned ? (
                <div>
                  <h3 className="text-xl font-bold mb-4">Account Banned</h3>
                  <p>You have been banned from placing orders at Chai Mine.</p>
                  <button
                    className="btn btn-primary w-full mt-4"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4">Enter Your Details</h3>
                  <input
                    type="text"
                    placeholder="Name"
                    className="input w-full mb-4 bg-neutral-800"
                    value={userData.name}
                    onChange={(e) => {
                      const newName = e.target.value.replace(/[^a-zA-Z ]/g, "");
                      setUserData({ ...userData, name: newName });
                    }}
                    required
                  />
                  <button
                    className="btn btn-primary w-full"
                    onClick={handleUserDataSubmit}
                    disabled={!userData.name}
                  >
                    Submit
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
