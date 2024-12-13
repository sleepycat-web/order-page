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
   
    if (!date || !slug) {
      return res.status(400).json({ error: "Date and slug are required" });
    }

    const { db } = await connectToDatabase();

    const parsedDate = parseISO(date);
    const formattedDate = format(parsedDate, "yyyy-MM-dd");

    // Get current date and time in IST
    const currentDateIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const formattedCurrentDate = format(currentDateIST, "yyyy-MM-dd");
    const currentTimeIST = format(currentDateIST, "HH:mm");

    const collectionName =
      slug === "sevoke" ? "BookingSevoke" : "BookingDagapur";
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
    const bookings = await db
      .collection(collectionName)
      .find({ date: formattedDate })
      .project({ startTime: 1, endTime: 1, cabin: 1, _id: 0 })
      .toArray();

    const generateTimeSlots = (selectedDate: Date): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      const startHour = 11;
      const endHour = 21;
      const now = new Date();
      const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
      
      for (let hour = startHour; hour < endHour; hour++) {
        [0, 30].forEach((minute) => {
          const slotStart = new Date(selectedDate);
          slotStart.setHours(hour, minute, 0, 0);
    
          // Skip past time slots if the date is today
          if (isToday && slotStart <= now) return;
    
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(slotEnd.getHours() + 2);
    
          if (slotEnd.getHours() > endHour) return;
    
          const start = format(slotStart, "HH:mm");
          const end = format(slotEnd, "HH:mm");
          const label = `${format(slotStart, "h:mm a")} to ${format(slotEnd, "h:mm a")}`;
    
          slots.push({
            start,
            end,
            label,
            availableCabins: [],
          });
        });
      }
    
      return slots;
    };

    const TIME_SLOTS = generateTimeSlots(parsedDate);

    let availableSlots = TIME_SLOTS.map((slot) => {
      const bookedCabins = bookings
        .filter(
          (booking) =>
            booking.startTime === slot.start && booking.endTime === slot.end
        )
        .map((booking) => booking.cabin);
      const remainingCabins = allCabins.filter(
        (cabin) => !bookedCabins.includes(cabin)
      );
      return {
        ...slot,
        availableCabins: remainingCabins,
      };
    }).filter((slot) => slot.availableCabins.length > 0);

    // If the date is today, filter out past time slots
    if (formattedDate === formattedCurrentDate) {
      availableSlots = availableSlots.filter(
        (slot) => slot.start > currentTimeIST
      );
    }
    // // If the date is today, filter out past time slots
    // if (formattedDate < formattedCurrentDate) {
    //   // If the date is in the past, no slots should be available
    //   return res.status(200).json({ availableSlots: [], allCabins });
    // } else if (formattedDate === formattedCurrentDate) {
    //   // If the date is today, filter out past time slots
    //   availableSlots = availableSlots.filter(
    //     (slot) => slot.start > currentTimeIST
    //   );
    // }
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
