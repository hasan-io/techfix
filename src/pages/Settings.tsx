import { Webhook, Database, Zap, Shield, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/indiamart-webhook`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const settings = [
    {
      icon: Webhook,
      title: "Webhook Endpoint",
      description: "Configure this URL in your IndiaMART Push API settings to receive leads.",
      color: "blue" as const,
    },
    {
      icon: Database,
      title: "Database",
      description: "Supabase PostgreSQL — all leads, filters, and history are stored securely.",
      color: "emerald" as const,
    },
    {
      icon: Zap,
      title: "Realtime Updates",
      description: "Live lead updates via Supabase Realtime — new leads appear instantly.",
      color: "amber" as const,
    },
    {
      icon: Shield,
      title: "Security",
      description: "Row Level Security enabled on all tables. Webhook endpoint is authenticated.",
      color: "red" as const,
    },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {settings.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[s.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{s.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Webhook URL */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">IndiaMART Webhook URL</h3>
        <p className="mt-1 text-xs text-slate-500">
          Paste this URL into your IndiaMART Push API configuration to start receiving leads.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <code className="flex-1 truncate text-xs text-slate-600">{webhookUrl}</code>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
          >
            {copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Sample Payload */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">Sample Webhook Payload</h3>
        <p className="mt-1 text-xs text-slate-500">
          The webhook expects a JSON body with a RESPONSE object containing lead fields.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
{`{
  "CODE": 200,
  "STATUS": "SUCCESS",
  "RESPONSE": {
    "UNIQUE_QUERY_ID": "ABC123456",
    "QUERY_TYPE": "B",
    "QUERY_TIME": "2024-04-10 11:17:14",
    "SENDER_NAME": "John Doe",
    "SENDER_MOBILE": "9876543210",
    "SENDER_EMAIL": "john@example.com",
    "SENDER_COMPANY": "Acme Corp",
    "SENDER_CITY": "Mumbai",
    "SENDER_STATE": "Maharashtra",
    "SENDER_COUNTRY_ISO": "IN",
    "QUERY_PRODUCT_NAME": "Pharmaceutical Tablets",
    "QUERY_MESSAGE": "Looking for bulk supply"
  }
}`}
        </pre>
      </div>

      {/* Support */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">Support</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-500">Documentation</span>
            <span className="text-xs text-slate-700">IndiaMART Push API Docs</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-500">Database</span>
            <span className="text-xs text-slate-700">Supabase PostgreSQL</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-500">Version</span>
            <span className="text-xs text-slate-700">1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
