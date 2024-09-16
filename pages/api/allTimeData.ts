import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb"; // Adjust the import path as necessary

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();
      const { slug } = req.query;

      if (typeof slug !== "string") {
        return res.status(400).json({ message: "Invalid slug" });
      }

      const orderCollectionName = `Order${
        slug.charAt(0).toUpperCase() + slug.slice(1)
      }`;
      const expenseCollectionName = `Expense${
        slug.charAt(0).toUpperCase() + slug.slice(1)
      }`;

      const orderCollection = db.collection(orderCollectionName);
      const expenseCollection = db.collection(expenseCollectionName);

      const [orderTotals, expenses] = await Promise.all([
        orderCollection
          .aggregate([
            { $match: { status: "fulfilled" } },
            { $group: { _id: null, total: { $sum: "$total" } } },
          ])
          .toArray(),
        expenseCollection.find({}).toArray(),
      ]);

      const totalOrders = orderTotals.length > 0 ? orderTotals[0].total : 0;
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      res.status(200).json({
        totalOrders,
        totalExpenses,
        allTimeCounterBalance: totalOrders - totalExpenses,
      });
    } catch (error: unknown) {
      res.status(500).json({
        message: "Error fetching all-time data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
