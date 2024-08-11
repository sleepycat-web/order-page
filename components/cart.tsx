import React from "react";
import { CartItem } from "../app/page"; // Adjust the import path as needed

interface CartProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onToggle: () => void;
  isOpen: boolean;
}

const Cart: React.FC<CartProps> = ({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onToggle,
  isOpen,
}) => {
  return (
    <>
      {!isOpen && (
        <div
          className="fixed top-4 right-4 z-50 cursor-pointer"
          onClick={onToggle}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 576 512"
            className="w-6 h-6 fill-current"
          >
            <path d="M0 24C0 10.7 10.7 0 24 0L69.5 0c22 0 41.5 12.8 50.6 32l411 0c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3l-288.5 0 5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5L488 336c13.3 0 24 10.7 24 24s-10.7 24-24 24l-288.3 0c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5L24 48C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
          </svg>
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {items.length}
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-neutral-900 z-40 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Cart</h2>
              <button onClick={onToggle} className="text-3xl">
                &times;
              </button>
            </div>
            {items.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <ul className="space-y-6">
                {items.map((item, index) => (
                  <li key={index} className="border-b border-gray-700 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow space-y-2">
                        <h3 className="font-semibold text-lg">
                          {item.item.name}
                        </h3>
                        <div className="flex items-center mt-2">
                          <button
                            onClick={() =>
                              onUpdateQuantity(index, item.quantity - 1)
                            }
                            className="btn btn-sm mr-2"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="mx-2">
                            Quantity: {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(index, item.quantity + 1)
                            }
                            className="btn btn-sm ml-2"
                          >
                            +
                          </button>
                        </div>
                        <div className="mt-2 flex items-center">
                          <span className="mr-2">Price:</span>
                          <div className="px-2 py-1 bg-blue-600 rounded text-white font-semibold">
                            ₹{(item.totalPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        {Object.entries(item.selectedOptions).map(
                          ([optionName, values]) => (
                            <div key={optionName} className="mt-1">
                              <span className="text-sm text-gray-400">
                                {optionName}:{" "}
                              </span>
                              {values.map((value) => (
                                <span
                                  key={value}
                                  className="text-sm mr-2 px-2 py-1 rounded bg-blue-600 text-white"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          )
                        )}
                        {item.specialRequests && (
                          <p className="text-sm text-gray-400 mt-1">
                            Special: {item.specialRequests}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
