// ClientLayout.tsx
"use client";
import { useState } from "react";
import Login from "./login";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <>{children}</>;
};

export default ClientLayout;
