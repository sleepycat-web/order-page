import { is } from "date-fns/locale";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface ExpenseProps {
  slug: string;
  totalSales: number;
  totalTips: number;
}

interface DailyExpense {
  _id: string;
  category: string;
  amount: number;
  comment: string;
  createdAt: string;
}

const Expense: React.FC<ExpenseProps> = ({ slug, totalSales, totalTips }) => {
  const [category, setCategory] = useState("");
    const [paycategory, setPayCategory] = useState("");

  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isExpensesExpanded, setIsExpensesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUPIPaymentsExpanded, setIsUPIPaymentsExpanded] = useState(false);
  const [onlineBalance, setOnlineBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allTimeCounterBalance, setAllTimeCounterBalance] = useState(0);
  const [isCashBalanceExpanded, setIsCashBalanceExpanded] = useState(false);
  const [isVerifyCounterBalanceExpanded, setIsVerifyCounterBalanceExpanded] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);

  const [isAddExpanded, setIsAddExpanded] = useState(false);
    const [addMoneyAmount, setAddMoneyAmount] = useState("");
    const [isSubmittingAddMoney, setIsSubmittingAddMoney] = useState(false);
  const [isBalanceModalShown, setIsBalanceModalShown] = useState(false);

const toggleExpenses = () => {
  setIsExpensesExpanded(!isExpensesExpanded);
 
  if (isAddExpanded) {
        setIsAddExpanded(false);

    setCategory("");
    setPayCategory("");
    setAmount("");
    setComment("");
  }
};

