import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "emerald" | "amber" | "red";
  subtitle?: string;
}

const COLOR_MAP = {
  blue: { bg: "bg-blue-50", icon: "bg-blue-600", text: "text-blue-700", accent: "text-blue-500" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-600", text: "text-emerald-700", accent: "text-emerald-500" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-600", text: "text-amber-700", accent: "text-amber-500" },
  red: { bg: "bg-red-50", icon: "bg-red-600", text: "text-red-700", accent: "text-red-500" },
};

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className={`mt-1 text-xs font-medium ${c.accent}`}>{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg}`}>
          <Icon className={`h-6 w-6 ${c.text}`} />
        </div>
      </div>
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full ${c.bg} opacity-30 transition-opacity group-hover:opacity-50`} />
    </div>
  );
}
