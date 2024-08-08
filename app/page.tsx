"use client";
import { menuItems } from '../scripts/menu'; // Adjust the import path as needed
import { useState, useEffect } from "react";
import Image from "next/image";
import Popup from '@/components/popup';

interface Location {
  name: string;
  coordinates: { latitude: number; longitude: number };
  radius: number;
}

export interface MenuItem {
  name: string;
  price: string;
  description?: string;
  soldOut?: boolean;
  customizationOptions?: CustomizationOption[];
}

export interface CustomizationOption {
  name: string;
  type: "radio" | "checkbox";
  options: {
    label: string;
    price?: string;
  }[];
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

const MenuItem: React.FC<MenuItem> = ({ name, price, description, soldOut }) => (
  <div className="p-4 bg-neutral-950 rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className={`text-xl ${soldOut ? 'text-red-500' : 'text-green-600'}`}>
      ₹{price} {soldOut && 'Sold Out'}
    </p>
    {description && <p className="text-sm text-gray-600"> {description}</p>}
  </div>
);

const Menu: React.FC<{ items: MenuItem[] }> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
  };

  const handleAddToOrder = (
    item: MenuItem,
    selectedOptions: Record<string, string[]>,
    quantity: number
  ) => {
    // Implement your logic to add the item to the order
    console.log("Added to order:", item, selectedOptions, quantity);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
      {items.map((item, index) => (
        <div key={index} onClick={() => handleItemClick(item)}>
          <MenuItem {...item} />
        </div>
      ))}
      {selectedItem && (
        <Popup
          item={selectedItem}
          onClose={handleClosePopup}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </div>
  );
};

export interface PopupProps {
  item: MenuItem;
  onClose: () => void;
  onAddToOrder: (
    item: MenuItem,
    selectedOptions: Record<string, string[]>,
    quantity: number
  ) => void;
}

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
    <main className=" p-4">

      
      <details className="dropdown">
        <summary className="btn mb-2">
          Select Cabin{" "}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            className="ml-2 h-4 w-4 inline"
            fill="currentColor"
          >
            <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
          </svg>
        </summary>
        <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
          <li>
            <a>Cabin 1</a>
          </li>
          <li>
            <a>Cabin 2</a>
          </li>
          <li>
            <a>Cabin 3</a>
          </li>
          <li>
            <a>Cabin 4</a>
          </li>
          <li>
            <a>Cabin 5</a>
          </li>
          <li>
            <a>Cabin 6</a>
          </li>
          <li>
            <a>Cabin 7</a>
          </li>
          <li>
            <a>Cabin 8</a>
          </li>
          <li>
            <a>Cabin 9</a>
          </li>
          <li>
            <a>Cabin 10</a>
          </li>
          <li>
            <a>Cabin 11</a>
          </li>
          <li>
            <a>High Chair</a>
          </li>
        </ul>
      </details>

      {isLocationPromptVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Enable Location Services</h2>
            <p className="mb-4">
              Please enable location services to automatically detect your
              location.
            </p>
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
        <p className="text-red-500 mb-4">
          Failed to detect location. Please input manually.
        </p>
      )}
    <div className="relative mb-4">
  <button
    className="btn text-left "
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
    <ul className="menu bg-base-100 rounded-box shadow-lg absolute z-10 mt-1 p-2 w-52">
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
      {orderStatus && (
        <p
          className={`mt-4 ${
            orderStatus.includes("successfully")
              ? "text-green-500"
              : "text-red-500"
          }`}
        >
          {orderStatus}
        </p>
      )}

      <Menu items={menuItems} />
      <button className="btn my-8" onClick={handleSubmit}>
        Submit
      </button>
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