import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb"; // Adjust the import path as necessary

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

      const result = await collection.insertOne({
        category,
        amount: parseFloat(amount),
        comment,
        createdAt: new Date(),
      });

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

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const expenses = await collection
        .find({
          createdAt: { $gte: startOfDay },
        })
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
