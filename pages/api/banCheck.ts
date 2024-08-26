// banCheck.ts
import axios from "axios";

interface OtpVerifiedData {
  phoneNumber: string;
  expiry: number;
}

export function startBanCheck() {
  const checkBanStatus = async () => {
    const otpVerifiedString = safeGetItem("otpVerified");
    if (!otpVerifiedString) return;

    const otpVerified: OtpVerifiedData = JSON.parse(otpVerifiedString);
    if (new Date().getTime() > otpVerified.expiry) {
      localStorage.removeItem("otpVerified");
      return;
    }

    try {
      const response = await axios.post(
        `/api/banValidate`,
        { phoneNumber: otpVerified.phoneNumber },
        {
          headers: {
            Authorization: `Bearer ${safeGetItem("authToken")}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.data.isBanned) {
        localStorage.removeItem("otpVerified");
        window.dispatchEvent(new CustomEvent("userBanned"));
      }
    } catch (error) {
      console.error("Error checking ban status:", error);
      // Optionally, implement a backoff strategy here
    }
  };

  // Run the check immediately
  checkBanStatus();

  // Then run it every 2 minutes
  return setInterval(checkBanStatus, 30000);
}

// Helper function to safely get items from localStorage
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error accessing localStorage for key ${key}:`, error);
    return null;
  }
}
