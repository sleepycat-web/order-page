import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { bookingId, slug } = req.body;

  if (!slug) {
    return res.status(400).json({ message: 'Missing slug parameter' });
  }

  try {
    const { db } = await connectToDatabase();
    
    const collectionName = slug === "sevoke" ? "BookingSevoke" : "BookingDagapur";
    
    if (slug !== "sevoke" && slug !== "dagapur") {
      return res.status(400).json({ message: "Invalid slug" });
    }

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { notificationPlayed: true } } // Ensure this line sets the correct field
    );

    res.status(200).json({ message: 'Notification status updated' });
  } catch (error) {
    console.error('Error updating booking notification status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
