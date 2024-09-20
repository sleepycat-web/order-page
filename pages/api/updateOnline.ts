import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { location, amount, name } = req.body;

    if (!location || amount === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { db } = await connectToDatabase();

    let collectionName: string;
    const normalizedLocation = location.trim().toLowerCase();

    if (
      normalizedLocation === "sevoke" ||
      normalizedLocation === "sevoke road"
    ) {
      collectionName = "ExpenseSevoke";
    } else if (normalizedLocation === "dagapur") {
      collectionName = "ExpenseDagapur";
    } else {
      return res.status(400).json({ message: "Invalid location" });
    }

    const document = {
      category: "UPI Payment",
      amount: Number(amount),
      comment: ` ${name}`,
      createdAt: new Date(),
    };

    const result = await db.collection(collectionName).insertOne(document);

    if (result.acknowledged) {
      res.status(200).json({
        message: "Online payment updated successfully",
        insertedId: result.insertedId,
      });
    } else {
      throw new Error("Insert operation was not acknowledged by MongoDB");
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}
