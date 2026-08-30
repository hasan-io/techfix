import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Settings, Target, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types";
import { QUERY_TYPE_LABELS } from "@/types";

interface HeaderProps {
  title: string;
  subtitle: string;
  onToggleSidebar: () => void;
  onNavigateSettings: () => void;
  onViewLead: (lead: Lead) => void;
}

interface Notification {
  id: number;
  type: "new_lead" | "matched_lead" | "contacted_lead";
  lead: Lead;
  created_at: string;
}

const NOTIF_META = {
  new_lead: { icon: Bell, label: "New lead received", color: "text-blue-600", bg: "bg-blue-50" },
  matched_lead: { icon: Target, label: "Lead matched your filter", color: "text-emerald-600", bg: "bg-emerald-50" },
  contacted_lead: { icon: Phone, label: "Lead marked as contacted", color: "text-amber-600", bg: "bg-amber-50" },
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function Header({ title, subtitle, onToggleSidebar, onNavigateSettings, onViewLead }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch recent leads as notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data) return;

      const notifs: Notification[] = (data as Lead[]).map((lead) => ({
        id: lead.id,
        type: lead.is_matched ? "matched_lead" : lead.is_contacted ? "contacted_lead" : "new_lead",
        lead,
        created_at: lead.created_at,
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    }
    fetchNotifications();
  }, []);

  // Realtime: new leads add to notifications
  useEffect(() => {
    const channel = supabase
      .channel("header-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, (payload) => {
        const lead = payload.new as Lead;
        const notif: Notification = {
          id: lead.id,
          type: lead.is_matched ? "matched_lead" : "new_lead",
          lead,
          created_at: lead.created_at,
        };
        setNotifications((prev) => [notif, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleNotif = () => {
    setNotifOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  };

  const handleNotifClick = (notif: Notification) => {
    setNotifOpen(false);
    onViewLead(notif.lead);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="hidden text-sm text-slate-500 sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleNotif}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-8 w-8 text-slate-200" />
                    <p className="mt-2 text-xs text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const meta = NOTIF_META[notif.type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                          <Icon className={`h-4 w-4 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700">{meta.label}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {notif.lead.sender_name ?? "Unknown"} — {notif.lead.query_product_name ?? "No product"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{formatTimeAgo(notif.created_at)}</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                              {QUERY_TYPE_LABELS[notif.lead.query_type] ?? notif.lead.query_type}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile → Settings */}
        <button
          onClick={onNavigateSettings}
          className="group flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white transition-transform group-hover:scale-105">
            A
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">Admin</p>
            <p className="text-xs text-slate-400 group-hover:text-blue-500">Administrator</p>
          </div>
          <Settings className="hidden h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-blue-500 sm:block" />
        </button>
      </div>
    </header>
  );
}
