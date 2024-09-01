import React from "react";

interface TabCounts {
  new: number;
  active: number;
  previous: number;
}

interface OrderTabsProps {
  activeTab: "new" | "active" | "previous";
  setActiveTab: (tab: "new" | "active" | "previous") => void;
  counts: TabCounts;
}

const OrderTabs: React.FC<OrderTabsProps> = ({
  activeTab,
  setActiveTab,
  counts,
}) => {
  const tabs = [
    { key: "new" as const, label: "New" },
    { key: "active" as const, label: "Active" },
    { key: "previous" as const, label: "Previous" },
  ];

  return (
    <div className="flex space-x-1 rounded-xl bg-neutral-800/30 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
            activeTab === tab.key
              ? "bg-neutral-300 text-neutral-900 shadow"
              : "text-neutral-300 hover:bg-white/[0.12] hover:text-white"
          }`}
          onClick={() => setActiveTab(tab.key)}
        >
          {tab.label} ({counts[tab.key]})
        </button>
      ))}
    </div>
  );
};

export default OrderTabs;
