import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

// Define the interface based on the expected Fast2SMS response structure
interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string;
  // Add any other fields if needed
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { phoneNumber, customerName, deliveryCharge } = req.body;

  if (!phoneNumber || !customerName || deliveryCharge === undefined) {
    return res.status(400).json({
      message: "Phone number, customer name, and delivery charge are required",
    });
  }

  const firstName = customerName.split(" ")[0];

  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "API key is not configured" });
  }
  const url = "https://www.fast2sms.com/dev/bulkV2";
  const headers = {
    authorization: apiKey,
    "Content-Type": "application/json",
  };
  let messageId: string;
  if (deliveryCharge > 0) {
    messageId = "173310"; // Message ID for delivery charge
  } else {
    messageId = "173311"; // Message ID for no delivery charge
  }

  const body = {
    route: "dlt",
    sender_id: "CHMINE",
    message: messageId,
    variables_values: firstName,
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
      res.status(200).json({ message: "Confirmation sent successfully" });
    } else {
      res
        .status(500)
        .json({ message: "Failed to send Confirmation", error: data.message });
    }
  } catch (error) {
    console.error("Error sending Confirmation:", error);
    res.status(500).json({ message: "Failed to send Confirmation" });
  }
}

