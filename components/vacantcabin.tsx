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

  useEffect(() => {
    const handleClick = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
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

  return (
    <div className="relative mb-4 block w-full">
      <button
        onClick={toggleDropdown}
        className="bg-blue-500 text-white py-2 px-4 rounded-lg"
      >
        {isOpen ? "Hide Cabin Status" : "Show Cabin Status"}
      </button>
      {isOpen && (
        <div className="absolute z-10 bg-neutral-800 text-white rounded-lg p-4 shadow-lg max-h-60 overflow-y-auto mt-2 w-96">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Cabin Status</h3>
          </div>
          <div className="flex flex-wrap -mx-2">
            {availableCabins.map((cabin) => (
              <div key={cabin} className="w-1/2 px-2 mb-2">
                <div className="py-1">
                  {cabin}:{" "}
                  <span
                    className={`p-1 rounded ${
                      vacantCabins.includes(cabin)
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {vacantCabins.includes(cabin) ? "Vacant" : "Occupied"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VacantCabinDropdown;
