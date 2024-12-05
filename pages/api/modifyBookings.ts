import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { toZonedTime, format } from "date-fns-tz";
import { ObjectId } from "mongodb"; // Import ObjectId

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { bookingId, location, date, startTime, endTime, slug } = req.body;
    console.log("Request body:", req.body); // Log the request body
    console.log("Booking ID:", bookingId); // Log the bookingId

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
      const istNow = toZonedTime(new Date(), 'Asia/Kolkata');
      updateData.modifiedAt = format(istNow, "yyyy-MM-dd'T'HH:mm:ssXXX");
      updateData.name = `${existingBooking.name} (Modified)`; // Use existing booking name
    }

    await db
      .collection(collectionName)
      .updateOne(
        { _id: new ObjectId(bookingId) }, // Convert bookingId to ObjectId
        { $set: updateData }
      );

    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error) {
    console.error("Error modifying booking:", error);
    res.status(500).json({ error: (error as Error).message || "Failed to modify booking" });
  }
}