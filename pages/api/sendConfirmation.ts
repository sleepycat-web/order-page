import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import SibApiV3Sdk from "sib-api-v3-sdk";

// Configure API key authorization
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { phoneNumber, customerName } = req.body;

  if (!phoneNumber || !customerName) {
    return res
      .status(400)
      .json({ message: "Phone number and customer name are required" });
  }

  // Extract the first name from the full name
  const firstName = customerName.split(" ")[0];

  // Ensure the phone number includes the '+91' country code
  const formattedPhoneNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

  const sendSmsApi = new SibApiV3Sdk.TransactionalSMSApi();
  const sendSms = new SibApiV3Sdk.SendSms();

  sendSms.name = "CHMINE";
  sendSms.sender = "CHMINE";
  sendSms.recipient = formattedPhoneNumber;
  sendSms.content = `Dear ${firstName}, your order has been dispatched. Enjoy your meal!`;

  try {
    const response = await sendSmsApi.sendTransacSms(sendSms);
    console.log("SMS sent successfully:", response);
    res
      .status(200)
      .json({ message: "Dispatch SMS sent successfully", response });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({
      message: "Failed to send dispatch SMS",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}