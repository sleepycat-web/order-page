import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Order } from "@/scripts/interface";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { utcToZonedTime } from "date-fns-tz";
import { format } from "date-fns"; // Import 'format'

// Define the Booking interface
interface Booking {
  _id: any; // Adjust type if necessary
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  cabin: string;
  finalPrice: number;
  name: string;
  phone: string;
  promoCode?: {
    code: string;
    percentage: number;
  };
  createdAt: any; // Adjust type if necessary
  bookingStartDateTime: Date;
  bookingEndDateTime: Date;
}

interface VacantCabinDropdownProps {
  orders: { [key: string]: Order[] };
  slug: string;
  oldOrders: Order[];
}

type BaseStatus = {
  status: string;
  bgColor: string;
  isBooked?: boolean;
};

type VacantStatus = BaseStatus & {
  isVacant: true;
  lastFulfilledTime?: string;
  rank?: number;
};

type OccupiedStatus = BaseStatus & {
  isVacant: false;
  totalOrders: number;
  minimumRequired: number;
  rank?: number;
  hasUndispatchedOrders?: boolean;
};

type CabinStatus = (VacantStatus | OccupiedStatus) & {
  nextBookingInMinutes?: number;
};

const BASE_MINIMUM_ORDER = 150;
const TIME_THRESHOLD_MINUTES = 60;

