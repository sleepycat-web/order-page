import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import nodemailer from "nodemailer";

// Helper function to get IST time
function getISTTime(): Date {
  return new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
}

// Helper function to format branch name
function formatBranchName(slug: string): string {
  if (slug.toLowerCase() === "sevoke") {
    return "Sevoke Road";
  } else if (slug.toLowerCase() === "dagapur") {
    return "Dagapur";
  }
  return slug; // fallback case
}

// Helper function to check if email should be sent
function shouldSendEmail(category: string): boolean {
  const excludedCategories = [
    "UPI Payment",
    "Extra UPI Payment",
    "Extra Cash Payment",
  ];
  return !excludedCategories.includes(category);
}

async function sendExpenseEmail(
  slug: string,
  category: string,
  amount: number,
  comment: string
): Promise<void> {
  // Skip email if category is in excluded list
  if (!shouldSendEmail(category)) {
    return;
  }

  const branchName = formatBranchName(slug);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailContent = `
New Expense Added at Chai Mine ${branchName}!

Expense Details:
- Category: ${category}
- Amount: ₹${amount}
- Comment: ${comment}
- Time: ${getISTTime().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Expense Added at Chai Mine ${branchName}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending expense email:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { db } = await connectToDatabase();
      const { slug, category, amount, comment } = req.body;

      if (typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid slug" });
      }

      const collectionName = `Expense${
        slug.charAt(0).toUpperCase() + slug.slice(1)
      }`;
      const collection = db.collection(collectionName);

      const istTime = getISTTime();

      const result = await collection.insertOne({
        category,
        amount: parseFloat(amount),
        comment,
        createdAt: istTime,
      });

      // Send email notification only if category is not in excluded list
      await sendExpenseEmail(slug, category, parseFloat(amount), comment);

      res
        .status(201)
        .json({ message: "Expense added successfully", id: result.insertedId });
    } catch (error: unknown) {
      res.status(500).json({
        message: "Error adding expense",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();
      const { slug } = req.query;

      if (typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid slug" });
      }

      const collectionName = `Expense${
        slug.charAt(0).toUpperCase() + slug.slice(1)
      }`;
      const collection = db.collection(collectionName);

      // Calculate start of day in IST
      const startOfDay = getISTTime();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const expenses = await collection
        .find({ createdAt: { $gte: startOfDay } })
        .toArray();

      res.status(200).json(expenses);
    } catch (error: unknown) {
      res.status(500).json({
        message: "Error fetching expenses",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
