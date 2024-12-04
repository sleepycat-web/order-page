import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import nodemailer from "nodemailer";
import { isSameDay } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
 
  if (req.method === 'GET') {
    try {
      const { slug } = req.query;
      const { db } = await connectToDatabase();

      const location = (slug as string).includes("sevoke") ? "Sevoke Road" : "Dagapur";
       const entries = await db
         .collection("CashBalanceDetails")
         .find({ location })
         .sort({ createdAt: -1 })
         .limit(5)
         .toArray();
      res.status(200).json(entries);

    } catch (error) {
      console.error("Error fetching counter balance entries:", error);
      res.status(500).json({ message: "Server Error" });
    }
  } else if (req.method === 'POST') {
    try {
      const { slug, amountEntered, actualAmount } = req.body;
      const { db } = await connectToDatabase();

      const nowIST = getISTDate();
      const location = slug.includes("sevoke") ? "Sevoke Road" : "Dagapur";

      let status = "match";
      const difference = amountEntered - actualAmount;
      if (difference > 0) status = "surplus";
      else if (difference < 0) status = "deficit";

      // Determine the expense collection
      const expenseCollectionName =
        location === "Sevoke Road" ? "ExpenseSevoke" : "ExpenseDagapur";
      // If there's a surplus or deficit, add to the expense collection
      if (status !== "match") {
        const expenseEntry = {
          category: status === "surplus" ? "Extra Cash Payment" : "Suspense",
          amount: Math.abs(difference),
          comment: status.charAt(0).toUpperCase() + status.slice(1),
          createdAt: nowIST,
        };

        await db.collection(expenseCollectionName).insertOne(expenseEntry);
      }
      // Create a new entry in the CashBalanceDetails collection
      await db.collection("CashBalanceDetails").insertOne({
        //   slug,
        amountEntered,
        actualAmount,
        status,
        difference,
        createdAt: nowIST,
        location,
      });

      // Send email notification
      await sendEmailNotification({
        slug,
        amountEntered,
        actualAmount,
        status,
        difference,
        createdAt: nowIST,
        location,
      });

      res.status(200).json({ message: "Cash balance verified successfully" });
    } catch (error) {
      console.error("Error in addMoneyHandler:", error);
      res.status(500).json({ message: "Server Error" });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']); // Specify allowed methods
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

async function sendEmailNotification(entry: any) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const statusMessage =
    entry.status === "match"
      ? "Cash Balance Verified"
      : `Cash Balance ${
          entry.status.charAt(0).toUpperCase() + entry.status.slice(1)
        }`;

  const emailContent = `${statusMessage} at ${entry.location}

Time: ${entry.createdAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}
Amount Entered: ₹${entry.amountEntered}
Actual Amount: ₹${entry.actualAmount}
Difference: ₹${Math.abs(entry.difference)}
Status: ${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)} `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL, // Replace with your notification email
    subject: `${statusMessage} at ${entry.location}`,
    text: emailContent.trim(),
  };

  await transporter.sendMail(mailOptions);
}
