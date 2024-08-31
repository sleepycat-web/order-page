import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Location {
  name: string;
  coordinates: { latitude: number; longitude: number };
  radius: number;
}

interface LocationSelectorProps {
  onLocationSelect: (location: string, cabin: string) => void;
  selectedLocation: string;
  selectedCabin: string;
}

const locations: Location[] = [
  {
    name: "Dagapur",
    coordinates: { latitude: 26.749527184470193, longitude: 88.3937724490724 },
    radius: 1000,
  },
  {
    name: "Sevoke Road",
    coordinates: { latitude: 26.747152888772344, longitude: 88.43802366441821 },
    radius: 1000,
  },
];

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationSelect,
  selectedLocation,
  selectedCabin,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCabinDropdownOpen, setIsCabinDropdownOpen] = useState(false);
  const [locationDetected, setLocationDetected] = useState<boolean | null>(
    null
  );
  const [showManualInputMessage, setShowManualInputMessage] = useState(false);
  const [isLocationPromptVisible, setIsLocationPromptVisible] = useState(false);
const locationDropdownRef = useRef<HTMLDivElement>(null);
  const cabinDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        cabinDropdownRef.current &&
        !cabinDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCabinDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const detectLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocationPromptVisible(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocationPromptVisible(false);
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const nearbyLocation = locations.find((location) => {
            const distance = calculateDistance(
              userLat,
              userLon,
              location.coordinates.latitude,
              location.coordinates.longitude
            );
            return distance <= location.radius;
          });

          if (nearbyLocation) {
            onLocationSelect(nearbyLocation.name, "");
            setLocationDetected(true);
          } else {
            setLocationDetected(false);
          }
        },
        (error) => {
          setIsLocationPromptVisible(false);
          console.error("Error detecting location:", error);
          setLocationDetected(false);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLocationDetected(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (locationDetected === false) {
      setShowManualInputMessage(true);
      const timer = setTimeout(() => {
        setShowManualInputMessage(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [locationDetected]);

  const getCabinOptions = () => {
    if (selectedLocation === "Dagapur") {
      return ["Cabin 1", "Cabin 2", "Cabin 3", "High Chair"];
    } else if (selectedLocation === "Sevoke Road") {
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

  return (
    <>
      {isLocationPromptVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 p-6 rounded-lg ">
            <h2 className="text-xl font-bold mb-4">Enable Location Services</h2>
            <p className="mb-4">
              Please enable location services to automatically detect your
              location.
            </p>
            <button
              className="btn btn-primary mr-2 "
              onClick={() => {
                setIsLocationPromptVisible(false);
                detectLocation();
              }}
            >
              Enable Location
            </button>
            <button
              className="btn"
              onClick={() => setIsLocationPromptVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {locationDetected === true && (
        <p className="text-green-500 mb-4">Location detected successfully</p>
      )}
      {showManualInputMessage && (
        <p className="text-red-500 mb-4">
          Failed to detect location. Please input manually.
        </p>
      )}
      <div className="flex flex-row space-x-4 mt-4 sm:mt-0">
        <div className="relative" ref={locationDropdownRef}>
          <button
            className="btn text-left"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedLocation || "Select Location"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="ml-2 h-4 w-4 inline"
              fill="currentColor"
            >
              <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
            </svg>
          </button>
          {isDropdownOpen && (
            <ul className="menu bg-base-100 rounded-box absolute z-10 mt-1 p-2 w-52">
              {locations.map((location) => (
                <li key={location.name}>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLocationSelect(location.name, "");
                      setIsDropdownOpen(false);
                    }}
                  >
                    {location.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative" ref={cabinDropdownRef}>
          <button
            className={`btn text-left disabled:text-neutral-200/40 ${
              !selectedLocation ? "btn-disabled" : ""
            }`}
            onClick={() => setIsCabinDropdownOpen(!isCabinDropdownOpen)}
            disabled={!selectedLocation}
          >
            {selectedCabin || "Select Cabin"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="ml-2 h-4 w-4 inline"
              fill="currentColor"
            >
              <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
            </svg>
          </button>
          {isCabinDropdownOpen && selectedLocation && (
            <ul className="menu bg-base-100 rounded-box absolute z-10 mt-1 p-2 w-52">
              {getCabinOptions().map((cabin) => (
                <li key={cabin}>
                  <Link
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onLocationSelect(selectedLocation, cabin);
                      setIsCabinDropdownOpen(false);
                    }}
                  >
                    {cabin}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default LocationSelector;
