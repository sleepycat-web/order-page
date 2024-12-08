import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { startOfDay } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ message: "Missing slug" });
  }

  try {
    const { db } = await connectToDatabase();

    const bookings = [];

    const timeZone = "Asia/Kolkata";
    const now = new Date();
    const istNow = utcToZonedTime(now, timeZone);
    const todayStart = startOfDay(istNow);
    const todayStartStr = format(todayStart, "yyyy-MM-dd");

    let collectionName;

    if (slug === "sevoke") {
      collectionName = "BookingSevoke";
    } else if (slug === "dagapur") {
      collectionName = "BookingDagapur";
    } else {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const collectionBookings = await db
      .collection(collectionName)
      .find({
        date: { $gte: todayStartStr },
      })
      .sort({ date: 1, startTime: 1 })
      .toArray();

    bookings.push(...collectionBookings);

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
