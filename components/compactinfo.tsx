import React from "react";

interface CompactInfoProps {
  customerName: string;
  phoneNumber: string;
  cabin: string;
  total: number;
}

const CompactInfo: React.FC<CompactInfoProps> = ({
  customerName,
  phoneNumber,
  cabin,
  total,
}) => {
  return (
    <div className="bg-neutral-800 p-4 rounded-lg mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{customerName}</span>
          <a
            href={`tel:+91${phoneNumber}`}
            className="text-blue-400 hover:underline"
          >
            {phoneNumber}
          </a>
          <span className="bg-blue-600 px-2 py-1 rounded text-sm">{cabin}</span>
        </div>
        <span className="bg-rose-800 px-3 py-1 rounded font-bold">
          Total: ₹{total}
        </span>
      </div>
    </div>
  );
};

export default CompactInfo;
