import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { parseISO, format } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { date, slug } = req.body;
    if (!date || !slug) {
      res.status(400).json({ error: "Date and slug are required" });
      return;
    }

    const { db } = await connectToDatabase();

    const parsedDate = parseISO(date);
    const formattedDate = format(parsedDate, "yyyy-MM-dd");

    const collectionName =
      slug === "sevoke" ? "BookingSevoke" : "BookingDagapur";

    const bookings = await db
      .collection(collectionName)
      .find({ date: formattedDate })
      .project({ startTime: 1, endTime: 1, _id: 0 })
      .toArray();

    const TIME_SLOTS: TimeSlot[] = [
      { start: "11:00", end: "13:00", label: "11 am to 1 pm" },
      { start: "13:00", end: "15:00", label: "1 pm to 3 pm" },
      { start: "15:00", end: "17:00", label: "3 pm to 5 pm" },
      { start: "17:00", end: "19:00", label: "5 pm to 7 pm" },
      { start: "19:00", end: "21:00", label: "7 pm to 9 pm" },
    ];

    // Define the TimeSlot type
    interface TimeSlot {
      start: string;
      end: string;
      label: string;
    }

    // Determine available TIME_SLOTS
    const bookedSlots = bookings.map(slot => `${slot.startTime}-${slot.endTime}`);
    const availableSlots: TimeSlot[] = TIME_SLOTS.filter(
      slot => !bookedSlots.includes(`${slot.start}-${slot.end}`)
    );

    res.status(200).json({ availableSlots });
  } catch (error) {
    console.error("Error checking availability:", error);
    res
      .status(500)
      .json({ error: (error as Error).message || "Failed to check availability" });
  }
}