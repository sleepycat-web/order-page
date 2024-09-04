import React, { useState, Dispatch, SetStateAction } from 'react';
import { Order } from "@/scripts/interface";



interface OrderSearchProps {
  orders: Order[];
  setActiveTab: (tab: "new" | "active" | "previous") => void;
  orderRefs: React.MutableRefObject<{
    [key: string]: React.RefObject<HTMLDivElement>;
  }>;
  setHighlightedOrderId: Dispatch<SetStateAction<string | null>>;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
  orders,
  setActiveTab,
  orderRefs,
  setHighlightedOrderId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;

    const normalizedSearchTerm = searchTerm.toLowerCase();

    const foundOrder = orders.find(
      (order) =>
        order.customerName.toLowerCase().includes(normalizedSearchTerm) ||
        order.phoneNumber.includes(normalizedSearchTerm)
    );

    if (foundOrder) {
      let tabToSet: "new" | "active" | "previous";
      if (
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

      setTimeout(() => {
        const orderElement = orderRefs.current[foundOrder._id]?.current;
        if (orderElement) {
          orderElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } else {
      setShowModal(true);
      setTimeout(() => setShowModal(false), 5000);
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="mb-4 flex items-center">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input bg-neutral-800 mr-2 text-white"
        />
        <button
          type="submit"
          className="btn btn-ghost btn-circle"
          disabled={!searchTerm.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="h-5 w-5 fill-white"
          >
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
          </svg>
        </button>
      </form>
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-neutral-800">
            <h3 className="font-bold text-lg">Order Not Found</h3>
            <p className="py-4">No order found with the given details.</p>
            <div className="modal-action">
              <button
                className="btn btn-primary text-black"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderSearch;