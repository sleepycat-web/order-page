import React, { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alertloc";

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
      return ["Cabin 1", "Cabin 2", "Cabin 3", "High Chair 1", "High Chair 2", "High Chair 3", "High Chair 4"];
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
      <Dialog
        open={isLocationPromptVisible}
        onOpenChange={setIsLocationPromptVisible}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Location Services</DialogTitle>
            <DialogDescription>
              Please enable location services to automatically detect your
              location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsLocationPromptVisible(false);
                detectLocation();
              }}
            >
              Enable Location
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsLocationPromptVisible(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {locationDetected === true && (
        <Alert variant="default" className="mb-4">
          <AlertDescription>Location detected successfully</AlertDescription>
        </Alert>
      )}

      {showManualInputMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to detect location. Please input manually.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-row space-x-4 mt-4 sm:mt-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {selectedLocation || "Select Location"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {locations.map((location) => (
              <DropdownMenuItem
                key={location.name}
                onSelect={() => onLocationSelect(location.name, "")}
              >
                {location.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!selectedLocation}>
              {selectedCabin || "Select Cabin"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {getCabinOptions().map((cabin) => (
              <DropdownMenuItem
                key={cabin}
                onSelect={() => onLocationSelect(selectedLocation, cabin)}
              >
                {cabin}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
  const Δλ = ((lon1 - lon2) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default LocationSelector;
