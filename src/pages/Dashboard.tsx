import { Users, Target, Phone, XCircle, TrendingUp, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useStats } from "@/hooks/useStats";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Lead } from "@/types";
import { STATUS_STYLES, QUERY_TYPE_LABELS } from "@/types";

interface DashboardProps {
  onViewLead: (lead: Lead) => void;
  onNavigate: (page: "all-leads" | "matched-leads") => void;
}

export default function Dashboard({ onViewLead, onNavigate }: DashboardProps) {
  const { stats, refetch } = useStats();
  const { leads: recentLeads, refetch: refetchLeads } = useLeads({ limit: 5, sortColumn: "created_at", sortDirection: "desc" });
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    async function fetchTrend() {
      const days: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", start)
          .lt("created_at", end);
        days.push({
          date: d.toLocaleDateString("en-IN", { weekday: "short" }),
          count: count ?? 0,
        });
      }
      setTrendData(days);
    }
    fetchTrend();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        refetch();
        refetchLeads();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => {
        refetch();
        refetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch, refetchLeads]);

  const maxTrend = Math.max(...trendData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Leads" value={stats.total_leads} icon={Users} color="blue" subtitle="All time" />
        <StatCard title="Matched Leads" value={stats.matched_leads} icon={Target} color="emerald" subtitle={`${stats.total_leads > 0 ? Math.round((stats.matched_leads / stats.total_leads) * 100) : 0}% match rate`} />
        <StatCard title="Contacted" value={stats.contacted_leads} icon={Phone} color="amber" subtitle="Successfully reached" />
        <StatCard title="Failed" value={stats.failed_leads} icon={XCircle} color="red" subtitle="Need attention" />
      </div>

      {/* Today + Trend Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Today's Leads</p>
              <p className="mt-2 text-4xl font-bold text-blue-600">{stats.today_leads}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
              <Calendar className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" /> Live tracking
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-700">Lead Trend — Last 7 Days</h3>
          <div className="flex items-end justify-between gap-2" style={{ height: "140px" }}>
            {trendData.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(d.count / maxTrend) * 100}%`, minHeight: d.count > 0 ? "8px" : "2px" }}
                    title={`${d.count} leads`}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{d.date}</span>
                <span className="text-xs font-bold text-slate-700">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-bold text-slate-700">Recent Leads</h3>
          <button
            onClick={() => onNavigate("all-leads")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        {recentLeads.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-400">No leads yet. Waiting for IndiaMART webhook data...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLeads.map((lead) => {
              const statusStyle = STATUS_STYLES[lead.status] ?? STATUS_STYLES.new;
              return (
                <div
                  key={lead.id}
                  onClick={() => onViewLead(lead)}
                  className="flex cursor-pointer items-center justify-between px-5 py-3 transition-colors hover:bg-blue-50/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {(lead.sender_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lead.sender_name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-400">{lead.query_product_name ?? "No product"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-slate-400 sm:block">
                      {QUERY_TYPE_LABELS[lead.query_type] ?? lead.query_type}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    {lead.is_matched && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Matched
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
