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
            {
              $group: {
                _id: null,
                total: { $sum: "$total" },
                tableDeliveryChargeTotal: { $sum: "$tableDeliveryCharge" },
              },
            },
          ])
          .toArray(),
        expenseCollection.find({}).toArray(),
      ]);

      let totalOrders = orderTotals.length > 0 ? orderTotals[0].total : 0;
      let tableDeliveryChargeTotal =
        orderTotals.length > 0 ? orderTotals[0].tableDeliveryChargeTotal : 0;
      let totalExpenses = 0;
      let extraCashPayments = 0;
      let extraUpiPayments = 0; // For tracking ignored UPI payments

      expenses.forEach((expense) => {
        if (expense.category === "Extra Cash Payment" || expense.category === "Opening Cash") {
          extraCashPayments += expense.amount;
        } else if (expense.category === "Extra UPI Payment") {
          // Ignore UPI payments for expense calculation
          extraUpiPayments += expense.amount;
        } else {
          totalExpenses += expense.amount;
        }
      });

   totalOrders = totalOrders - tableDeliveryChargeTotal + extraCashPayments;

      // Calculate all-time counter balance excluding UPI payments from expenses
      const allTimeCounterBalance = totalOrders - totalExpenses;

      res.status(200).json({
        totalOrders,
        totalExpenses,
        extraCashPayments,
        extraUpiPayments, // Just for reporting purposes
        allTimeCounterBalance,
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
