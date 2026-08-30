import { useState, useEffect } from "react";
import { Search, Filter as FilterIcon, RefreshCw, Plus, Trash2, Power, Save } from "lucide-react";
import { useFilters } from "@/hooks/useFilters";
import { supabase } from "@/lib/supabase";
import type { Filter, FilterConfig } from "@/types";
import { QUERY_TYPES, QUERY_TYPE_LABELS } from "@/types";

const EMPTY_CONFIG: FilterConfig = {
  product_names: [],
  countries: [],
  require_mobile: false,
  require_email: false,
  require_whatsapp: false,
  exclude_query_types: [],
};

export default function Filters() {
  const { filters, loading, saveFilter, updateFilter, deleteFilter, refetch } = useFilters();
  const [showEditor, setShowEditor] = useState(false);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [filterName, setFilterName] = useState("");
  const [config, setConfig] = useState<FilterConfig>(EMPTY_CONFIG);
  const [productInput, setProductInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState<string | null>(null);

  const startNew = () => {
    setEditingFilter(null);
    setFilterName("");
    setConfig(EMPTY_CONFIG);
    setShowEditor(true);
  };

  const startEdit = (f: Filter) => {
    setEditingFilter(f);
    setFilterName(f.filter_name);
    setConfig(f.filter_config ?? EMPTY_CONFIG);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!filterName.trim()) {
      alert("Please enter a filter name");
      return;
    }
    try {
      if (editingFilter) {
        await updateFilter(editingFilter.id, { filter_name: filterName, filter_config: config });
      } else {
        await saveFilter({ filter_name: filterName, filter_config: config });
      }
      setShowEditor(false);
      setEditingFilter(null);
      setFilterName("");
      setConfig(EMPTY_CONFIG);
    } catch (err) {
      alert("Failed to save filter: " + (err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this filter? This cannot be undone.")) return;
    try {
      await deleteFilter(id);
    } catch (err) {
      alert("Failed to delete: " + (err as Error).message);
    }
  };

  const toggleActive = async (f: Filter) => {
    try {
      await updateFilter(f.id, { is_active: !f.is_active });
    } catch (err) {
      alert("Failed to toggle: " + (err as Error).message);
    }
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    setReprocessResult(null);
    try {
      const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reprocess-filters`;
      const res = await fetch(funcUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setReprocessResult(`Reprocessed ${data.reprocessed_count ?? 0} leads`);
      refetch();
    } catch (err) {
      setReprocessResult("Error: " + (err as Error).message);
    }
    setReprocessing(false);
  };

  const addProduct = () => {
    if (productInput.trim()) {
      setConfig((c) => ({ ...c, product_names: [...c.product_names, productInput.trim()] }));
      setProductInput("");
    }
  };

  const addCountry = () => {
    if (countryInput.trim()) {
      setConfig((c) => ({ ...c, countries: [...c.countries, countryInput.trim().toUpperCase()] }));
      setCountryInput("");
    }
  };

  const toggleExcludeType = (type: string) => {
    setConfig((c) => ({
      ...c,
      exclude_query_types: c.exclude_query_types.includes(type)
        ? c.exclude_query_types.filter((t) => t !== type)
        : [...c.exclude_query_types, type],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-700">Filter Configuration</h3>
          <p className="text-xs text-slate-500">Define rules to automatically match incoming leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${reprocessing ? "animate-spin" : ""}`} /> Reprocess All
          </button>
          <button
            onClick={startNew}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Filter
          </button>
        </div>
      </div>

      {reprocessResult && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {reprocessResult}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowEditor(false)} />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFilter ? "Edit Filter" : "Create New Filter"}
              </h3>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
              {/* Filter Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter Name</label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g. Premium Pharma Leads"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Product Names */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Product Names (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProduct())}
                    placeholder="Type a product name and press Enter"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button onClick={addProduct} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                    Add
                  </button>
                </div>
                {config.product_names.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {config.product_names.map((p, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {p}
                        <button onClick={() => setConfig((c) => ({ ...c, product_names: c.product_names.filter((_, idx) => idx !== i) }))}>
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Countries */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Countries (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCountry())}
                    placeholder="e.g. IN, US, GB (ISO codes)"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button onClick={addCountry} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                    Add
                  </button>
                </div>
                {config.countries.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {config.countries.map((c, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {c}
                        <button onClick={() => setConfig((cfg) => ({ ...cfg, countries: cfg.countries.filter((_, idx) => idx !== i) }))}>
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Requirements</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={config.require_mobile} onChange={(e) => setConfig((c) => ({ ...c, require_mobile: e.target.checked }))} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Require Mobile Number</span>
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={config.require_email} onChange={(e) => setConfig((c) => ({ ...c, require_email: e.target.checked }))} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Require Email Address</span>
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={config.require_whatsapp} onChange={(e) => setConfig((c) => ({ ...c, require_whatsapp: e.target.checked }))} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Require WhatsApp (Query Type = WA)</span>
                  </label>
                </div>
              </div>

              {/* Exclude Query Types */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Exclude Query Types (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {QUERY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleExcludeType(type)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        config.exclude_query_types.includes(type)
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {QUERY_TYPE_LABELS[type] ?? type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button onClick={() => setShowEditor(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                <Save className="h-4 w-4" /> {editingFilter ? "Update" : "Create"} Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FilterIcon className="h-8 w-8 text-slate-300" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">No filters configured</p>
          <p className="text-xs text-slate-400">Create a filter to start matching leads automatically</p>
          <button onClick={startNew} className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Create First Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((f) => (
            <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800">{f.filter_name}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {f.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.filter_config?.product_names?.length > 0 && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        Products: {f.filter_config.product_names.join(", ")}
                      </span>
                    )}
                    {f.filter_config?.countries?.length > 0 && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                        Countries: {f.filter_config.countries.join(", ")}
                      </span>
                    )}
                    {f.filter_config?.require_mobile && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600">Mobile required</span>}
                    {f.filter_config?.require_email && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600">Email required</span>}
                    {f.filter_config?.require_whatsapp && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-600">WhatsApp required</span>}
                    {f.filter_config?.exclude_query_types?.length > 0 && (
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-600">
                        Excludes: {f.filter_config.exclude_query_types.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(f)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title={f.is_active ? "Deactivate" : "Activate"}>
                    <Power className={`h-4 w-4 ${f.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                  </button>
                  <button onClick={() => startEdit(f)} className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-100 hover:text-blue-600" title="Edit">
                    <Search className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-600" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
