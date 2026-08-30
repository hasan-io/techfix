import { useState, useEffect } from "react";
import Sidebar, { type PageId } from "@/components/Sidebar";
import Header from "@/components/Header";
import Dashboard from "@/pages/Dashboard";
import AllLeads from "@/pages/AllLeads";
import Filters from "@/pages/Filters";
import Settings from "@/pages/Settings";
import LeadDetailsModal from "@/components/LeadDetailsModal";
import { supabase } from "@/lib/supabase";
import { useStats } from "@/hooks/useStats";
import { useLeadHistory } from "@/hooks/useLeadHistory";
import type { Lead } from "@/types";

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your lead management system" },
  "all-leads": { title: "All Leads", subtitle: "Browse and manage all incoming leads" },
  "matched-leads": { title: "Matched Leads", subtitle: "Leads matching your active filters" },
  filters: { title: "Filters", subtitle: "Configure lead matching rules" },
  settings: { title: "Settings", subtitle: "System configuration and webhook setup" },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { stats, refetch: refetchStats } = useStats();
  const { history, loading: loadingHistory, refetch: refetchHistory, addHistory } = useLeadHistory(selectedLead?.id ?? null);

  // Global realtime listener to keep matched count fresh
  useEffect(() => {
    const channel = supabase
      .channel("app-global-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => refetchStats())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "leads" }, () => refetchStats())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "leads" }, () => refetchStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetchStats]);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleStatusChange = async (status: string, details?: string) => {
    if (!selectedLead) return;
    const { error } = await supabase
      .from("leads")
      .update({
        status,
        is_contacted: status === "contacted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedLead.id);

    if (error) {
      alert("Failed to update: " + error.message);
      return;
    }

    await addHistory(status, details);

    setSelectedLead((prev) => prev ? { ...prev, status, is_contacted: status === "contacted" } : prev);
    refetchStats();
  };

  const handleAddNote = async (note: string) => {
    if (!selectedLead) return;
    await addHistory("note", note);
  };

  const meta = PAGE_META[currentPage];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} matchedCount={stats.matched_leads} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNavigateSettings={() => handleNavigate("settings")}
          onViewLead={setSelectedLead}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentPage === "dashboard" && (
            <Dashboard onViewLead={setSelectedLead} onNavigate={(p) => handleNavigate(p)} />
          )}
          {currentPage === "all-leads" && (
            <AllLeads onViewLead={setSelectedLead} onLeadUpdated={refetchStats} />
          )}
          {currentPage === "matched-leads" && (
            <AllLeads matchedOnly onViewLead={setSelectedLead} onLeadUpdated={refetchStats} />
          )}
          {currentPage === "filters" && <Filters />}
          {currentPage === "settings" && <Settings />}
        </main>
      </div>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        history={history}
        loadingHistory={loadingHistory}
        onClose={() => { setSelectedLead(null); refetchHistory(); }}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
      />
    </div>
  );
}
