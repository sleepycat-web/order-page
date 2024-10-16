import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

function formatLocation(location: string): string {
  if (location.toLowerCase() === "sevoke") {
    return "Sevoke Road";
  }
  return location
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
function getAdjustedTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { customerName, phoneNumber, location } = req.body;

  if (!customerName || !phoneNumber || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const formattedLocation = formatLocation(location);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailContent = `
Phone Number Checked:
- Customer Name: ${customerName}
- Phone Number: ${phoneNumber}
- Location: ${formattedLocation}
- Time: ${getAdjustedTime().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Phone Number Checked at ${formattedLocation}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email" });
  }
}
