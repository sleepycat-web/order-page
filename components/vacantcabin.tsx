import React, { useState, useEffect, useMemo } from "react";
import { Order } from "@/scripts/interface";

interface VacantCabinDropdownProps {
  orders: { [key: string]: Order[] };
  slug: string;
  oldOrders: Order[];
}

type BaseStatus = {
  status: string;
  bgColor: string;
};

type VacantStatus = BaseStatus & {
  isVacant: true;
  lastFulfilledTime?: string;
};

type OccupiedStatus = BaseStatus & {
  isVacant: false;
  totalOrders: number;
  minimumRequired: number;
  rank?: number;
};

type CabinStatus = VacantStatus | OccupiedStatus;

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

  const getCabinOptions = () => {
    if (slug === "dagapur") {
      return ["Cabin 1", "Cabin 2", "Cabin 3", "High Chair"];
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
      ];
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

  // Keep useMemo for occupiedCabins since it involves potentially expensive array operations
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
      .filter(([_, status]) => !status.isVacant)
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

  const getCabinStatus = (
    cabin: string,
    oldestOrderTime: Date | null
  ): CabinStatus => {
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
    const cabinOptions = getCabinOptions();

    cabinOptions.forEach((cabin) => {
      const oldestOrderTime = getOldestOrderTime(cabin);
      newStatuses[cabin] = getCabinStatus(cabin, oldestOrderTime);
    });

    calculateRanks(newStatuses);
    setCabinStatuses(newStatuses);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
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

  useEffect(() => {
    updateCabinStatuses();
  }, [orders, slug]);

  const toggleDropdown = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

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
            {getCabinOptions().map((cabin) => {
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
                  {status.isVacant && status.lastFulfilledTime && (
                    <span className="px-2 py-1 rounded text-sm font-semibold bg-orange-500">
                      {formatElapsedTime(status.lastFulfilledTime)}
                    </span>
                  )}
                  {!status.isVacant && (
                    <>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-500">
                        ₹{status.totalOrders}
                      </span>
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