const VacantCabinDropdown: React.FC<VacantCabinDropdownProps> = ({
  orders,
  slug,
  oldOrders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [cabinStatuses, setCabinStatuses] = useState<{
    [key: string]: CabinStatus;
  }>({});
  const [bookings, setBookings] = useState<Booking[]>([]); // Add type annotation

  // Move fetchBookings outside of useEffect and wrap with useCallback
  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/getBookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug }),
      });
      const data = await response.json();
      const istTimeZone = "Asia/Kolkata";
      // Parse dates and times in IST
      const parsedBookings = data.map((booking: Booking) => {
        // Type 'booking' parameter
        const bookingStartDateTime = utcToZonedTime(
          new Date(`${booking.date}T${booking.startTime}`),
          istTimeZone
        );
        const bookingEndDateTime = utcToZonedTime(
          new Date(`${booking.date}T${booking.endTime}`),
          istTimeZone
        );
        return {
          ...booking,
          bookingStartDateTime,
          bookingEndDateTime,
        };
      });
      setBookings(parsedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, [slug]);

  // New useEffect to fetch bookings when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen, fetchBookings]);

  const isHighChair = (cabin: string): boolean => {
    return cabin.toLowerCase().startsWith("high chair");
  };

  const getCabinOptions = () => {
    if (slug === "dagapur") {
      return [
        "Cabin 1",
        "Cabin 2",
        "Cabin 3",
        "High Chair 1",
        "High Chair 2",
        "High Chair 3",
        "High Chair 4",
      ].sort((a, b) => {
        // Don't include high chairs in ranking sort
        if (isHighChair(a) && isHighChair(b)) return a.localeCompare(b);
        if (isHighChair(a)) return 1; // Move high chairs to the end
        if (isHighChair(b)) return -1; // Move high chairs to the end

        const aStatus = cabinStatuses[a] || {
          isVacant: true,
          bgColor: "bg-green-500",
        };
        const bStatus = cabinStatuses[b] || {
          isVacant: true,
          bgColor: "bg-green-500",
        };

        if (!aStatus.isVacant && bStatus.isVacant) return -1;
        if (aStatus.isVacant && !bStatus.isVacant) return 1;

        if (aStatus.rank && bStatus.rank) {
          return aStatus.rank - bStatus.rank;
        } else if (aStatus.rank) {
          return -1;
        } else if (bStatus.rank) {
          return 1;
        }

        return a.localeCompare(b);
      });
    } else if (slug === "sevoke") {
      return [
        "Cabin 4",
        "Cabin 5",
        "Cabin 6",
        "Cabin 7",
        "Cabin 8",
        "Cabin 9",
        "Cabin 10",
        "Cabin 11",
      ].sort((a, b) => {
        const aStatus = cabinStatuses[a] || {
          isVacant: true,
          bgColor: "bg-green-500",
        };
        const bStatus = cabinStatuses[b] || {
          isVacant: true,
          bgColor: "bg-green-500",
        };

        if (!aStatus.isVacant && bStatus.isVacant) return -1;
        if (aStatus.isVacant && !bStatus.isVacant) return 1;

        if (aStatus.rank && bStatus.rank) {
          return aStatus.rank - bStatus.rank;
        } else if (aStatus.rank) {
          return -1;
        } else if (bStatus.rank) {
          return 1;
        }

        return a.localeCompare(b);
      });
    }
    return [];
  };
  const getValidOldOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return oldOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return (
        orderDate.getTime() === today.getTime() &&
        order.order !== "rejected" &&
        order.status !== "rejected"
      );
    });
  };

  const hasUndispatchedOrders = (cabin: string): boolean => {
    return Object.values(orders)
      .flat()
      .some(
        (order) => order.selectedCabin === cabin && order.order === "pending"
      );
  };

  const getLastFulfilledTime = (cabin: string): string | undefined => {
    const validOldOrders = getValidOldOrders();

    const cabinOrders = validOldOrders.filter(
      (order) =>
        order.selectedCabin === cabin &&
        order.status === "fulfilled" &&
        order.fulfilledAt
    );

    if (cabinOrders.length === 0) return undefined;

    const fulfilledTimes = cabinOrders
      .map((order) => {
        if (!order.fulfilledAt) return null;
        return new Date(order.fulfilledAt).toISOString();
      })
      .filter((date): date is string => date !== null);

    if (fulfilledTimes.length === 0) return undefined;

    return fulfilledTimes.reduce((latest, current) =>
      latest > current ? latest : current
    );
  };

  const occupiedCabins = useMemo(() => {
    return Object.values(orders)
      .flat()
      .filter((order) => order.selectedCabin)
      .map((order) => order.selectedCabin);
  }, [orders]);

  const getOldestOrderTime = (cabin: string): Date | null => {
    const cabinOrders = Object.values(orders)
      .flat()
      .filter((order) => order.selectedCabin === cabin);

    if (cabinOrders.length === 0) return null;

    return new Date(
      Math.min(
        ...cabinOrders.map((order) => new Date(order.createdAt).getTime())
      )
    );
  };

  const getCabinOrderTotal = (cabin: string): number => {
    return Object.values(orders)
      .flat()
      .filter((order) => order.selectedCabin === cabin)
      .reduce((sum, order) => sum + (order.total || 0), 0);
  };

  const getMinimumOrderValue = (elapsedMinutes: number): number => {
    const hoursElapsed = Math.floor(elapsedMinutes / 60);
    return BASE_MINIMUM_ORDER + hoursElapsed * 150;
  };

  const calculateRanks = (statuses: { [key: string]: CabinStatus }) => {
    const occupiedStatuses = Object.entries(statuses)
      .filter(([_, status]) => !status.isVacant && !status.isBooked) // Exclude booked cabins
      .map(([cabin, status]) => ({
        cabin,
        status: status as OccupiedStatus,
        ratio:
          (status as OccupiedStatus).totalOrders /
          (status as OccupiedStatus).minimumRequired,
      }))
      .sort((a, b) => a.ratio - b.ratio);

    if (occupiedStatuses.length === 0) return;

    let currentRank = 1;
    let previousRatio = occupiedStatuses[0].ratio;
    let skippedRanks = 0;

    occupiedStatuses.forEach((item, index) => {
      if (item.ratio > previousRatio) {
        currentRank = index + 1 - skippedRanks;
        previousRatio = item.ratio;
      } else if (index > 0) {
        skippedRanks++;
      }
      (statuses[item.cabin] as OccupiedStatus).rank = currentRank;
    });
  };

  const formatElapsedTime = (startTimeStr: string): string => {
    const startTime = new Date(startTimeStr);
    const elapsed = Math.floor(
      (currentTime.getTime() - startTime.getTime()) / 1000
    );
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getCabinStatus = useCallback(
    (cabin: string, oldestOrderTime: Date | null): CabinStatus => {
      // Check if cabin is booked
      const now = utcToZonedTime(new Date(), "Asia/Kolkata");
      const isCabinBooked = bookings.some((booking: Booking) => {
        if (booking.cabin !== cabin) return false;
        return (
          now >= booking.bookingStartDateTime &&
          now <= booking.bookingEndDateTime
        );
      });

      if (isCabinBooked) {
        // Find the relevant booking
        const now = utcToZonedTime(new Date(), "Asia/Kolkata");
        const currentBooking = bookings.find((booking: Booking) => {
          if (booking.cabin !== cabin) return false;
          return (
            now >= booking.bookingStartDateTime &&
            now <= booking.bookingEndDateTime
          );
        });

        // Format endTime to 12-hour format with am/pm
        let formattedEndTime = "";
        if (currentBooking) {
          const endTimeDate = utcToZonedTime(
            new Date(`${currentBooking.date}T${currentBooking.endTime}`),
            "Asia/Kolkata"
          );
          formattedEndTime = format(endTimeDate, "h:mm a");
        }

        // Find all bookings for the cabin sorted by start time
        const futureBookings = bookings
          .filter((booking) => booking.cabin === cabin)
          .sort(
            (a, b) =>
              new Date(a.bookingStartDateTime).getTime() -
              new Date(b.bookingStartDateTime).getTime()
          );

        // Find the index of the current booking
        const currentBookingIndex = futureBookings.findIndex(
          (booking) =>
            now >= booking.bookingStartDateTime &&
            now <= booking.bookingEndDateTime
        );

        let nextBookingInMinutes: number | undefined = undefined;
        if (
          currentBookingIndex !== -1 &&
          futureBookings.length > currentBookingIndex + 1
        ) {
          const nextBooking = futureBookings[currentBookingIndex + 1];
          const timeDifference = Math.floor(
            (nextBooking.bookingStartDateTime.getTime() - now.getTime()) / 60000
          );
          nextBookingInMinutes =
            timeDifference > 0 ? timeDifference : undefined;
        }

        // Check if there are no orders for this cabin
        const cabinOrders = Object.values(orders)
          .flat()
          .filter((order) => order.selectedCabin === cabin);

        const totalOrders = getCabinOrderTotal(cabin); // Calculate total orders

        if (cabinOrders.length === 0) {
          // No orders, set status as Vacant (Booked till endTime)
          return {
            status: `Vacant (Booked till ${formattedEndTime})`,
            bgColor: "bg-blue-500",
            isVacant: true,
            isBooked: true, // Set isBooked to true
            nextBookingInMinutes, // Add next booking time
          };
        } else {
          // Orders exist, set status as Occupied (Booked till endTime) with actual totalOrders
          return {
            status: `Occupied (Booked till ${formattedEndTime})`,
            bgColor: "bg-blue-500",
            isVacant: false,
            isBooked: true, // Set isBooked to true
            totalOrders, // Set to actual total orders
            minimumRequired: 0,
            nextBookingInMinutes, // Add next booking time
          };
        }
      }

      if (isHighChair(cabin)) {
        if (!oldestOrderTime) {
          const lastFulfilledTime = getLastFulfilledTime(cabin);
          return {
            status: "Vacant",
            bgColor: "bg-green-500",
            isVacant: true,
            ...(lastFulfilledTime ? { lastFulfilledTime } : {}),
          };
        }
        return {
          status: "Occupied",
          bgColor: "bg-yellow-500",
          isVacant: false,
          totalOrders: 0, // Not displayed for high chairs
          minimumRequired: 0, // Not displayed for high chairs
        };
      }

      if (!oldestOrderTime) {
        const lastFulfilledTime = getLastFulfilledTime(cabin);
        return {
          status: "Vacant",
          bgColor: "bg-green-500",
          isVacant: true,
          ...(lastFulfilledTime ? { lastFulfilledTime } : {}),
        };
      }

      const elapsedMinutes = Math.floor(
        (currentTime.getTime() - oldestOrderTime.getTime()) / (1000 * 60)
      );
      const totalOrders = getCabinOrderTotal(cabin);
      const minimumRequired = getMinimumOrderValue(elapsedMinutes);
      const hasUndispatched = hasUndispatchedOrders(cabin);

      // After all conditions, check for next booking
      const futureBookings = bookings
        .filter((booking) => booking.cabin === cabin)
        .sort(
          (a, b) =>
            new Date(a.bookingStartDateTime).getTime() -
            new Date(b.bookingStartDateTime).getTime()
        );

      const nextBooking = futureBookings.find(
        (booking) => booking.bookingStartDateTime > now
      );

      let nextBookingInMinutes: number | undefined = undefined;
      if (nextBooking) {
        const timeDifference = Math.floor(
          (nextBooking.bookingStartDateTime.getTime() - now.getTime()) / 60000
        );
        nextBookingInMinutes = timeDifference > 0 ? timeDifference : undefined;
      }

      if (
        elapsedMinutes > TIME_THRESHOLD_MINUTES &&
        totalOrders < minimumRequired
      ) {
        return {
          status: "Occupied (Critical)",
          bgColor: "bg-red-500",
          isVacant: false,
          totalOrders,
          minimumRequired,
          hasUndispatchedOrders: hasUndispatched,
          nextBookingInMinutes, // Add next booking time
        };
      }

      return {
        status: "Occupied",
        bgColor: "bg-yellow-500",
        isVacant: false,
        totalOrders,
        minimumRequired,
        hasUndispatchedOrders: hasUndispatched,
        nextBookingInMinutes, // Add next booking time
      };
    },
    [currentTime, bookings, orders] // Include 'orders' in dependencies
  );

  const updateCabinStatuses = useCallback(() => {
    const newStatuses: { [key: string]: CabinStatus } = {};
    const cabinOptions = getCabinOptions();

    cabinOptions.forEach((cabin) => {
      const oldestOrderTime = getOldestOrderTime(cabin);
      newStatuses[cabin] = getCabinStatus(cabin, oldestOrderTime);
    });

    calculateRanks(newStatuses);
    setCabinStatuses(newStatuses);
  }, [getCabinStatus, orders, slug]); // Add orders and slug as dependencies

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Separate timer for updating currentTime

  // Separate effect for updating cabin statuses when time changes
  useEffect(() => {
    updateCabinStatuses();
  }, [currentTime, updateCabinStatuses, bookings]); // Include bookings

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          className="mb-4 text-white py-2 px-4 rounded-lg"
          onClick={toggleDropdown}
        >
          {isOpen ? "Hide Cabin Status" : "Show Cabin Status"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mb-4 bg-neutral-800 text-white p-4">
        <div className="mb-4">
          <h3 className="font-bold text-lg">Cabin Status</h3>
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-x-4 gap-y-2">
          {getCabinOptions().map((cabin) => {
            const status =
              cabinStatuses[cabin] ||
              getCabinStatus(cabin, getOldestOrderTime(cabin));
            const isHighChairCabin = isHighChair(cabin);

            return (
              <div key={cabin} className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 text-lg">{cabin}:</span>
                <Badge
                  variant="accent"
                  className={`${status.bgColor} text-base text-white`}
                >
                  {status.status}
                </Badge>
                {/* Show price badge regardless of booking status */}
                {!status.isVacant && (
                  <Badge
                    variant="accent"
                    className="bg-purple-500 text-base text-white"
                  >
                    ₹{status.totalOrders}
                  </Badge>
                )}
                {/* Show next booking badge if exists and is 20 minutes or less */}
                {status.nextBookingInMinutes !== undefined &&
                  status.nextBookingInMinutes <= 20 && (
                    <Badge
                      variant="accent"
                      className="bg-white text-base text-black"
                    >
                      Booking in {status.nextBookingInMinutes} minutes
                    </Badge>
                  )}
                {!status.isVacant &&
                  !status.isBooked && ( // Exclude booked cabins from rankings and related badges
                    <>
                      {!isHighChairCabin && (
                        <>
                          <Badge
                            variant="accent"
                            className="bg-orange-500 text-base text-white"
                          >
                            {formatElapsedTime(
                              getOldestOrderTime(cabin)!.toISOString()
                            )}
                          </Badge>
                          {status.rank && (
                            <Badge
                              variant="accent"
                              className="bg-blue-500 text-base text-white"
                            >
                              {status.rank}
                            </Badge>
                          )}
                        </>
                      )}
                      {status.hasUndispatchedOrders && (
                        <Badge
                          variant="accent"
                          className="bg-teal-500 text-base text-white"
                        >
                          R
                        </Badge>
                      )}
                    </>
                  )}
                {/* ...existing code... */}
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VacantCabinDropdown;
