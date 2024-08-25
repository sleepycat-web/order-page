import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import SibApiV3Sdk from "sib-api-v3-sdk";

// Configure API key authorization
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalSMSApi();

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

  // Ensure the phone number includes the '+91' country code
  const formattedPhoneNumber = phoneNumber.startsWith("+91")
    ? phoneNumber
    : `+91${phoneNumber}`;

  // Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const sendSmsApi = new SibApiV3Sdk.TransactionalSMSApi();
  const sendSms = new SibApiV3Sdk.SendSms();

    sendSms.name = "CHMINE";
  sendSms.sender = "CHMINE";
  sendSms.recipient = formattedPhoneNumber;
  sendSms.content = `Your OTP for your order is: ${otp}. Thank you for choosing Chai Mine!`;

  try {
    await sendSmsApi.sendTransacSms(sendSms);
    res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
}
