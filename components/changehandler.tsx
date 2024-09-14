import React, { useEffect, useState, useRef } from "react";

interface Order {
  _id: string;
  load: string;
  // Add other relevant fields
}

interface ChangeHandlerProps {
  slug: string;
}

const ChangeHandler: React.FC<ChangeHandlerProps> = ({ slug }) => {
  const [processedOrders, setProcessedOrders] = useState<Order[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const checkAndUpdateOrders = async () => {
      try {
        const response = await fetch("/api/handleChange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug }),
        });

        if (!response.ok) {
          throw new Error("Failed to process orders");
        }

        const { processedOrders }: { processedOrders: Order[] } =
          await response.json();

        if (processedOrders.length > 0) {
          setProcessedOrders((prev) => [...prev, ...processedOrders]);
          playAlarm();
          processedOrders.forEach((order) => {
            sendNotification(order);
          });
        }
      } catch (error) {
        console.error("Error processing orders:", error);
      }
    };

    const intervalId = setInterval(checkAndUpdateOrders, 3000);

    return () => clearInterval(intervalId);
  }, [slug]);

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  const sendNotification = (order: Order) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Order Received", {
        body: `1 new order has been placed`,
      });
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div style={{ display: "none" }}>
      <audio ref={audioRef} src="/alarm.mp3" />
    </div>
  );
};

export default ChangeHandler;
