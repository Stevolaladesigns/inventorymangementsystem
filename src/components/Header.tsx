import { Bell } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  subtitle: string;
  lowStockCount?: number;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, lowStockCount = 0, actions }: HeaderProps) {
  // Format today's date exactly like: "Wednesday, 18 June 2025"
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card border-b border-border px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-body">
      <div>
        <h1 className="text-2xl font-bold font-headings text-foreground leading-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {subtitle || formattedDate}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Low Stock Alerts Badge */}
        {lowStockCount > 0 ? (
          <Link
            href="/products?filter=low-stock"
            className="flex items-center gap-2 bg-danger text-primary-foreground text-xs font-semibold px-3 py-2 rounded-md hover:bg-red-700 transition"
          >
            <Bell className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
            <span>
              {lowStockCount} {lowStockCount === 1 ? "Alert" : "Low Stock Alerts"}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-success/10 text-success text-xs font-semibold px-3 py-2 rounded-md">
            <span>Stock levels healthy</span>
          </div>
        )}

        {/* Dynamic Action Buttons */}
        {actions}
      </div>
    </div>
  );
}

