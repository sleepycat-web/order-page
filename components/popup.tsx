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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [specialRequests, setSpecialRequests] = useState("");
  const popupRef = useRef<HTMLDivElement>(null);
  const [totalPrice, setTotalPrice] = useState<number>(parseFloat(item.price));

  const shouldShowQuantitySelector = (itemName: string, optionName: string) => {
    const cases = [
      { item: "Beverages", option: "Select Beverage" },
      { item: "Bread/Bun", option: "Texture" },
      { item: "Bread/Bun", option: "Extras" },

      { item: "Tea", option: "Choice of Tea" },
      { item: "Coffee", option: "Coffee Type" },
      // { item: "Maggi", option: "Flavour" },
      { item: "Wai Wai", option: "Flavour" },
      { item: "Ramen", option: "Flavour" },
      { item: "Soup", option: "Select Broth" },
      { item: "Momo", option: "Preference" },
      { item: "Snacks", option: "Select Snack" },
      { item: "Rice Bowl", option: "Select Rice" },
      { item: "Indian Gravy", option: "Select Your Meal" },
      { item: "Pasta", option: "Flavour" },
      { item: "Sandwich", option: "Flavour of Bread" },
      { item: "Burger", option: "Select Burger" },
      { item: "Pan Pizza", option: "Flavour" },
      { item: "Miscellaneous", option: "" },
    ];
    return cases.some(c => c.item === itemName && (c.option === optionName || c.item === "Miscellaneous"));
  };

const calculateTotalPrice = (): number => {
  let total = 0;

  Object.entries(selectedOptions).forEach(([optionName, selectedValues]) => {
    const option = item.customizationOptions?.find(
      (opt) => opt.name === optionName
    );

    if (option) {
      selectedValues.forEach((value) => {
        const selectedOpt = option.options.find((opt) => opt.label === value);
        if (selectedOpt) {
          const quantity = quantities[`${optionName}-${value}`] || 1;
          if (selectedOpt.price) {
            total += parseFloat(selectedOpt.price) * quantity;
          } else {
            // Include items with only a label and no price
            if (
              [
                "Extras",
                "Temperature",
                "Texture",
                "Appetite",
                "Taste",
                "Type",
                "Choose Bite",
                "Choice of Tea",
                "Appetite",
                "Flavour",
                "Extra",
                // "Flavour of Bun",
              ].includes(optionName)
            ) {
              // Include these options without adding to the total price
              // You might want to handle these differently based on your requirements
            } else {
              // For other options with no price, add the item's base price
              // total += parseFloat(item.price) * quantity;
            }
          }
        }
      });
    }
  });

  return total;
};

  const handleOptionChange = (
    optionName: string,
    value: string,
    type: "radio" | "checkbox"
  ) => {
    setSelectedOptions((prev: Record<string, string[]>) => {
      const newOptions = { ...prev };
      if (type === "radio") {
        if (newOptions[optionName]?.[0] === value) {
          delete newOptions[optionName];
          setQuantities((prevQuantities) => {
            const newQuantities = { ...prevQuantities };
            delete newQuantities[`${optionName}-${value}`];
            return newQuantities;
          });
        } else {
          if (newOptions[optionName]) {
            setQuantities((prevQuantities) => {
              const newQuantities = { ...prevQuantities };
              delete newQuantities[`${optionName}-${newOptions[optionName][0]}`];
              return newQuantities;
            });
          }
          newOptions[optionName] = [value];
          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [`${optionName}-${value}`]: 1,
          }));
        }
      } else if (type === "checkbox") {
        if (!newOptions[optionName]) {
          newOptions[optionName] = [];
        }
        const index = newOptions[optionName].indexOf(value);
        if (index > -1) {
          newOptions[optionName] = newOptions[optionName].filter(item => item !== value);
          setQuantities((prevQuantities) => {
            const newQuantities = { ...prevQuantities };
            delete newQuantities[`${optionName}-${value}`];
            return newQuantities;
          });
        } else {
          newOptions[optionName] = [...newOptions[optionName], value];
          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [`${optionName}-${value}`]: 1,
          }));
        }
      }
      return newOptions;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
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
  }, [selectedOptions, quantities]);

  const handleAddToOrder = () => {
    const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
    onAddToOrder(item, selectedOptions, totalQuantity, specialRequests);
    onClose();
  };

  const QuantitySelector: React.FC<{ optionName: string; value: string }> = ({
    optionName,
    value,
  }) => {
    const quantity = quantities[`${optionName}-${value}`] || 1;

    const setQuantity = (newQuantity: number) => {
      setQuantities((prev) => ({
        ...prev,
        [`${optionName}-${value}`]: newQuantity,
      }));
    };

    return (
      <div className="flex items-center mb-4 ml-6">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="btn btn-sm"
        >
          -
        </button>
        <span className="mx-2">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="btn btn-sm"
        >
          +
        </button>
      </div>
    );
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
                      readOnly
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
                  {selectedOptions[option.name]?.includes(opt.label) &&
                    shouldShowQuantitySelector(item.name, option.name) && (
                      <QuantitySelector
                        optionName={option.name}
                        value={opt.label}
                      />
                    )}
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
        
        <button
          className="btn mt-2 btn-primary w-full"
          onClick={handleAddToOrder}
          disabled={Object.keys(selectedOptions).length === 0}
        >
          Add to my order
          {Object.keys(selectedOptions).length > 0 &&
            ` ₹${totalPrice.toFixed(2)}`}
        </button>

        <button className="btn btn-ghost w-full mt-2" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Popup;