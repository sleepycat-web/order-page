"use client"
import React, { useEffect, useState } from "react";
import BillSection from "@/components/bill";

const Home = () => {
  const [phone, setPhone] = useState<string | undefined>(undefined);

  useEffect(() => {
    const search = window.location.search;
    const match = search.match(/^\?([6-9]\d{9})$/);
    if (match) {
      setPhone(match[1]);
    } else {
      setPhone(undefined);
    }
  }, []);

  return (
    <div>
      <BillSection phone={phone} />
    </div>
  );
};

export default Home;
