import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toZonedTime } from "date-fns-tz";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Keep existing date formatting functions intact
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd MMMM yyyy") : "Invalid Date";
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "d MMMM yyyy 'at' h:mm a");
};

// Time slots remain the same
const TIME_SLOTS: TimeSlot[] = [
  { start: "11:00", end: "13:00", label: "11 am to 1 pm" },
  { start: "13:00", end: "15:00", label: "1 pm to 3 pm" },
  { start: "15:00", end: "17:00", label: "3 pm to 5 pm" },
  { start: "17:00", end: "19:00", label: "5 pm to 7 pm" },
  { start: "19:00", end: "21:00", label: "7 pm to 9 pm" },
];

// Type definitions
interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface Booking {
  _id: string; // Changed from { $oid: string }
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  finalPrice: number;
  name: string;
  promoCode?: {
    code: string;
    percentage: number;
  };
  createdAt: string;
}

interface BookingCardProps {
  booking: Booking;
  fetchBookings: () => Promise<void>;
  slug: string; // Added slug
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  fetchBookings,
  slug,
}) => {
  const now = new Date();
  const istNow = toZonedTime(now, "Asia/Kolkata");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isDateManuallySelected, setIsDateManuallySelected] =
    useState<boolean>(false);

  const formattedCreatedAt = formatDateTime(booking.createdAt);
  const formattedDate = formatDate(booking.date);
  const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
  const diffInHours =
    (bookingStart.getTime() - istNow.getTime()) / (1000 * 60 * 60);

  useEffect(() => {
    if (isPopoverOpen) {
      const originalDate = new Date(booking.date);
      const originalTimeSlot =
        TIME_SLOTS.find((slot) => slot.start === booking.startTime) || null;

      setSelectedDate(originalDate);
      setSelectedTimeSlot(originalTimeSlot);
      setIsDateManuallySelected(false);

      // Initialize availableSlots with the original time slot to prevent flashing
      setAvailableSlots(originalTimeSlot ? [originalTimeSlot] : []);

      const fetchAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const response = await axios.post("/api/checkBookings", {
            date: format(originalDate, "yyyy-MM-dd"),
            slug: booking.location.toLowerCase(),
          });
          let slots: TimeSlot[] = response.data.availableSlots;

          // Ensure the original slot is included
          if (
            originalTimeSlot &&
            !slots.find((slot) => slot.start === originalTimeSlot.start)
          ) {
            slots.push(originalTimeSlot);
          }

          // Append fetched slots to existing availableSlots without duplicates
          setAvailableSlots((prevSlots) => {
            const existingStarts = prevSlots.map((slot) => slot.start);
            const newSlots = slots.filter(
              (slot) => !existingStarts.includes(slot.start)
            );
            return [...prevSlots, ...newSlots];
          });
        } catch (error) {
          console.error("Error fetching available slots:", error);
        } finally {
          setLoadingSlots(false);
        }
      };

      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen]);

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;

    console.log("Handling date change:", date);

    // Ensure the date is set correctly
    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(new Date(formattedDate)); // Explicitly create a new Date object
    setIsDateManuallySelected(true);
    setLoadingSlots(true);

    try {
      const response = await axios.post("/api/checkBookings", {
        date: formattedDate,
        slug: booking.location.toLowerCase(),
      });
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateSelectable = (date: Date) => {
    const now = new Date();
    const istNow = toZonedTime(now, "Asia/Kolkata");

    // Allow selection of today and future dates
    const todayStart = new Date(istNow.setHours(0, 0, 0, 0));
    return date >= todayStart;
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
  };

  const isUpdateDisabled = () => {
    if (!selectedDate || !selectedTimeSlot) return true;
    const originalDate = format(new Date(booking.date), "yyyy-MM-dd");
    const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");
    return (
      originalDate === formattedSelectedDate &&
      selectedTimeSlot.start === booking.startTime
    );
  };

  const handleUpdate = async () => {
    console.log("Updating - Selected Date:", selectedDate);
    console.log("Updating - Selected Time Slot:", selectedTimeSlot);
    console.log("Updating - Booking ID:", booking._id); // Changed from booking._id.$oid

    if (!selectedDate) {
      alert("Please select a date");
      return;
    }

    if (!selectedTimeSlot) {
      alert("Please select a time slot");
      return;
    }

    // Rest of the update logic remains the same
    setUpdating(true);
    try {
      const response = await axios.post("/api/modifyBookings", {
        bookingId: booking._id, // Changed from booking._id.$oid
        location: booking.location,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        slug: slug, // Added slug
      });

      if (response.status === 200 && response.data.success) {
        await fetchBookings();
        setIsModalOpen(false);
        setIsPopoverOpen(false);
        console.log("Booking updated successfully");
      } else {
        console.error("Update failed:", response.data.message);
        alert(response.data.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Network error occurred");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card key={booking._id} className="bg-neutral-800 shadow-md">
      <CardHeader className="flex justify-between items-left">
        <div className="flex items-center">
          <CardTitle className="text-xl font-semibold flex-grow text-white">
            {booking.name}
          </CardTitle>
          {diffInHours > 1 && (
            <Popover
              open={isPopoverOpen}
              onOpenChange={handlePopoverOpenChange}
              defaultOpen={false}
            >
              <PopoverTrigger>
                <Button variant="ghost" className="ml-auto">
                  <UserPen className="text-white" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <div className={`flex space-x-4`}>
                  <Calendar
                    selected={selectedDate}
                    onSelect={(date: Date | undefined) => {
                      handleDateChange(date || new Date());
                    }}
                    mode="single"
                    disabled={(date: Date) => !isDateSelectable(date)}
                  />
                  <div className="">
                    <label className="block text-md font-medium text-white mb-4 mt-4">
                      Select Time Slot
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.start}
                          variant={
                            selectedTimeSlot?.start === slot.start
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() => {
                            setSelectedTimeSlot(slot);
                          }}
                          className="text-sm"
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isUpdateDisabled() || updating}
                    className="ml-2"
                  >
                    {updating ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Updating
                      </div>
                    ) : (
                      "Update Booking"
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Confirm Update</DialogTitle>
              </DialogHeader>
              <p className="mt-2">
                Are you sure you want to update this booking?
              </p>
              <DialogFooter>
                <Button onClick={() => setIsModalOpen(false)} variant="ghost">
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updating}>
                  {updating ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-6 gap-2 mb-4">
          <p className="text-neutral-400 col-span-3">
            Date: <span className="text-white">{formattedDate}</span>
          </p>
          <p className="text-neutral-400 col-span-3">
            Location: <span className="text-white">{booking.location}</span>
          </p>
          <p className="text-neutral-400 col-span-3">
            Start Time: <span className="text-white">{booking.startTime}</span>
          </p>
          <p className="text-neutral-400 col-span-3">
            End Time: <span className="text-white">{booking.endTime}</span>
          </p>
          <p className="text-neutral-400 col-span-6">
            Created at: <span className="text-white">{formattedCreatedAt}</span>
          </p>
          <div className="text-neutral-400 col-span-3">
            Price: <Badge className="text-sm">₹{booking.finalPrice}</Badge>
          </div>
          {booking.promoCode && (
            <p className="text-neutral-400 col-span-3">
              Promo applied{" "}
              <span className="text-green-500">
                ({booking.promoCode.percentage}% off)
              </span>
            </p>
          )}
          {booking.finalPrice > 0 && (
            <div className="text-neutral-400 col-span-3">
              Payment:{" "}
              <Badge
                className="text-sm text-white bg-green-500"
                variant="accent"
              >
                Fulfilled
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BookingsProps {
  slug: string;
  onClose: () => void;
}

const Bookings: React.FC<BookingsProps> = ({ slug, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/getBookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [slug]);

  const today = new Date();
  const todayIST = new Date(
    today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
  const formattedToday = format(todayIST, "yyyy-MM-dd");

  const todayBookings = bookings.filter(
    (booking) => booking.date === formattedToday
  );
  const upcomingBookings = bookings.filter(
    (booking) => booking.date > formattedToday
  );

  return (
    <Card className="w-full bg-neutral-800 h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-white flex justify-between items-center">
          Bookings for {slug.charAt(0).toUpperCase() + slug.slice(1)}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-left text-neutral-500">No bookings found</p>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value: string) => {
              setActiveTab(value as "today" | "upcoming");
            }}
            className=""
          >
            <TabsList className="mb-4">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            </TabsList>

            <div className="flex-grow flex flex-col">
              <TabsContent value="today" className="flex-grow">
                {todayBookings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {todayBookings.map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        fetchBookings={fetchBookings}
                        slug={slug} // Pass slug
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-left text-neutral-500">
                    No bookings for today
                  </p>
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="flex-grow">
                {upcomingBookings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        fetchBookings={fetchBookings}
                        slug={slug} // Pass slug
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-left text-neutral-500">
                    No upcoming bookings
                  </p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default Bookings;