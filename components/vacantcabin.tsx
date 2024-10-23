import React, { useState, useEffect } from "react";
import { Order } from "@/scripts/interface";

interface VacantCabinDropdownProps {
  orders: { [key: string]: Order[] };
  slug: string;
}

// Define status types
type BaseStatus = {
  status: string;
  bgColor: string;
};

type VacantStatus = BaseStatus & {
  isVacant: true;
};

type OccupiedStatus = BaseStatus & {
  isVacant: false;
  totalOrders: number;
  minimumRequired: number;
  rank?: number; // Added rank property
};

type CabinStatus = VacantStatus | OccupiedStatus;

const VacantCabinDropdown: React.FC<VacantCabinDropdownProps> = ({
  orders,
  slug,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cabinStatuses, setCabinStatuses] = useState<{
    [key: string]: CabinStatus;
  }>({});

  const BASE_MINIMUM_ORDER = 150;
  const TIME_THRESHOLD_MINUTES = 60;

  useEffect(() => {
    const handleClick = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateCabinStatuses();
    }, 1000);

    return () => {
      document.removeEventListener("click", handleClick);
      clearInterval(timer);
    };
  }, [isOpen]);

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const getCabinOptions = (location: string) => {
    if (location === "dagapur") {
      return ["Cabin 1", "Cabin 2", "Cabin 3", "High Chair"];
    } else if (location === "sevoke") {
      return [
        "Cabin 4",
        "Cabin 5",
        "Cabin 6",
        "Cabin 7",
        "Cabin 8",
        "Cabin 9",
        "Cabin 10",
        "Cabin 11",
      ];
    }
    return [];
  };

  const availableCabins = getCabinOptions(slug);

  const occupiedCabins = Object.values(orders)
    .flat()
    .filter((order) => order.selectedCabin)
    .map((order) => order.selectedCabin);

  const vacantCabins = availableCabins.filter(
    (cabin) => !occupiedCabins.includes(cabin)
  );

  const getOldestOrderTime = (cabin: string) => {
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

  const getCabinOrderTotal = (cabin: string) => {
    return Object.values(orders)
      .flat()
      .filter((order) => order.selectedCabin === cabin)
      .reduce((sum, order) => sum + (order.total || 0), 0);
  };

  const formatElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor(
      (currentTime.getTime() - startTime.getTime()) / 1000
    );
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getMinimumOrderValue = (elapsedMinutes: number) => {
    const hoursElapsed = Math.floor(elapsedMinutes / 60);
    return BASE_MINIMUM_ORDER + hoursElapsed * 150;
  };

  const calculateRanks = (statuses: { [key: string]: CabinStatus }) => {
    // Get only occupied cabins and their ratios
    const occupiedStatuses = Object.entries(statuses)
      .filter(([_, status]) => !status.isVacant)
      .map(([cabin, status]) => ({
        cabin,
        status: status as OccupiedStatus,
        ratio:
          (status as OccupiedStatus).totalOrders /
          (status as OccupiedStatus).minimumRequired,
      }))
      .sort((a, b) => b.ratio - a.ratio); // Sort by ratio in descending order

    if (occupiedStatuses.length === 0) return;

    let currentRank = 1;
    let previousRatio = occupiedStatuses[0].ratio;
    let skippedRanks = 0;

    occupiedStatuses.forEach((item, index) => {
      if (item.ratio < previousRatio) {
        currentRank = index + 1 - skippedRanks;
        previousRatio = item.ratio;
      } else if (index > 0) {
        // Same ratio as previous, increment skipped ranks
        skippedRanks++;
      }
      (statuses[item.cabin] as OccupiedStatus).rank = currentRank;
    });
  };

  const getCabinStatus = (
    cabin: string,
    oldestOrderTime: Date | null
  ): CabinStatus => {
    if (!oldestOrderTime) {
      return { status: "Vacant", bgColor: "bg-green-500", isVacant: true };
    }

    const elapsedMinutes = Math.floor(
      (currentTime.getTime() - oldestOrderTime.getTime()) / (1000 * 60)
    );
    const totalOrders = getCabinOrderTotal(cabin);
    const minimumRequired = getMinimumOrderValue(elapsedMinutes);

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
      };
    }

    return {
      status: "Occupied",
      bgColor: "bg-yellow-500",
      isVacant: false,
      totalOrders,
      minimumRequired,
    };
  };

  const updateCabinStatuses = () => {
    const newStatuses: { [key: string]: CabinStatus } = {};

    availableCabins.forEach((cabin) => {
      const oldestOrderTime = getOldestOrderTime(cabin);
      newStatuses[cabin] = getCabinStatus(cabin, oldestOrderTime);
    });

    calculateRanks(newStatuses);
    setCabinStatuses(newStatuses);
  };

  // Initial status calculation
  useEffect(() => {
    updateCabinStatuses();
  }, [orders, slug]);

  return (
    <div className="relative mb-4 block w-full">
      <button
        onClick={toggleDropdown}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
      >
        {isOpen ? "Hide Cabin Status" : "Show Cabin Status"}
      </button>
      {isOpen && (
        <div className="absolute z-10 bg-neutral-800 text-white rounded-lg p-4 shadow-lg max-h-96 overflow-y-auto mt-2 w-full max-w-3xl">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Cabin Status</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {availableCabins.map((cabin) => {
              const status =
                cabinStatuses[cabin] ||
                getCabinStatus(cabin, getOldestOrderTime(cabin));

              return (
                <div key={cabin} className="flex items-center gap-2 min-w-0">
                  <span className="flex-shrink-0">{cabin}:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${status.bgColor}`}
                  >
                    {status.status}
                  </span>
                  {!status.isVacant && (
                    <>
                      <span className="px-2 py-1 rounded text-sm font-semibold bg-orange-500">
                        {formatElapsedTime(getOldestOrderTime(cabin)!)}
                      </span>
                      {/* <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500">
                        ₹{status.totalOrders}/₹{status.minimumRequired}
                      </span> */}
                       
                      {status.rank && (
                        <span className="px-2 py-1 rounded text-sm font-semibold bg-blue-500">
                           {status.rank}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VacantCabinDropdown;
