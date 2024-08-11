import React, { useState, useEffect, useRef } from "react";
import { MenuItem, CustomizationOption } from "./menu"; // Adjust the import path as needed

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
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const calculateTotalPrice = (): number => {
    let total = 0;

    Object.entries(selectedOptions).forEach(([optionName, selectedValues]) => {
      const option = item.customizationOptions?.find(
        (opt) => opt.name === optionName
      );

      if (option) {
        selectedValues.forEach((value) => {
          const selectedOpt = option.options.find((opt) => opt.label === value);
          if (selectedOpt && selectedOpt.price) {
            total += parseFloat(selectedOpt.price);
          }
        });
      }
    });

    return total * quantity;
  };
  const hasSelectedOptionsWithPrice = (): boolean => {
    return Object.entries(selectedOptions).some(
      ([optionName, selectedValues]) => {
        const option = item.customizationOptions?.find(
          (opt) => opt.name === optionName
        );
        return option?.options.some(
          (opt) => selectedValues.includes(opt.label) && opt.price
        );
      }
    );
  };
  const handleOptionChange = (
    optionName: string,
    value: string,
    type: "radio" | "checkbox"
  ) => {
    setSelectedOptions((prev: Record<string, string[]>) => {
      const newOptions = { ...prev };
      if (type === "radio") {
        // If the option is already selected, unselect it
        if (newOptions[optionName]?.[0] === value) {
          delete newOptions[optionName];
        } else {
          newOptions[optionName] = [value];
        }
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
    setError(null);
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

  useEffect(() => {
    setTotalPrice(calculateTotalPrice());
  }, [selectedOptions, quantity]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateSelection = (): boolean => {
    if (!item.customizationOptions) return true;

    for (const option of item.customizationOptions) {
      if (
        option.type === "radio" &&
        (!selectedOptions[option.name] ||
        selectedOptions[option.name].length === 0)
      ) {
        return false;
      }
    }
    return true;
  };

  const handleAddToOrder = () => {
    if (validateSelection()) {
      onAddToOrder(item, selectedOptions, quantity, specialRequests);
      onClose();
    } else {
      setError("Please select required options");
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const hasSelectedOptions = Object.keys(selectedOptions).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div
        ref={popupRef}
        className="bg-neutral-950 p-6 rounded-lg shadow-lg w-full max-w-md relative flex flex-col h-[90vh]"
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
  <div key={optIndex}>
    <div
      className={`flex items-center mb-4 p-4 bg-neutral-900 rounded-lg cursor-pointer ${
        selectedOptions[option.name]?.includes(opt.label)
          ? "border border-white"
          : ""
      }`}
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
        onChange={() => handleOptionChange(option.name, opt.label, option.type)}
        onClick={(e) => e.stopPropagation()}
      />
      <label
        className="cursor-pointer flex-grow"
        htmlFor={`${item.name}-${option.name}-${opt.label}`}
      >
        {opt.label}
        {opt.price &&
          option.type === "checkbox" &&
          ` (+₹${opt.price})`}
        {opt.price &&
          option.type !== "checkbox" &&
          ` (₹${opt.price})`}
      </label>
    </div>
  </div>
))}
            </div>
          ))}

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
        </div>
        {hasSelectedOptions && (
          <div className="flex items-center my-4">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="btn btn-sm"
            >
              -
            </button>
            <span className="mx-2">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="btn btn-sm"
            >
              +
            </button>
          </div>
        )}
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 ">
          <button
            className="btn mt-2 btn-primary w-2/3"
            onClick={handleAddToOrder}
          >
            {hasSelectedOptionsWithPrice()
              ? `Add to my order ₹${totalPrice.toFixed(2)}`
              : "Add to my order"}
          </button>

          <button
            className="btn btn-ghost bg-neutral-900 w-1/3 mt-2"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
