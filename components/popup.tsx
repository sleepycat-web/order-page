import React, { useState, useEffect, useRef } from "react";
import { MenuItem, CustomizationOption } from "./menu"; // Adjust the import path as needed

interface PopupProps {
  item: MenuItem;
  onClose: () => void;
  onAddToOrder: (
    item: MenuItem,
    selectedOptions: Record<string, string[]>,
    quantity: number,
    specialRequests: string,
    totalPrice: number
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
  const [mandatoryOptions, setMandatoryOptions] = useState<string[]>([]);

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

  useEffect(() => {
    const mandatoryOpts =
      item.customizationOptions
        ?.filter((option) => option.type === "radio")
        .map((option) => option.name) || [];
    setMandatoryOptions(mandatoryOpts);
  }, [item]);

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
      onAddToOrder(
        item,
        selectedOptions,
        quantity,
        specialRequests,
        totalPrice
      );
      onClose();
    } else {
      setError("Please select all required options");
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const hasSelectedOptions = Object.keys(selectedOptions).length > 0;

  const getMissingMandatoryOptions = (): string[] => {
    return mandatoryOptions.filter(
      (option) =>
        !selectedOptions[option] || selectedOptions[option].length === 0
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div
        ref={popupRef}
        className="bg-neutral-950 p-6 rounded-lg shadow-lg w-full max-w-2xl relative flex flex-col h-[90vh]"
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
              <h3 className="font-semibold mb-2">
                {option.name}{" "}
                {/* {option.type === "radio" && (
                  <span className="text-red-500">*</span>
                )} */}
              </h3>
              <div className="grid grid-cols-2 gap-2 grid-flow-row-dense">
                {option.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`bg-neutral-900 rounded-lg p-3 cursor-pointer ${
                      selectedOptions[option.name]?.includes(opt.label)
                        ? "border border-white"
                        : ""
                    }`}
                    onClick={() =>
                      handleOptionChange(option.name, opt.label, option.type)
                    }
                  >
                    <label className={`flex items-center cursor-pointer`}>
                      <input
                        type={option.type}
                        id={`${item.name}-${option.name}-${opt.label}`}
                        name={option.name}
                        value={opt.label}
                        checked={selectedOptions[option.name]?.includes(
                          opt.label
                        )}
                        className="mr-2 cursor-pointer"
                        onChange={() =>
                          handleOptionChange(
                            option.name,
                            opt.label,
                            option.type
                          )
                        }
                      />
                      <span className="flex-grow text-sm">
                        {opt.label}{" "}
                        <div className="inline-block">
                          {opt.price && (
                            <>
                              {" "}
                              {option.type === "checkbox"
                                ? `(+₹${opt.price})`
                                : `(₹${opt.price})`}
                            </>
                          )}
                        </div>
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Special Requests</h3>
            <textarea
              className="w-full p-2 rounded bg-neutral-900"
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
        <div className="mt-4">
          {getMissingMandatoryOptions().length > 0 && (
            <p className="text-yellow-500 mb-2">
              Select options: {getMissingMandatoryOptions().join(", ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
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
