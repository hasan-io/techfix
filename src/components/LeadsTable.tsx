import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Eye, Phone, PhoneOff } from "lucide-react";
import type { Lead } from "@/types";
import { STATUS_STYLES, QUERY_TYPE_LABELS } from "@/types";

interface LeadsTableProps {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onViewLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: string) => void;
  showMatchedBadge?: boolean;
}

const COLUMNS = [
  { key: "sender_name", label: "Name" },
  { key: "sender_mobile", label: "Mobile" },
  { key: "query_product_name", label: "Product" },
  { key: "sender_country_iso", label: "Country" },
  { key: "query_type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Date" },
];

export default function LeadsTable({
  leads,
  total,
  page,
  limit,
  loading,
  sortColumn,
  sortDirection,
  onSort,
  onPageChange,
  onViewLead,
  onStatusChange,
  showMatchedBadge = false,
}: LeadsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getSortIcon = (col: string) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-8 w-8 text-slate-300" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">No leads found</p>
        <p className="text-xs text-slate-400">Leads will appear here once the webhook receives them</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer px-4 py-3 font-semibold text-slate-600 transition-colors hover:text-blue-600"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => {
              const statusStyle = STATUS_STYLES[lead.status] ?? STATUS_STYLES.new;
              return (
                <tr
                  key={lead.id}
                  className={`border-b border-slate-100 transition-colors hover:bg-blue-50/30 ${
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        {(lead.sender_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{lead.sender_name ?? "Unknown"}</p>
                        {lead.sender_company && (
                          <p className="text-xs text-slate-400">{lead.sender_company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.sender_mobile ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-700">{lead.query_product_name ?? "—"}</span>
                    {showMatchedBadge && lead.is_matched && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Matched
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.sender_country_iso ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {QUERY_TYPE_LABELS[lead.query_type] ?? lead.query_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewLead(lead)}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {lead.status !== "contacted" && (
                        <button
                          onClick={() => onStatusChange(lead, "contacted")}
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600"
                          title="Mark Contacted"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                      )}
                      {lead.status !== "skipped" && (
                        <button
                          onClick={() => onStatusChange(lead, "skipped")}
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-600"
                          title="Skip"
                        >
                          <PhoneOff className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{(page - 1) * limit + 1}</span>–
          <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span> of{" "}
          <span className="font-semibold text-slate-700">{total}</span> leads
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="px-2 text-xs font-medium text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
