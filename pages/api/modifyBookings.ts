import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { utcToZonedTime, format } from "date-fns-tz";
import { ObjectId } from "mongodb"; // Import ObjectId
import { get } from "http";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  // Helper function to get IST time
  function getISTTime(): Date {
    return new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
  }
  try {
    const { bookingId, location, date, startTime, endTime, slug } = req.body;

    if (!bookingId || !location || !date || !startTime || !endTime || !slug) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const { db } = await connectToDatabase();

    const collectionName =
      slug === "sevoke" ? "BookingSevoke" : "BookingDagapur";

    // Fetch the existing booking to get the current name
    const existingBooking = await db.collection(collectionName).findOne(
      { _id: new ObjectId(bookingId) } // Convert bookingId to ObjectId
    );

    if (!existingBooking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const updateData: any = { location, date, startTime, endTime };

    if (date) {
      updateData.modifiedAt = getISTTime();
      updateData.name = `${existingBooking.name} (Modified)`;
    }

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(bookingId) }, // Convert bookingId to ObjectId
      { $set: updateData }
    );

    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error) {
    console.error("Error modifying booking:", error);
    res
      .status(500)
      .json({ error: (error as Error).message || "Failed to modify booking" });
  }
}
