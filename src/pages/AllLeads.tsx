import { useState, useEffect } from "react";
import { Search, Filter as FilterIcon } from "lucide-react";
import LeadsTable from "@/components/LeadsTable";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types";
import { LEAD_STATUSES, STATUS_STYLES } from "@/types";

interface AllLeadsProps {
  matchedOnly?: boolean;
  onViewLead: (lead: Lead) => void;
  onLeadUpdated: () => void;
}

export default function AllLeads({ matchedOnly = false, onViewLead, onLeadUpdated }: AllLeadsProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { leads, total, loading, refetch } = useLeads({
    matchedOnly,
    page,
    limit,
    search,
    statusFilter,
    sortColumn,
    sortDirection,
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(matchedOnly ? "matched-leads-realtime" : "all-leads-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => refetch())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => refetch())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "leads" }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch, matchedOnly]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const handleStatusChange = async (lead: Lead, status: string) => {
    const { error } = await supabase
      .from("leads")
      .update({
        status,
        is_contacted: status === "contacted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    if (error) {
      alert("Failed to update lead: " + error.message);
      return;
    }

    await supabase.from("lead_history").insert({
      lead_id: lead.id,
      action: status,
      action_details: `Status changed to ${status}`,
      contacted_at: status === "contacted" ? new Date().toISOString() : null,
    });

    refetch();
    onLeadUpdated();
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, mobile, email, product, or company..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_STYLES[s]?.label ?? s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <LeadsTable
        leads={leads}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onPageChange={setPage}
        onViewLead={onViewLead}
        onStatusChange={handleStatusChange}
        showMatchedBadge={matchedOnly}
      />
    </div>
  );
}
