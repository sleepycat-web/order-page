import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import { parseISO, format } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  interface TimeSlot {
    start: string;
    end: string;
    label: string;
    availableCabins: string[];
  }

  try {
    const { date, slug } = req.body;
    console.log("Received request body:", { date, slug });

    if (!date || !slug) {
      return res.status(400).json({ error: "Date and slug are required" });
    }

    const { db } = await connectToDatabase();

    const parsedDate = parseISO(date);
    const formattedDate = format(parsedDate, "yyyy-MM-dd");
    console.log("Formatted date:", formattedDate);

    const collectionName =
      slug === "sevoke" ? "BookingSevoke" : "BookingDagapur";
    console.log("Collection name:", collectionName);

    const allCabins =
      slug.toLowerCase() === "dagapur"
        ? ["Cabin 1", "Cabin 2", "Cabin 3"]
        : [
            "Cabin 4",
            "Cabin 5",
            "Cabin 6",
            "Cabin 7",
            "Cabin 8",
            "Cabin 9",
            "Cabin 10",
            "Cabin 11",
          ];
    console.log("All cabins:", allCabins);

    const bookings = await db
      .collection(collectionName)
      .find({ date: formattedDate })
      .project({ startTime: 1, endTime: 1, cabin: 1, _id: 0 })
      .toArray();
    console.log("Bookings found:", JSON.stringify(bookings, null, 2));

    const TIME_SLOTS: TimeSlot[] = [
      {
        start: "11:00",
        end: "13:00",
        label: "11 am to 1 pm",
        availableCabins: [...allCabins],
      },
      {
        start: "13:00",
        end: "15:00",
        label: "1 pm to 3 pm",
        availableCabins: [...allCabins],
      },
      {
        start: "15:00",
        end: "17:00",
        label: "3 pm to 5 pm",
        availableCabins: [...allCabins],
      },
      {
        start: "17:00",
        end: "19:00",
        label: "5 pm to 7 pm",
        availableCabins: [...allCabins],
      },
      {
        start: "19:00",
        end: "21:00",
        label: "7 pm to 9 pm",
        availableCabins: [...allCabins],
      },
    ];
    console.log("Initial time slots:", JSON.stringify(TIME_SLOTS, null, 2));

    const availableSlots = TIME_SLOTS.map((slot) => {
      const bookedCabins = bookings
        .filter(
          (booking) =>
            booking.startTime === slot.start && booking.endTime === slot.end
        )
        .map((booking) => booking.cabin);

      console.log(`Booked cabins for ${slot.label}:`, bookedCabins);

      const remainingCabins = slot.availableCabins.filter(
        (cabin) => !bookedCabins.includes(cabin)
      );

      console.log(`Remaining cabins for ${slot.label}:`, remainingCabins);

      return {
        ...slot,
        availableCabins: remainingCabins,
      };
    }).filter((slot) => slot.availableCabins.length > 0);

    console.log(
      "Final available slots:",
      JSON.stringify(availableSlots, null, 2)
    );

    return res.status(200).json({
      availableSlots,
      allCabins,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return res.status(500).json({
      error: (error as Error).message || "Failed to check availability",
    });
  }
}
