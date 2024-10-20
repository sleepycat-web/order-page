import React, { useState, useEffect } from "react";
import { Order } from "@/scripts/interface";

interface VacantCabinDropdownProps {
  orders: { [key: string]: Order[] };
  slug: string;
}

const VacantCabinDropdown: React.FC<VacantCabinDropdownProps> = ({
  orders,
  slug,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleClick = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
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

  return (
    <div className="relative mb-4 block w-full">
      <button
        onClick={toggleDropdown}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
      >
        {isOpen ? "Hide Cabin Status" : "Show Cabin Status"}
      </button>
      {isOpen && (
        <div className="absolute z-10 bg-neutral-800 text-white rounded-lg p-4 shadow-lg max-h-96 overflow-y-auto mt-2 w-full max-w-lg">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Cabin Status</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {availableCabins.map((cabin) => {
              const isVacant = vacantCabins.includes(cabin);
              const oldestOrderTime = getOldestOrderTime(cabin);
              return (
                <div
                  key={cabin}
                  className="flex items-center space-x-2 whitespace-nowrap overflow-hidden"
                >
                  <span className="flex-shrink-0">{cabin}:</span>
                  <span
                    className={`px-2 py-1 rounded ${
                      isVacant ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {isVacant ? "Vacant" : "Occupied"}
                  </span>
                  {!isVacant && oldestOrderTime && (
                    <span className="px-2 py-1 rounded bg-orange-500">
                      {formatElapsedTime(oldestOrderTime)}
                    </span>
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
