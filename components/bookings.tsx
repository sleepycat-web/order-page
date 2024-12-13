import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isValid, parse } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { utcToZonedTime } from "date-fns-tz";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Keep existing date formatting functions intact
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, "dd MMMM yyyy") : "Invalid Date";
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  date.setHours(date.getHours() - 5);
  date.setMinutes(date.getMinutes() - 30);
  return format(date, "d MMMM yyyy 'at' h:mm a");
};

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
  phone: string;
  cabin: string;
  promoCode?: {
    code: string;
    percentage: number;
  };
  createdAt: string;
  modifiedAt?: string;
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
  const istNow = utcToZonedTime(now, "Asia/Kolkata");

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
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<string>(booking.cabin);
  const [availableCabins, setAvailableCabins] = useState<string[]>([]);
  const [loadingCabins, setLoadingCabins] = useState<boolean>(false);

  const formattedCreatedAt = formatDateTime(booking.createdAt);
  const formattedDate = formatDate(booking.date);
  const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
  const diffInHours =
    (bookingStart.getTime() - istNow.getTime()) / (1000 * 60 * 60);

  useEffect(() => {
    if (isPopoverOpen) {
      const originalDate = new Date(booking.date);
      const originalTimeSlot =
        availableSlots.find((slot) => slot.start === booking.startTime) || null;

      setSelectedDate(originalDate);
      setSelectedTimeSlot(originalTimeSlot);
      setIsDateManuallySelected(false);

      const fetchAvailableSlots = async () => {
        setLoadingSlots(true);
        try {
          const response = await axios.post("/api/checkBookings", {
            date: format(originalDate, "yyyy-MM-dd"),
            slug: booking.location.toLowerCase().split(" ")[0], // Ensure consistent slug
          });
          const slots: TimeSlot[] = response.data.availableSlots;

          // Log the returned slots

          // Set availableSlots directly from the handler
          setAvailableSlots(slots);
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
  useEffect(() => {
    if (isPopoverOpen && selectedDate && selectedTimeSlot) {
      const fetchAvailableCabins = async () => {
        setLoadingCabins(true);
        try {
          const response = await axios.post("/api/checkBookings", {
            date: format(selectedDate, "yyyy-MM-dd"),
            slug: booking.location.toLowerCase().split(" ")[0],
          });
          const data = response.data;

          const slot = data.availableSlots.find(
            (s: any) =>
              s.start === selectedTimeSlot.start &&
              s.end === selectedTimeSlot.end
          );

          const cabins = slot ? slot.availableCabins : [];

          // Always include and prioritize the current cabin
          const cabinsToShow = Array.from(
            new Set([booking.cabin, ...(cabins || [])])
          );

          setAvailableCabins(cabinsToShow);

          // Always set the original cabin as the selected cabin
          setSelectedCabin(booking.cabin);
        } catch (error) {
          console.error("Error fetching available cabins:", error);
          setAvailableCabins([booking.cabin]);
          setSelectedCabin(booking.cabin);
        } finally {
          setLoadingCabins(false);
        }
      };

      fetchAvailableCabins();
    }
  }, [isPopoverOpen, selectedDate, selectedTimeSlot]);

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;

    const formattedDate = format(date, "yyyy-MM-dd");
    setSelectedDate(new Date(formattedDate));
    setIsDateManuallySelected(true);
    setLoadingSlots(true);

    try {
      const response = await axios.post("/api/checkBookings", {
        date: formattedDate,
        slug: booking.location.toLowerCase().split(" ")[0],
      });
      setAvailableSlots(response.data.availableSlots);

      // Log the available slots after date change
    } catch (error) {
      console.error("Error fetching available slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateSelectable = (date: Date) => {
    const now = new Date();
    const istNow = utcToZonedTime(now, "Asia/Kolkata");

    // Allow selection of today and future dates
    const todayStart = new Date(istNow.setHours(0, 0, 0, 0));
    return date >= todayStart;
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setIsPopoverOpen(open);
  };

  const isUpdateDisabled = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCabin) return true;

    const originalDate = format(new Date(booking.date), "yyyy-MM-dd");
    const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");

    return (
      originalDate === formattedSelectedDate &&
      selectedTimeSlot.start === booking.startTime &&
      selectedCabin === booking.cabin
    );
  };

  const handleUpdate = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCabin) {
      alert("Please select a date, time slot, and cabin");
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.post("/api/modifyBookings", {
        bookingId: booking._id,
        location: booking.location,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedTimeSlot.start,
        endTime: selectedTimeSlot.end,
        cabin: selectedCabin,
        slug: slug,
      });

      // Don't treat success messages as errors
      if (response.status === 200) {
        await fetchBookings();
        setIsModalOpen(false);
        setIsPopoverOpen(false);
        // Optional: Show success message
        // alert("Booking updated successfully");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to update booking");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const showPhoneNumber = async () => {
    // Placeholder for future API call
    // try {
    //   const response = await axios.post('/api/logPhoneView', {
    //     bookingId: booking._id,
    //     // other required data
    //   });
    // } catch (error) {
    //   console.error('Error logging phone view:', error);
    // }

    setIsPhoneVisible(true);
    setTimeout(() => {
      setIsPhoneVisible(false);
    }, 5000);
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
                  {availableSlots.length > 0 && (
                    <div className="showdiv">
                      <label className="block text-md font-medium text-white mb-4 mt-4">
                        Select Time Slot
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.start}
                            variant={
                              selectedTimeSlot?.start === slot.start &&
                              selectedTimeSlot?.end === slot.end
                                ? "secondary"
                                : "outline"
                            }
                            onClick={() => {
                              setSelectedTimeSlot(slot);
                              setSelectedCabin(""); // Reset selected cabin when time slot changes
                            }}
                            className="text-sm"
                          >
                            {slot.label}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="block text-md font-medium text-white mb-2">
                          Select Cabin
                        </label>
                        <Select
                          value={selectedCabin}
                          onValueChange={(value) => setSelectedCabin(value)}
                          disabled={loadingCabins}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                loadingCabins
                                  ? "Loading cabins..."
                                  : availableCabins.length > 0
                                  ? "Select cabin"
                                  : "No cabins available"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingCabins ? (
                              <SelectItem value="loading" disabled>
                                Loading cabins...
                              </SelectItem>
                            ) : (
                              <>
                                {!availableCabins.includes(booking.cabin) && (
                                  <SelectItem
                                    key="current-cabin"
                                    value={booking.cabin}
                                  >
                                    {booking.cabin} (Current)
                                  </SelectItem>
                                )}

                                {availableCabins.map((cabin) => (
                                  <SelectItem key={cabin} value={cabin}>
                                    {cabin}
                                  </SelectItem>
                                ))}

                                {availableCabins.length === 0 && (
                                  <SelectItem value="no_cabins" disabled>
                                    No cabins available
                                  </SelectItem>
                                )}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={
                      isUpdateDisabled() ||
                      updating ||
                      availableSlots.length === 0
                    }
                    variant={
                      isUpdateDisabled() ||
                      updating ||
                      availableSlots.length === 0
                        ? "outline"
                        : undefined
                    }
                    className="ml-2"
                  >
                    {updating ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin" size={16} />
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
                    <Loader2 className="animate-spin" size={16} />
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
            Phone:{" "}
            {isPhoneVisible ? (
              <span className="text-white">{booking.phone}</span>
            ) : (
              <span
                onClick={showPhoneNumber}
                className="text-blue-400 underline cursor-pointer hover:text-blue-300"
              >
                Show Number
              </span>
            )}
          </p>
          <p className="text-neutral-400 col-span-3">
            Date: <span className="text-white">{formattedDate}</span>
          </p>
          {/* <p className="text-neutral-400 col-span-3">
            Location: <span className="text-white">{booking.location}</span>
          </p> */}
          <p className="text-neutral-400 col-span-3">
            Start Time: <span className="text-white">{booking.startTime}</span>
          </p>
          <p className="text-neutral-400 col-span-3">
            End Time: <span className="text-white">{booking.endTime}</span>
          </p>
          <p className="text-neutral-400 col-span-3">
            Cabin: <span className="text-white">{booking.cabin}</span>
          </p>{" "}
          <p className="text-neutral-400 col-span-6">
            Created at: <span className="text-white">{formattedCreatedAt}</span>
          </p>
          {booking.modifiedAt && (
            <p className="text-neutral-400 col-span-6">
              Modified at:{" "}
              <span className="text-white">
                {formatDateTime(booking.modifiedAt)}
              </span>
            </p>
          )}
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
