import React, { useState, useEffect, useRef } from "react";
import { MenuItem, CustomizationOption } from "../app/page"; // Adjust the import path as needed

interface PopupProps {
  item: MenuItem;
  onClose: () => void;
  onAddToOrder: (
    item: MenuItem,
    selectedOptions: Record<string, string[]>,
    quantity: number,
    specialRequests: string
  ) => void;
}


const Popup: React.FC<PopupProps> = ({ item, onClose, onAddToOrder }) => {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const popupRef = useRef<HTMLDivElement>(null); 

  const handleOptionChange = (
    optionName: string,
    value: string,
    type: "radio" | "checkbox"
  ) => {
    setSelectedOptions((prev: Record<string, string[]>) => {
      const newOptions = { ...prev };
      if (type === "radio") {
        newOptions[optionName] = [value];
      } else if (type === "checkbox") {
        if (!newOptions[optionName]) {
          newOptions[optionName] = [];
        }
        const index = newOptions[optionName].indexOf(value);
        if (index > -1) {
          newOptions[optionName] = newOptions[optionName].filter(
            (item) => item !== value
          );
        } else {
          newOptions[optionName] = [...newOptions[optionName], value];
        }
      }
      return newOptions;
    });
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [onClose]);

  const handleAddToOrder = () => {
    onAddToOrder(item, selectedOptions, quantity, specialRequests);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div
        ref={popupRef}
        className="bg-neutral-950 p-6 rounded-lg shadow-lg max-w-md w-full relative"
      >
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>
        <div className="max-h-[70vh] overflow-y-auto">
          {item.customizationOptions?.map((option, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-semibold mb-2">{option.name}</h3>
              {option.options.map((opt, optIndex) => (
                <div
                  key={optIndex}
                  className="flex items-center mb-4 p-4 bg-neutral-900 rounded-lg cursor-pointer"
                  onClick={() =>
                    handleOptionChange(option.name, opt.label, option.type)
                  }
                >
                  <input
                    type={option.type}
                    id={`${item.name}-${option.name}-${opt.label}`}
                    name={option.name}
                    value={opt.label}
                    checked={
                      option.type === "radio"
                        ? selectedOptions[option.name]?.[0] === opt.label
                        : selectedOptions[option.name]?.includes(opt.label)
                    }
                    className="mr-2 cursor-pointer"
                    readOnly
                  />
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      handleOptionChange(option.name, opt.label, option.type)
                    }
                  >
                    <label
                      className="cursor-pointer"
                      htmlFor={`${item.name}-${option.name}-${opt.label}`}
                    >
                      {opt.label} {opt.price && `(+₹${opt.price})`}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Special Requests Textarea */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Special Requests</h3>
            <textarea
              className="w-full p-2 rounded"
              rows={3}
              placeholder="Enter any special requests here..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            ></textarea>
          </div>

          <div className="flex items-center mb-4">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="btn btn-sm"
            >
              -
            </button>
            <span className="mx-2">{quantity}</span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="btn btn-sm"
            >
              +
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary w-full"
          onClick={handleAddToOrder}
          disabled={quantity <= 0}
        >
          Add to my order ₹{item.price}
        </button>
        <button className="btn btn-ghost w-full mt-2" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Popup;
