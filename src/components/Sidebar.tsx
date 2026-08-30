import { LayoutDashboard, Users, Target, SlidersHorizontal, Settings, Zap } from "lucide-react";

export type PageId = "dashboard" | "all-leads" | "matched-leads" | "filters" | "settings";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  matchedCount: number;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "all-leads", label: "All Leads", icon: Users },
  { id: "matched-leads", label: "Matched Leads", icon: Target },
  { id: "filters", label: "Filters", icon: SlidersHorizontal },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, matchedCount }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 -translate-x-full lg:static lg:z-0">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900">LeadCRM</h1>
          <p className="text-xs text-slate-500">IndiaMART Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "matched-leads" && matchedCount > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {matchedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Webhook Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
