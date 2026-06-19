import React from "react";
import clsx from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string; // e.g. "text-primary" or "text-success"
  iconBg?: string; // e.g. "bg-[#fdf0ee]" or "bg-[#eaf6ef]"
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-[#fdf0ee]",
}: StatCardProps) {
  return (
    <div className="bg-card rounded-lg p-5 flex flex-col gap-3 border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div
          className={clsx(
            "w-9 h-9 rounded-md flex items-center justify-center",
            iconBg
          )}
        >
          <Icon className={clsx("w-5 h-5", iconColor)} />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold font-headings text-foreground">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      </div>
    </div>
  );
}