const toggleAdd = () => {
  setIsAddExpanded(!isAddExpanded);
  if (isExpensesExpanded) {
    setIsExpensesExpanded(false);
    setCategory("");
    setPayCategory("");
    setAmount("");
    setComment("");
  }
};
  
  const categories = [
    "Supplier",
    "Drawings",
   
    "Suspense",
    "Salary",
    "Rent",
    "Electricity",
    "Others",
  ];
 const paycategories = [
   "Extra UPI Payment",
   "Extra Cash Payment",
   "Opening Cash",
 ];
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/expenseHandler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          category: paycategory || category, // Use paycategory if it's set, otherwise use category
          amount,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit expense");
      }

      setCategory("");
      setPayCategory("");

      setAmount("");
      setComment("");

      fetchDailyExpenses();
      fetchAllTimeData();
    } catch (error) {
      console.error("Error submitting expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
const calculateCashBalance = () => {
  const regularCashBalance = allTimeCounterBalance; 
  return regularCashBalance  ;
  };
  const fetchDailyExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/expenseHandler?slug=${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily expenses");
      }
      const data = await response.json();
      setDailyExpenses(data);
    } catch (error) {
      console.error("Error fetching daily expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  const balancedata = calculateCashBalance();

const handleAddMoneySubmit = async () => {
  if (isSubmittingAddMoney) return;

  setIsSubmittingAddMoney(true);
  try {
        const amountNumber = parseFloat(addMoneyAmount);
  
    const response = await fetch("/api/cashBalanceHandler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug,
        amountEntered: amountNumber,
        actualAmount: balancedata,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to verify cash balance");
    }

    // Handle success (e.g., reset the amount, show a confirmation)
    setAddMoneyAmount("");
    setIsBalanceModalShown(true);
  } catch (error) {
    console.error(error);
    alert("Error verifying cash balance");
  } finally {
    setIsSubmittingAddMoney(false);
  }
};

  const fetchAllTimeData = useCallback(async () => {
    try {
      const response = await fetch(`/api/allTimeData?slug=${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch all-time data");
      }
      const data = await response.json();
      setAllTimeCounterBalance(data.allTimeCounterBalance);
      
    } catch (error) {
      console.error("Error fetching all-time data:", error);
    }
  }, [slug]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      const timer = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 60000);

      fetchDailyExpenses();
      fetchAllTimeData();

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        clearInterval(timer);
      };
    }, [fetchDailyExpenses, fetchAllTimeData]);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setIsDropdownOpen(false);
  };
 const handlePayCategorySelect = (cat: string) => {
   setPayCategory(cat);
   setIsDropdownOpen(false);
 };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

    return `${day} ${month} ${year} ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

 

const formatDateNonRound = (date: Date): string => {
  // Create a new date instance to avoid modifying the original date
  const adjustedDate = new Date(date.getTime());

  // Subtract 5 hours and 30 minutes
  adjustedDate.setHours(adjustedDate.getHours() - 5);
  adjustedDate.setMinutes(adjustedDate.getMinutes() - 30);

  const day = adjustedDate.getDate();
  const month = adjustedDate.toLocaleString("default", { month: "long" });
  const year = adjustedDate.getFullYear();
  const hours = adjustedDate.getHours();
  const minutes = adjustedDate.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;

  return `${day} ${month} ${year} at ${formattedHours}:${formattedMinutes} ${ampm}`;
};

 const calculateTotalSales = () => {
   const regularSales = totalSales;
   const extraCashPayments = dailyExpenses
     .filter((expense) => expense.category === "Extra Cash Payment")
     .reduce((total, expense) => total + expense.amount, 0);
   const extraUPIPayments = dailyExpenses
     .filter((expense) => expense.category === "Extra UPI Payment")
     .reduce((total, expense) => total + expense.amount, 0);
   return regularSales + extraCashPayments + extraUPIPayments;
 };



  const calculateTotalExpenses = () => {
    return dailyExpenses
      .filter(
        (expense) =>
          expense.category !== "UPI Payment" &&
          expense.category !== "Extra Cash Payment" &&
          expense.category !== "Extra UPI Payment" &&
          expense.category !== "Opening Cash" 
      )
      .reduce((total, expense) => total + expense.amount, 0);
  };



  
 const calculateOnlineBalance = useCallback(() => {
   const upiPayments = dailyExpenses
     .filter((expense) => expense.category === "UPI Payment")
     .reduce((total, expense) => total + expense.amount, 0);
   const extraUpiPayments = dailyExpenses
     .filter((expense) => expense.category === "Extra UPI Payment")
     .reduce((total, expense) => total + expense.amount, 0);
   return upiPayments + extraUpiPayments;
 }, [dailyExpenses]);

  const toggleVerifyCounterBalance = () => {
    setIsVerifyCounterBalanceExpanded(!isVerifyCounterBalanceExpanded);
  };
const toggleCashBalance = () => {
  setIsCashBalanceExpanded(!isCashBalanceExpanded);
};
  useEffect(() => {
    setOnlineBalance(calculateOnlineBalance());
  }, [calculateOnlineBalance]);
  useEffect(() => { 
    setCashBalance(calculateCashBalance());
  },[calculateCashBalance])


  const toggleUPIPayments = () => {
    setIsUPIPaymentsExpanded(!isUPIPaymentsExpanded);
  };

  return (
    <div className="">
      <div className="flex flex-row gap-1 mb-2">
        {isLoading ? null : (
          <div className="flex flex-wrap gap-2">
            <div className="bg-lime-600 p-2 rounded">
              <span className="font-semibold">Total sales: </span>
              <span>₹{calculateTotalSales().toFixed(2)}</span>
            </div>

            {totalTips > 0 && (
              <div className="bg-teal-600 p-2 rounded">
                <span className="font-semibold">Total tips: </span>
                <span>₹{totalTips.toFixed(2)}</span>
              </div>
            )}

            <div
              className="bg-amber-600 p-2 rounded cursor-pointer"
              onClick={toggleExpenses}
            >
              <span className="font-semibold">Expenses: </span>
              <span>₹{calculateTotalExpenses().toFixed(2)}</span>
            </div>
            <div
              className="bg-indigo-600 p-2 rounded cursor-pointer"
              onClick={toggleAdd}
            >
              <span className="font-semibold">Add Cash/UPI</span>
            </div>
            {onlineBalance > 0 && (
              <div
                className="bg-blue-600 p-2 rounded cursor-pointer"
                onClick={toggleUPIPayments}
              >
                <span className="font-semibold">Online Payments </span>
                {/* <span>₹{onlineBalance.toFixed(2)}</span> */}
              </div>
            )}

            {cashBalance > 0 && (
              <div
                className="bg-purple-600 p-2 rounded cursor-pointer"
                onClick={toggleCashBalance}
              >
                <span className="font-semibold">Cash Payments </span>
                {/* <span>₹{calculateCashBalance().toFixed(2)}</span> */}
              </div>
            )}
            <div
              className="bg-rose-600 p-2 rounded cursor-pointer"
              onClick={toggleVerifyCounterBalance}
            >
              <span className="font-semibold">Verify Counter Balance</span>
            </div>
          </div>
        )}
      </div>

      {isAddExpanded && (
        <div className="rounded-lg relative p-4 bg-neutral-900 mb-4">
          <button
            onClick={toggleAdd}
            className="absolute top-2 right-4 text-gray-400 z-10 hover:text-white"
          >
            <p className="text-3xl">&times;</p>
          </button>
          <div className="flex flex-wrap  items-center gap-2 mb-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn bg-neutral-800 border-none hover:bg-neutral-800 text-neutral-200 px-6 p-3 w-full sm:w-auto flex items-center justify-left"
              >
                {paycategory || "Select Category"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 ml-2"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-neutral-800 rounded-box shadow-lg">
                  {paycategories.map((cat) => (
                    <li
                      key={cat}
                      className="px-4 py-2 hover:bg-neutral-700 cursor-pointer"
                      onClick={() => handlePayCategorySelect(cat)}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="text"
              inputMode="decimal"
              className="input bg-neutral-800 w-full sm:w-40"
              placeholder="Amount"
              value={amount}
              onChange={handleAmountChange}
            />
            <input
              type="text"
              placeholder="Description"
              className={`input w-full sm:w-40 ${
                comment ? "bg-neutral-800" : "bg-gray-800"
              }`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              className="btn btn-primary text-black w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!amount || !comment || !paycategory}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                </>
              ) : (
                "Submit"
              )}{" "}
            </button>
          </div>

          <div className="text-sm text-gray-400 mb-4">
            {formatDate(currentDateTime)}
          </div>

          {dailyExpenses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Extra Payments for the day</h3>
              <ul className="space-y-2">
                {dailyExpenses
                  .filter(
                    (expense) =>
                      expense.category === "Extra Cash Payment" ||
                      expense.category === "Extra UPI Payment"
                  )
                  .map((expense) => (
                    <li
                      key={expense._id}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{expense.category}</span>
                      <span className="flex items-center">
                        <span className="text-sm text-gray-400 mr-2">
                          {expense.comment}
                        </span>
                        <span className="p-1 bg-neutral-800 rounded mr-2">
                          ₹{expense.amount.toFixed(2)}
                        </span>

                        <span className="text-sm text-gray-400">
                          {formatDateNonRound(new Date(expense.createdAt))}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isExpensesExpanded && (
        <div className="rounded-lg relative p-4 bg-neutral-900 mb-4">
          <button
            onClick={toggleExpenses}
            className="absolute top-2 right-4 text-gray-400 z-10 hover:text-white"
          >
            <p className="text-3xl">&times;</p>
          </button>
          <div className="flex flex-wrap items-center   gap-2 mb-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn bg-neutral-800 border-none hover:bg-neutral-800 text-neutral-200 p-3 w-full sm:w-auto flex items-center justify-between"
              >
                {category || "Select Category"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 ml-2"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-neutral-800 rounded-box shadow-lg">
                  {categories.map((cat) => (
                    <li
                      key={cat}
                      className="px-4 py-2 hover:bg-neutral-700 cursor-pointer"
                      onClick={() => handleCategorySelect(cat)}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input
              type="text"
              inputMode="decimal"
              className="input bg-neutral-800 w-full sm:w-40"
              placeholder="Amount"
              value={amount}
              onChange={handleAmountChange}
            />
            <input
              type="text"
              placeholder="Description"
              className={`input w-full sm:w-40 ${
                comment ? "bg-neutral-800" : "bg-gray-800"
              }`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              className="btn btn-primary text-black w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={!category || !amount || !comment}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                </>
              ) : (
                "Submit"
              )}{" "}
            </button>
          </div>

          <div className="text-sm text-gray-400 mb-4">
            {formatDate(currentDateTime)}
          </div>

          {dailyExpenses.length > 0 && (
            <div>
              {calculateTotalExpenses() > 0 && (
                <h3 className="font-semibold mb-2">Expenses for the day</h3>
              )}
              <ul className="space-y-2">
                {dailyExpenses
                  .filter(
                    (expense) =>
                      expense.category !== "UPI Payment" &&
                      expense.category !== "Extra Cash Payment" &&
                      expense.category !== "Extra UPI Payment" &&
                      expense.category !== "Opening Cash"
                  )
                  .map((expense) => (
                    <li
                      key={expense._id}
                      className="flex justify-between items-center"
                    >
                      <span className="font-medium">{expense.category}</span>
                      <span className="flex items-center">
                        <span className="text-sm text-gray-400 mr-2">
                          {expense.comment}
                        </span>

                        <span className="p-1 bg-neutral-800 rounded mr-2">
                          ₹{expense.amount.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 m ">
                          {formatDateNonRound(new Date(expense.createdAt))}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="mb-4">
        {isCashBalanceExpanded && (
          <div className="rounded-lg relative p-4 bg-neutral-900 mt-3">
            <button
              onClick={toggleCashBalance}
              className="absolute top-2 right-4 text-gray-400 z-10 hover:text-white"
            >
              <p className="text-3xl">&times;</p>
            </button>
            <h3 className="font-semibold mb-2">Cash Balance Details</h3>
            <ul className="space-y-2">
              {dailyExpenses
                .filter(
                  (expense) =>
                    expense.category === "Extra Cash Payment" ||
                    expense.category === "Opening Cash"
                )
                .map((expense) => (
                  <li
                    key={expense._id}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">{expense.category}</span>
                    <span className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">
                        {expense.comment}
                      </span>
                      <span className="p-1 bg-neutral-800 rounded mr-2">
                        ₹{expense.amount.toFixed(2)}
                      </span>

                      <span className="text-sm text-gray-400">
                        {formatDateNonRound(new Date(expense.createdAt))}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <div className="mb-4">
        {isUPIPaymentsExpanded && (
          <div className="rounded-lg relative p-4 bg-neutral-900 mt-3">
            <button
              onClick={toggleUPIPayments}
              className="absolute top-2 right-4 text-gray-400 z-10 hover:text-white"
            >
              <p className="text-3xl">&times;</p>
            </button>
            <h3 className="font-semibold mb-2">UPI Payments for the day</h3>
            <ul className="space-y-2">
              {dailyExpenses
                .filter(
                  (expense) =>
                    expense.category === "UPI Payment" ||
                    expense.category === "Extra UPI Payment"
                )
                .map((expense) => (
                  <li
                    key={expense._id}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium">
                      {expense.category === "Extra UPI Payment"
                        ? "Extra UPI Payment"
                        : expense.comment}
                    </span>
                    <span className="flex items-center">
                      <span className="text-sm text-gray-400 mr-2">
                        {expense.category === "Extra UPI Payment"
                          ? expense.comment
                          : null}
                      </span>
                      <span className="p-1 bg-neutral-800 rounded mr-2">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDateNonRound(new Date(expense.createdAt))}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-4">
        {isVerifyCounterBalanceExpanded && (
          <div className="rounded-lg relative p-4 bg-neutral-900 mt-3">
            <button
              onClick={toggleVerifyCounterBalance}
              className="absolute top-2 right-4 text-gray-400 z-10 hover:text-white"
            >
              <p className="text-3xl">&times;</p>
            </button>
            <div className="flex flex-wrap items-center   gap-2 mb-4">
              <input
                type="text"
                inputMode="decimal"
                value={addMoneyAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setAddMoneyAmount(value);
                  }
                }}
                placeholder="Enter amount"
                className="input bg-neutral-800 w-full max-w-xs mr-2"
              />
              <button
                onClick={handleAddMoneySubmit}
                className="btn btn-primary"
                disabled={!addMoneyAmount || isSubmittingAddMoney}
              >
                {isSubmittingAddMoney ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
            <div className="text-sm text-gray-400 mb-4">
              {formatDate(currentDateTime)}
            </div>
          </div>
        )}
      </div>
      {isBalanceModalShown && (
        <dialog id="my_modal_1" className="modal modal-open">
          <div className="modal-box bg-neutral-800">
            <h3 className="font-bold text-lg">Confirmation </h3>
            <p className="py-4">
              Counter Balance has been sucessfully registered.
            </p>
            <div className="modal-action">
              <form method="dialog">
                <button
                  className="btn btn-primary"
                  onClick={() => setIsBalanceModalShown(false)}
                >
                  Close
                </button>
              </form>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default Expense;
