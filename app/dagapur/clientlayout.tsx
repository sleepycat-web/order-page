"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Login from "../login";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkLoginStatus = () => {
      if (pathname !== null) {
        const pathSegments = pathname.split("/");
        const location = pathSegments[1];
        const loginExpiration = localStorage.getItem(
          `loginExpiration_${location}`
        );
        if (
          loginExpiration &&
          new Date().getTime() < parseInt(loginExpiration, 10)
        ) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, [pathname]);

  const handleLoginSuccess = (location: string) => {
    // Set expiration to one month from now
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    localStorage.setItem(
      `loginExpiration_${location}`,
      expirationDate.getTime().toString()
    );
    setIsLoggedIn(true);
  };

  if (isLoading) {
    return <div></div>; // Or any loading indicator
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <>{children}</>;
};

export default ClientLayout;
