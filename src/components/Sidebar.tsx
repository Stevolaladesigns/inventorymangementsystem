"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart2,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useUserRole } from "@/hooks/useUserRole";

const allMenuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
  { name: "Products", href: "/products", icon: Package, adminOnly: false },
  { name: "Sales", href: "/sales", icon: ShoppingCart, adminOnly: false },
  { name: "Suppliers", href: "/suppliers", icon: Truck, adminOnly: false },
  { name: "Reports", href: "/reports", icon: BarChart2, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Settings, adminOnly: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState({ name: "Admin Kwame", role: "Inventory Manager" });
  const { isAdmin, isManager } = useUserRole();
  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin || isManager);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userSession");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            name: parsed.name || "Admin Kwame",
            role: parsed.role || "Inventory Manager",
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    // Clear cookies
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "userSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    // Clear localStorage session
    localStorage.removeItem("userSession");
    // Redirect to login
    router.push("/login");
  };

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-56 font-body border-r border-[#3a3330]">
      {/* Sidebar Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-[#3a3330]">
        <img
          src="/images/bidwest.png"
          alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
          className="h-10 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.src = process.env.NEXT_PUBLIC_LOGO_FALLBACK_URL || "";
          }}
        />
      </div>

      {/* Main Menu Label */}
      <div className="px-5 pt-5 pb-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-[#6b6058]">
          Main Menu
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "text-sidebar-foreground opacity-75 hover:opacity-100 hover:bg-[#2a2320]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="px-4 py-4 border-t border-[#3a3330] flex items-center justify-between bg-[#171412] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold font-headings shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {user.name}
            </span>
            <span className="text-xs text-[#6b6058] truncate">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-md text-sidebar-foreground opacity-60 hover:opacity-100 hover:bg-[#2a2320] transition-all ml-1 shrink-0"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 border-b border-[#3a3330] w-full sticky top-0 z-50">
        <img
          src="/images/bidwest.png"
          alt={process.env.NEXT_PUBLIC_COMPANY_NAME || "Bidwest Ghana Ltd"}
          className="h-8 w-auto object-contain"
          onError={(e) => {
            e.currentTarget.src = process.env.NEXT_PUBLIC_LOGO_FALLBACK_URL || "";
          }}
        />
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-[#2a2320]"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col h-screen sticky top-0 flex-shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Drawer Mobile */}
      <div
        className={clsx(
          "md:hidden fixed top-0 bottom-0 left-0 z-50 transition-transform duration-300 transform",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full relative">
          {sidebarContent}
          <button
            onClick={toggleSidebar}
            className="absolute top-4 right-[-44px] bg-sidebar text-sidebar-foreground p-2 rounded-r-md border-y border-r border-[#3a3330]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
