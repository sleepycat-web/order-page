"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Location {
  name: string;
  coordinates: { latitude: number; longitude: number };
  radius: number;
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

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");
  const [locationDetected, setLocationDetected] = useState<boolean | null>(null);
  const [showManualInputMessage, setShowManualInputMessage] = useState(false);
  const [isLocationPromptVisible, setIsLocationPromptVisible] = useState(false);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocationPromptVisible(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocationPromptVisible(false);
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          
          const nearbyLocation = locations.find(location => {
            const distance = calculateDistance(
              userLat,
              userLon,
              location.coordinates.latitude,
              location.coordinates.longitude
            );
            return distance <= location.radius;
          });

          if (nearbyLocation) {
            setSelectedLocation(nearbyLocation.name);
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

  const handleSubmit = async () => {
    if (!selectedLocation) return;

    const response = await fetch("/api/submitOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: selectedLocation }),
    });

    if (response.ok) {
      setOrderStatus("Order placed successfully!");
      setSelectedLocation("");
      setIsDropdownOpen(false);
    } else {
      setOrderStatus("Failed to submit order.");
    }
  };

  return (
    <main className="p-4">
      {isLocationPromptVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Enable Location Services</h2>
            <p className="mb-4">Please enable location services to automatically detect your location.</p>
            <button 
              className="btn btn-primary mr-2" 
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
        <p className="text-red-500 mb-4">Failed to detect location. Please input manually.</p>
      )}
      <div className="mb-4">
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
          <ul className="menu bg-base-100 rounded-box mt-1 p-2 w-52 ">
            {locations.map((location) => (
              <li key={location.name}>
                <a
                  onClick={() => {
                    setSelectedLocation(location.name);
                    setIsDropdownOpen(false);
                  }}
                >
                  {location.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="btn" onClick={handleSubmit}>
        Submit
      </button>
      {orderStatus && (
        <p className={`mt-4 ${orderStatus.includes("successfully") ? "text-green-500" : "text-red-500"}`}>
          {orderStatus}
        </p>
      )}
    </main>
  );
}

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