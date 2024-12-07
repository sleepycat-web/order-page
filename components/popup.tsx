import React, { useState, useEffect, useRef } from "react";
import { MenuItem } from "./menu";
import { Button } from "./ui/button";
import { X } from "lucide-react";

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
  const [showErrorHighlight, setShowErrorHighlight] = useState(false);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (item.customizationOptions) {
      optionRefs.current = new Array(item.customizationOptions.length).fill(
        null
      );
    }
  }, [item.customizationOptions]);
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

  const validateSpecialRequests = (input: string): string => {
    return input.replace(/[^a-zA-Z0-9?.! ]/g, ""); // Added '\s' to allow spaces
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

  const cleanupEmptyEntries = (options: Record<string, string[]>) => {
    const cleanedOptions = { ...options };
    Object.keys(cleanedOptions).forEach((key) => {
      if (cleanedOptions[key].length === 0) {
        delete cleanedOptions[key];
      }
    });
    return cleanedOptions;
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
    if (showErrorHighlight) {
      const isValid = validateSelection();
      if (isValid) {
        setShowErrorHighlight(false);
      }
    }
  }, [selectedOptions]);

  const validateSelection = (): boolean => {
    if (!item.customizationOptions) return true;

    let hasOnlyCheckboxes = true;
    let hasSelectedCheckbox = false;

    for (const option of item.customizationOptions) {
      if (option.type === "radio") {
        hasOnlyCheckboxes = false;
        if (
          !selectedOptions[option.name] ||
          selectedOptions[option.name].length === 0
        ) {
          return false;
        }
      } else if (option.type === "checkbox") {
        if (
          selectedOptions[option.name] &&
          selectedOptions[option.name].length > 0
        ) {
          hasSelectedCheckbox = true;
        }
      }
    }

    return !hasOnlyCheckboxes || hasSelectedCheckbox;
  };

  const handleAddToOrderWithCleanup = () => {
    if (validateSelection()) {
      const cleanedOptions = cleanupEmptyEntries(selectedOptions);

      // Create orderedSelectedOptions based on the order of item.customizationOptions
      const orderedSelectedOptions: Record<string, string[]> = {};
      item.customizationOptions?.forEach((option) => {
        if (cleanedOptions[option.name]) {
          orderedSelectedOptions[option.name] = cleanedOptions[option.name];
        }
      });

      onAddToOrder(
        item,
        orderedSelectedOptions,
        quantity,
        specialRequests,
        totalPrice
      );
      onClose();
    } else {
      setShowErrorHighlight(true);
      if (
        item.customizationOptions?.every((option) => option.type === "checkbox")
      ) {
        setError("Please select at least one option");
      } else {
        setError("Please select required options");
      }

      const firstInvalidOptionIndex = item.customizationOptions?.findIndex(
        (option, index) => {
          if (option.type === "radio") {
            return (
              !selectedOptions[option.name] ||
              selectedOptions[option.name].length === 0
            );
          } else if (option.type === "checkbox") {
            return (
              item.customizationOptions?.every(
                (opt) => opt.type === "checkbox"
              ) &&
              (!selectedOptions[option.name] ||
                selectedOptions[option.name].length === 0)
            );
          }
          return false;
        }
      );

      if (
        firstInvalidOptionIndex !== -1 &&
        firstInvalidOptionIndex !== undefined
      ) {
        const invalidElement = optionRefs.current[firstInvalidOptionIndex];
        if (invalidElement) {
          invalidElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleSpecialRequestsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const validatedInput = validateSpecialRequests(e.target.value);
    setSpecialRequests(validatedInput);
  };

  const hasSelectedOptions = Object.keys(selectedOptions).length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div
        ref={popupRef}
        className="bg-neutral-950 p-6 rounded-lg w-full max-w-2xl relative flex flex-col h-[90vh]"
      >
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <X />
        </button>
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>
        <div className="max-h-[70vh] overflow-y-auto">
          {item.customizationOptions?.map((option, index) => (
            <div
              key={index}
              className="mb-4"
              ref={(el) => {
                if (el && optionRefs.current) {
                  optionRefs.current[index] = el;
                }
              }}
            >
              <h3
                className={`font-semibold mb-2 p-1 rounded-lg ${
                  showErrorHighlight &&
                  ((option.type === "radio" &&
                    (!selectedOptions[option.name] ||
                      selectedOptions[option.name].length === 0)) ||
                    (option.type === "checkbox" &&
                      item.customizationOptions?.every(
                        (opt) => opt.type === "checkbox"
                      ) &&
                      (!selectedOptions[option.name] ||
                        selectedOptions[option.name].length === 0)))
                    ? "bg-red-900"
                    : ""
                }`}
              >
                {option.name}
              </h3>
              <div className="grid grid-cols-2 gap-2 grid-flow-row-dense">
                {option.options.map((opt, optIndex) => {
                  const isSelected = selectedOptions[option.name]?.includes(
                    opt.label
                  );

                  const handleOptionClick = (e: React.MouseEvent) => {
                    e.preventDefault();
                    updateOptionSelection(opt.label);
                  };

                  const handleInputChange = (
                    e: React.ChangeEvent<HTMLInputElement>
                  ) => {
                    updateOptionSelection(opt.label);
                  };

                  const updateOptionSelection = (optLabel: string) => {
                    setSelectedOptions((prev) => {
                      const newOptions = { ...prev };
                      if (option.type === "radio") {
                        newOptions[option.name] = [optLabel];
                      } else if (option.type === "checkbox") {
                        if (!newOptions[option.name]) {
                          newOptions[option.name] = [];
                        }
                        const index = newOptions[option.name].indexOf(optLabel);
                        if (index > -1) {
                          newOptions[option.name] = newOptions[
                            option.name
                          ].filter((item) => item !== optLabel);
                        } else {
                          newOptions[option.name] = [
                            ...newOptions[option.name],
                            optLabel,
                          ];
                        }
                      }
                      return newOptions;
                    });
                  };

                  return (
                    <div
                      key={optIndex}
                      className={`bg-neutral-900 rounded-lg p-3 cursor-pointer ${
                        isSelected ? "border border-white" : ""
                      }`}
                      onClick={handleOptionClick}
                    >
                      <label className="flex items-center cursor-pointer w-full">
                        <input
                          type={option.type}
                          id={`${item.name}-${option.name}-${opt.label}`}
                          name={option.name}
                          value={opt.label}
                          checked={isSelected}
                          className="mr-2 cursor-pointer"
                          onChange={handleInputChange}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="flex-grow text-sm select-none">
                          {opt.label}{" "}
                          {opt.price && (
                            <span className="inline-block">
                              {option.type === "checkbox"
                                ? `(+₹${opt.price})`
                                : `(₹${opt.price})`}
                            </span>
                          )}
                        </span>
                      </label>
                    </div>
                  );
                })}
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
              onChange={handleSpecialRequestsChange}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text");
                const validatedText = validateSpecialRequests(text);
                setSpecialRequests((prev) => prev + validatedText);
              }}
              onKeyPress={(e) => {
                const char = String.fromCharCode(e.charCode);
                if (!/[a-zA-Z0-9?.! ]/.test(char)) {
                  // Added '0-9' here too
                  e.preventDefault();
                }
              }}
            ></textarea>
          </div>
        </div>
        {hasSelectedOptions && hasSelectedOptionsWithPrice() && (
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
        <div className="flex gap-2">
          <Button className="mt-4 w-2/3" onClick={handleAddToOrderWithCleanup}>
            {hasSelectedOptionsWithPrice()
              ? `Add to my order ₹${totalPrice.toFixed(2)}`
              : "Add to my order"}
          </Button>
          <Button
            className="bg-neutral w-1/3 mt-4"
            onClick={onClose}
            variant={"secondary"}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
