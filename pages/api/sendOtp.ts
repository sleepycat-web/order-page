import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string;
  // Add any other fields that might be in the response
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "API key is not configured" });
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";

  const headers = {
    authorization: apiKey,
    "Content-Type": "application/json",
  };

  const body = {
    route: "dlt",
    sender_id: "CHMINE",
    message: "173215",
    variables_values: otp,
    flash: 0,
    numbers: phoneNumber,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Fast2SMSResponse;

    if (data.return === true) {
      res.status(200).json({ message: "OTP sent successfully", otp });
    } else {
      res
        .status(500)
        .json({ message: "Failed to send OTP", error: data.message });
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
}
