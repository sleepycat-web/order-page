import React, { useState, Dispatch, SetStateAction, useEffect } from "react";
import { Order } from "@/scripts/interface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";

interface OrderSearchProps {
  orders: Order[];
  payLaterOrders: Order[]; // Add payLaterOrders prop
  setActiveTab: (tab: "new" | "active" | "previous") => void;
  orderRefs: React.MutableRefObject<{
    [key: string]: React.RefObject<HTMLDivElement>;
  }>;
  setHighlightedOrderId: Dispatch<SetStateAction<string | null>>;
  setPayLaterExpanded: Dispatch<SetStateAction<boolean>>;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
  orders,
  payLaterOrders,
  setActiveTab,
  orderRefs,
  setHighlightedOrderId,
  setPayLaterExpanded,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const currentDate = new Date().setHours(0, 0, 0, 0);

    // Combine orders and payLaterOrders
    const allOrders = [...orders, ...payLaterOrders];

    const foundOrder = allOrders.find((order) => {
      const nameMatch = order.customerName
        .toLowerCase()
        .includes(normalizedSearchTerm);
      const phoneMatch = order.phoneNumber
        .toLowerCase()
        .includes(normalizedSearchTerm);
      const fuzzyMatch =
        order.customerName.toLowerCase().length > 2 &&
        normalizedSearchTerm.length > 2 &&
        order.customerName
          .toLowerCase()
          .includes(normalizedSearchTerm.slice(0, 3));
      return nameMatch || phoneMatch || fuzzyMatch;
    });

    if (foundOrder) {
      let tabToSet: "new" | "active" | "previous";
      const orderDate = new Date(foundOrder.createdAt).setHours(0, 0, 0, 0);

      if (orderDate < currentDate || payLaterOrders.includes(foundOrder)) {
        tabToSet = "previous";
        setPayLaterExpanded(true); // Expand Pay Later section
      } else if (
        foundOrder.status === "fulfilled" &&
        foundOrder.order === "dispatched"
      ) {
        tabToSet = "previous";
      } else if (
        foundOrder.order === "dispatched" &&
        foundOrder.status !== "fulfilled"
      ) {
        tabToSet = "active";
      } else {
        tabToSet = "new";
      }

      setActiveTab(tabToSet);
      setHighlightedOrderId(foundOrder._id);

      // Ensure the pay later section expands if it's a previous order
      if (tabToSet === "previous") {
        setTimeout(() => {
          setPayLaterExpanded(true);
        }, 100);
      }

      setTimeout(() => {
        const orderElement = orderRefs.current[foundOrder._id]?.current;
        if (orderElement) {
          orderElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 200);
    } else {
      setShowModal(true);
    }
  };

  // Add this useEffect to log when orders change
  useEffect(() => {}, [orders]);

  return (
    <>
      <form
        onSubmit={handleSearch}
        className="flex items-center w-full md:w-auto"
      >
        <Input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-blue-400 text-white placeholder-white w-full md:w-80"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={!searchTerm.trim()}
          className="ml-2"
        >
          <Search className="h-5 w-5 text-white" />
        </Button>
      </form>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Order Not Found</DialogTitle>
            <DialogDescription>
              No order found with the given details.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowModal(false)} className="mt-4">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderSearch;
