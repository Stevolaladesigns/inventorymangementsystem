"use client";

import { useState, useEffect } from "react";

interface UserRole {
  role: "Admin" | "Manager" | "Staff" | null;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isLoading: boolean;
}

export function useUserRole(): UserRole {
  const [role, setRole] = useState<"Admin" | "Manager" | "Staff" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userSession");
      if (stored) {
        // Automatically restore the cookie if missing to prevent "No session found" error
        if (!document.cookie.includes("userSession=")) {
          document.cookie = `userSession=${encodeURIComponent(stored)}; path=/; max-age=604800;`;
        }
        try {
          const parsed = JSON.parse(stored);
          const userRole = 
            parsed.role === "Admin" 
              ? "Admin" 
              : parsed.role === "Manager" 
                ? "Manager" 
                : "Staff";
          setRole(userRole);
        } catch {
          setRole("Staff");
        }
      } else {
        setRole("Staff");
      }
    }
    setIsLoading(false);
  }, []);

  return {
    role,
    isAdmin: role === "Admin",
    isManager: role === "Manager",
    isStaff: role === "Staff",
    isLoading,
  };
}
