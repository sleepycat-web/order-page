import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Loader2, UserPen } from "lucide-react"; // Import Loader2
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Add Tabs imports

// Define the formatDate function for booking dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'dd MMMM yyyy') : "Invalid Date";
};

// Define the formatCreatedAt function for createdAt dates
   const formatDateTime = (dateString: string) => {
     const date = new Date(dateString);
     return format(date, "d MMMM yyyy 'at' h:mm a");
   };

// Define the BookingList component
const BookingList: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {bookings.map((booking) => {
        const formattedCreatedAt = formatDateTime(booking.createdAt);
        const formattedDate = formatDate(booking.date);

        return (
          <Card key={booking._id.$oid} className="bg-neutral-800 shadow-md">
            <CardHeader className="flex justify-between items-left">
              <div className="flex items-center">
                <CardTitle className="text-xl font-semibold text-white">
                  {booking.name}
                </CardTitle>
                <Button variant="ghost" className="ml-auto">
                  <UserPen />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2 mb-4">
                <p className="text-neutral-400 col-span-3">
                  Date: <span className="text-white">{formattedDate}</span>
                </p>
                <p className="text-neutral-400 col-span-3">
                  Location:{" "}
                  <span className="text-white">{booking.location}</span>
                </p>
                <p className="text-neutral-400 col-span-3">
                  Start Time:{" "}
                  <span className="text-white">{booking.startTime}</span>
                </p>
                <p className="text-neutral-400 col-span-3">
                  End Time:{" "}
                  <span className="text-white">{booking.endTime}</span>
                </p>
                <p className="text-neutral-400 col-span-6">
                  Created at:{" "}
                  <span className="text-white">{formattedCreatedAt}</span>
                </p>
                <div className="text-neutral-400 col-span-3">
                  Price:{" "}
                  <Badge className="text-sm">₹{booking.finalPrice}</Badge>
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
      })}
    </div>
  );
};

interface BookingsProps {
  slug: string;
  onClose: () => void; // Add onClose prop
}

interface Booking {
  _id: {
    $oid: string;
  };
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

const Bookings: React.FC<BookingsProps> = ({ slug, onClose }) => {
   const [bookings, setBookings] = useState<Booking[]>([]);
   const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today"); // Add activeTab state
   const [loading, setLoading] = useState<boolean>(false); // Add loading state

  const fetchBookings = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
       setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [slug]);

  // Add booking filters based on IST
  const today = new Date();
  const todayIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const formattedToday = format(todayIST, 'yyyy-MM-dd');

  const todayBookings = bookings.filter(booking => booking.date === formattedToday);
  const upcomingBookings = bookings.filter(booking => booking.date > formattedToday);

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
                  <BookingList bookings={todayBookings} />
                ) : (
                  <p className="text-left text-neutral-500  ">No bookings for today</p>
                )}
              </TabsContent>
              <TabsContent value="upcoming" className="flex-grow">
                {upcomingBookings.length > 0 ? (
                  <BookingList bookings={upcomingBookings} />
                ) : (
                  <p className="text-left text-neutral-500  ">No upcoming bookings</p>
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
