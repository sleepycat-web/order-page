import React, { useState, useRef, useEffect } from "react";

interface ExpenseProps {
  slug: string;
  closeExpenses: () => void;
}

const Expense: React.FC<ExpenseProps> = ({ slug, closeExpenses }) => {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const categories = [
    "Supplier",
    "Drawings",
    "Suspense",
    "Salary",
    "Rent",
    "Electricity",
    "UPI Payment",
    "Others",
  ];

  const handleSubmit = () => {
    // Submit function is empty for now
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        dropdownRef.current.open = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    if (dropdownRef.current) {
      dropdownRef.current.open = false;
    }
  };

  return (
    <div className="bg-neutral-900 p-4 rounded-lg mt-3">
      <div className="rounded-lg relative">
        <button
          onClick={closeExpenses}
          className="absolute top-2 right-4 text-gray-400 hover:text-white"
        >
          <p className="text-3xl">&times;</p>
        </button>
        <div className="pt-2 mb-4 font-semibold text-xl">Add Expenses</div>

        <div className="flex mb-4 gap-2">
          <details
            className="dropdown bg-neutral-800 hover:bg-neutral-700 rounded-lg"
            ref={dropdownRef}
          >
            <summary className="btn bg-neutral-800 border-none">
              {category || "Select Category"}{" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="ml-2 h-4 w-4 inline"
                fill="currentColor"
              >
                <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
              </svg>
            </summary>
            <ul className="menu dropdown-content bg-neutral-800 rounded-box z-[1] w-52 p-2 shadow">
              {categories.map((cat) => (
                <li key={cat}>
                  <a onClick={() => handleCategorySelect(cat)}>{cat}</a>
                </li>
              ))}
            </ul>
          </details>

          <label className="input w-full max-w-xs flex items-center gap-2 bg-neutral-800 flex-grow">
            ₹{" "}
            <input
              type="text"
              className="grow bg-neutral-800"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <input
            type="text"
            placeholder="Description"
            className="input w-full max-w-xs mb-4 bg-neutral-800"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            className="btn btn-primary text-black ml-2"
            onClick={handleSubmit}
            disabled={!category || !amount || !comment}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Expense;
