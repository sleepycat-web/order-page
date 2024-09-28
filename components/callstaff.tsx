import React, { useState, useEffect } from "react";

interface CallProps {
  slug: string;
}

interface CallerData {
  _id: string;
  phoneNumber: string;
  name: string;
  branch: string;
  callerStatus: boolean;
}

const CallStaff: React.FC<CallProps> = ({ slug }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [callerData, setCallerData] = useState<CallerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedOtherBranch, setSelectedOtherBranch] = useState<string>("");
  const [activeCaller, setActiveCaller] = useState<CallerData | null>(null);
  const [previousContent, setPreviousContent] =
    useState<React.ReactNode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

useEffect(() => {
  loadData();
}, [slug]);

const loadData = async () => {
  setIsLoading(true);
  setError(null);
  try {
    const response = await fetch(
      `/api/updateCaller?slug=${encodeURIComponent(slug)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch caller data");
    }
    const data = await response.json();
    setCallerData(data.allCallers);
    setActiveCaller(data.activeCaller || null);
    setSelectedBranch(getBranchName(slug));
  } catch (err) {
    setError("Error fetching caller data. Please try again.");
    console.error("Error fetching caller data:", err);
  } finally {
    setIsLoading(false);
  }
};


  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  const getBranchName = (slug: string) => {
    switch (slug) {
      case "sevoke":
        return "Sevoke Road";
      case "dagapur":
        return "Dagapur";
      default:
        return slug;
    }
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBranch(event.target.value);
    setSelectedOtherBranch("");
  };

  const handleOtherBranchChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedOtherBranch(event.target.value);
    setSelectedBranch("");
  };

 
 
  const handleSetActive = async () => {
    const selectedCallerId = selectedBranch || selectedOtherBranch;
    if (!selectedCallerId) {
      setError("Please select a caller to set active");
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/updateCaller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          callerId: selectedCallerId.split("-")[1],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update caller status");
      }

      setCallerData(data);
      await loadData();
    } catch (err: unknown) {
      setPreviousContent(renderContent());
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      console.error("Error updating caller status:", err);
      // Clear selections when error occurs
      setSelectedBranch("");
      setSelectedOtherBranch("");
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };


  const renderContent = () => (
    <>
      {activeCaller && (
        <div className="mb-4 p-3 bg-neutral-800 rounded">
          <p>Name: {activeCaller.name}</p>
          <p>Number: {activeCaller.phoneNumber}</p>
          <p>Branch: {activeCaller.branch}</p>
          <p>Status: Active</p>
        </div>
      )}
      <div className="flex flex-wrap -mx-2 mb-4">
        <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
          <label className="block mb-2">{getBranchName(slug)}:</label>
          <select
            className="p-2 bg-neutral-800 rounded w-full"
            value={selectedBranch}
            onChange={handleBranchChange}
          >
            <option value="">Select a number</option>
            {currentBranchData.map((caller) => (
              <option key={caller._id} value={`${caller.branch}-${caller._id}`}>
                {caller.name} - {caller.phoneNumber}
                {caller.callerStatus ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/2 px-2">
          <label className="block mb-2">Other Branches:</label>
          <select
            className="p-2 bg-neutral-800 rounded w-full"
            value={selectedOtherBranch}
            onChange={handleOtherBranchChange}
          >
            <option value="">Select a number</option>
            {otherBranchesData.map((caller) => (
              <option key={caller._id} value={`${caller.branch}-${caller._id}`}>
                {caller.branch} - {caller.name} - {caller.phoneNumber}
                {caller.callerStatus ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-start space-x-6">
        {selectedCallerData && (
          <div className="text-left mb-4">
            <p>Name: {selectedCallerData.name}</p>
            <p>Number: {selectedCallerData.phoneNumber}</p>
            <p>Branch: {selectedCallerData.branch}</p>
            <p>
              Status: {selectedCallerData.callerStatus ? "Active" : "Inactive"}
            </p>
          </div>
        )}
        <button
          onClick={handleSetActive}
          className="btn btn-primary text-black font-bold py-2 mb-4 px-4"
          disabled={isLoading || (!selectedBranch && !selectedOtherBranch)}
        >
          Set Active
        </button>
      </div>
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-500 text-white rounded">
          {errorMessage}
        </div>
      )}
    </>
  );

  const currentBranchData = callerData.filter(
    (caller) => caller.branch === getBranchName(slug)
  );

  const otherBranchesData = callerData.filter(
    (caller) => caller.branch !== getBranchName(slug)
  );

  const selectedCallerData = callerData.find(
    (caller) =>
      `${caller.branch}-${caller._id}` ===
      (selectedBranch || selectedOtherBranch)
  );

  return (
    <div className="w-full">
      <div
        className="bg-neutral-600 p-2 rounded inline-block cursor-pointer"
        onClick={toggleSection}
      >
        <span className="font-semibold text-white">SMS Number</span>
      </div>

      {isOpen && (
        <div className="mt-2 p-4 bg-neutral-900 rounded-lg text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg">
              Active Number for {getBranchName(slug)}:
            </span>
            <button
              onClick={toggleSection}
              className="text-white-500 hover:text-gray-300 text-xl"
            >
              &times;
            </button>
          </div>
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : callerData.length > 0 ? (
            error ? (
              previousContent
            ) : (
              renderContent()
            )
          ) : (
            <p>No caller data available at the moment.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CallStaff;
