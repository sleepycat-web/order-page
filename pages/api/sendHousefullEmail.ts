import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

interface SendHousefullEmailParams {
  location: string;
}
function getAdjustedTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}
async function sendHousefullEmail({
  location,
}: SendHousefullEmailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const formattedLocation = formatLocation(location);
  const emailContent = `
    All cabins are currently full at ${formattedLocation}.
    Time: ${getAdjustedTime().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "medium",
    })}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Housefull at ${formattedLocation}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
   } catch (error) {
    console.error("Error sending housefull email:", error);
    throw error;
  }
}

function formatLocation(location: string): string {
  if (location.toLowerCase() === "sevoke") {
    return "Sevoke Road";
  } else if (location.toLowerCase() === "dagapur") {
    return "Dagapur";
  }
  return location
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { location } = req.body;

      if (!location) {
        return res.status(400).json({ error: "Location is required" });
      }

      if (location !== "sevoke" && location !== "dagapur") {
        return res.status(400).json({ error: "Invalid location" });
      }

      await sendHousefullEmail({ location });
      res.status(200).json({ message: "Housefull email sent successfully" });
    } catch (error) {
      console.error("Error in housefull email API route:", error);
      res.status(500).json({ error: "Failed to send housefull email" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
