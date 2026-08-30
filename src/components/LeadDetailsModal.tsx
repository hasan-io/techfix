import { X, Phone, PhoneOff, Mail, MapPin, Building2, Package, Clock, MessageSquare, CheckCircle, XCircle, History } from "lucide-react";
import type { Lead, LeadHistory } from "@/types";
import { STATUS_STYLES, QUERY_TYPE_LABELS } from "@/types";

interface LeadDetailsModalProps {
  lead: Lead | null;
  history: LeadHistory[];
  loadingHistory: boolean;
  onClose: () => void;
  onStatusChange: (status: string, details?: string) => void;
  onAddNote: (details: string) => void;
}

export default function LeadDetailsModal({
  lead,
  history,
  loadingHistory,
  onClose,
  onStatusChange,
  onAddNote,
}: LeadDetailsModalProps) {
  if (!lead) return null;

  const statusStyle = STATUS_STYLES[lead.status] ?? STATUS_STYLES.new;
  const fields = [
    { icon: Phone, label: "Mobile", value: lead.sender_mobile },
    { icon: Phone, label: "Alt Mobile", value: lead.sender_mobile_alt },
    { icon: Phone, label: "Phone", value: lead.sender_phone },
    { icon: Phone, label: "Alt Phone", value: lead.sender_phone_alt },
    { icon: Mail, label: "Email", value: lead.sender_email },
    { icon: Mail, label: "Alt Email", value: lead.sender_email_alt },
    { icon: Building2, label: "Company", value: lead.sender_company },
    { icon: MapPin, label: "Address", value: lead.sender_address },
    { icon: MapPin, label: "City", value: lead.sender_city },
    { icon: MapPin, label: "State", value: lead.sender_state },
    { icon: MapPin, label: "Pincode", value: lead.sender_pincode },
    { icon: MapPin, label: "Country", value: lead.sender_country_iso },
    { icon: Package, label: "Product", value: lead.query_product_name },
    { icon: Package, label: "MCAT", value: lead.query_mcat_name },
    { icon: Clock, label: "Call Duration", value: lead.call_duration },
    { icon: Phone, label: "Receiver Mobile", value: lead.receiver_mobile },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
              {(lead.sender_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{lead.sender_name ?? "Unknown Lead"}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
                {lead.is_matched && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Matched
                  </span>
                )}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {QUERY_TYPE_LABELS[lead.query_type] ?? lead.query_type}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Subject & Message */}
          {lead.subject && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageSquare className="h-4 w-4 text-blue-500" /> Subject
              </div>
              <p className="mt-1 text-sm text-slate-600">{lead.subject}</p>
            </div>
          )}
          {lead.query_message && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageSquare className="h-4 w-4 text-blue-500" /> Message
              </div>
              <p className="mt-1 text-sm text-slate-600">{lead.query_message}</p>
            </div>
          )}

          {/* Contact Fields */}
          <div className="mb-4">
            <h4 className="mb-3 text-sm font-bold text-slate-700">Contact Information</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => {
                if (!f.value) return null;
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{f.label}</p>
                      <p className="truncate text-sm font-medium text-slate-700">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <History className="h-4 w-4 text-blue-500" /> Activity History
            </h4>
            {loadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                No activity recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      h.action === "contacted" ? "bg-emerald-100" : h.action === "skipped" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      {h.action === "contacted" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : h.action === "skipped" ? (
                        <XCircle className="h-4 w-4 text-amber-600" />
                      ) : (
                        <History className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize text-slate-700">{h.action}</p>
                      {h.action_details && <p className="text-xs text-slate-500">{h.action_details}</p>}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(h.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={() => onStatusChange("contacted", "Marked as contacted from lead details")}
            disabled={lead.status === "contacted"}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Phone className="h-4 w-4" /> Mark Contacted
          </button>
          <button
            onClick={() => onStatusChange("skipped", "Skipped from lead details")}
            disabled={lead.status === "skipped"}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PhoneOff className="h-4 w-4" /> Skip
          </button>
          <button
            onClick={() => onStatusChange("failed", "Marked as failed")}
            disabled={lead.status === "failed"}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <XCircle className="h-4 w-4" /> Mark Failed
          </button>
          <button
            onClick={() => {
              const note = prompt("Enter a note:");
              if (note) onAddNote(note);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4" /> Add Note
          </button>
        </div>
      </div>
    </div>
  );
}

