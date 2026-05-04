"use client";

import { useState, useEffect } from "react";
import type { MarketSnapshot } from "@/lib/data/types";
import { PLATFORMS, ZONES } from "@/lib/data/types";
import { getRiders, getPlatforms, getOrders, type RiderRecord, type PlatformRecord, type OrderRecord } from "@/lib/supabase";
import { generateWorkerActivity, generateLiveOrders } from "@/lib/simulation/gigslots";
import { Users, Building2, TrendingUp, CheckCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  dark: boolean;
  name: string;
  snapshots: MarketSnapshot[];
  tickCount: number;
}

type Tab = "overview" | "riders" | "platforms" | "orders";

export default function AdminDashboard({ dark, name, tickCount }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [riders, setRiders] = useState<RiderRecord[]>([]);
  const [platforms, setPlatforms] = useState<PlatformRecord[]>([]);
  const [dbOrders, setDbOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const liveOrders = generateLiveOrders(tickCount);
  const riderActivity = generateWorkerActivity(tickCount);

  async function fetchAll() {
    setLoading(true);
    const [r, p, o] = await Promise.all([getRiders(), getPlatforms(), getOrders()]);
    if (r.data) setRiders(r.data);
    if (p.data) setPlatforms(p.data);
    if (o.data) setDbOrders(o.data);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // KPIs — mix real DB counts + simulated operational data
  const totalRiders = riders.length || riderActivity.length;
  const totalPlatforms = platforms.length || PLATFORMS.length;
  const activeRiders = riderActivity.filter(r => r.status !== "idle").length;
  const totalOrdersToday = liveOrders.length + dbOrders.length;
  const fulfilledOrders = liveOrders.filter(o => o.status === "fulfilled").length;
  const slaRate = totalOrdersToday > 0 ? Math.round((fulfilledOrders / liveOrders.length) * 100) : 0;
  const totalRevenue = dbOrders.reduce((s, o) => s + (o.total_cost ?? 0), 0);
  const simRevenue = liveOrders.reduce((s, o) => s + o.totalCost, 0);

  const surface = dark ? "bg-[#111827] border-gray-800" : "bg-white border-gray-200";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const heading = dark ? "text-gray-100" : "text-gray-900";
  const sub = dark ? "text-gray-500" : "text-gray-400";
  const divider = dark ? "border-gray-800" : "border-gray-100";
  const rowHover = dark ? "hover:bg-gray-800/50" : "hover:bg-gray-50";

  const TABS = [
    { key: "overview",  label: "Overview" },
    { key: "riders",    label: `Riders (${totalRiders})` },
    { key: "platforms", label: `Platforms (${totalPlatforms})` },
    { key: "orders",    label: "Live Orders" },
  ] as const;

  return (
    <div className={`min-h-screen ${dark ? "bg-[#0C0C0C]" : "bg-gray-50"}`}>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-[24px] font-semibold tracking-tight mb-1 ${heading}`}>Admin Console</h1>
            <p className={`text-[14px] ${muted}`}>
              {name} · Last updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button onClick={fetchAll} disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors ${
              dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            } disabled:opacity-50`}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Registered Riders",   value: totalRiders.toLocaleString(),  sub: `${activeRiders} active now`,        icon: Users,       color: "#059669" },
            { label: "Partner Platforms",    value: totalPlatforms.toString(),      sub: "All zones covered",                 icon: Building2,   color: "#0891B2" },
            { label: "SLA Fulfillment",      value: `${slaRate}%`,                 sub: `${fulfilledOrders}/${liveOrders.length} orders`,  icon: CheckCircle, color: slaRate >= 90 ? "#059669" : slaRate >= 70 ? "#F59E0B" : "#EF4444" },
            { label: "Revenue (session)",    value: `₹${(totalRevenue + simRevenue).toLocaleString()}`, sub: "Real + simulated", icon: TrendingUp,  color: "#7C3AED" },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border p-4 ${surface}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-medium tracking-wider uppercase ${sub}`}>{kpi.label}</span>
                <kpi.icon size={14} style={{ color: kpi.color }} />
              </div>
              <div className={`text-[26px] font-bold tracking-tight leading-none mb-1 ${heading}`}>{kpi.value}</div>
              <div className={`text-[12px] ${sub}`}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-0 border-b mb-6 ${divider}`}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                tab === t.key ? "border-[#059669] text-[#059669]" : `border-transparent ${muted} hover:text-gray-700 dark:hover:text-gray-300`
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab === "overview" && (
          <div className="space-y-4 gs-fade-in">

            {/* Live dispatch */}
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${divider} flex items-center justify-between`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>Live dispatch</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#059669] gs-pulse-dot" />
                  <span className={`text-[11px] ${sub}`}>Auto-updating</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${divider}`}>
                      {["Order ID", "Platform", "Zone", "Riders", "Fill rate", "Status"].map(h => (
                        <th key={h} className={`text-left text-[11px] font-medium tracking-wider px-4 py-2.5 ${sub}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveOrders.map((o, i) => {
                      const p = PLATFORMS.find(p => p.id === o.platformId)!;
                      const pct = Math.round((o.ridersConfirmed / o.ridersRequested) * 100);
                      const statusColor = o.status === "fulfilled" ? "text-[#059669]" : o.status === "at_risk" ? "text-red-500" : "text-amber-500";
                      return (
                        <tr key={o.id} className={`border-b last:border-0 ${divider} transition-colors ${rowHover}`}>
                          <td className={`px-4 py-3 text-[12px] font-mono ${heading}`}>{o.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: p?.color ?? "#059669" }}>
                                {p?.name[0]}
                              </div>
                              <span className={`text-[13px] ${heading}`}>{p?.name}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-[13px] ${muted}`}>{o.zone}</td>
                          <td className={`px-4 py-3 text-[13px] font-mono ${heading}`}>{o.ridersConfirmed}/{o.ridersRequested}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-16 h-1 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 90 ? "#059669" : pct >= 60 ? "#F59E0B" : "#EF4444" }} />
                              </div>
                              <span className={`text-[11px] font-mono ${muted}`}>{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[12px] font-medium capitalize ${statusColor}`}>
                              {o.status === "fulfilling" ? "Filling" : o.status === "fulfilled" ? "Fulfilled" : "At risk"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rider activity */}
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>Rider activity</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${divider}`}>
                      {["Rider", "Zone", "Platform", "Status", "PPD", "Earnings today"].map(h => (
                        <th key={h} className={`text-left text-[11px] font-medium tracking-wider px-4 py-2.5 ${sub}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riderActivity.map((r, i) => {
                      const p = PLATFORMS.find(p => p.id === r.platformId)!;
                      const statusColor = r.status === "delivering" ? "text-[#059669]" : r.status === "idle" ? muted : "text-amber-500";
                      return (
                        <tr key={r.workerId} className={`border-b last:border-0 ${divider} transition-colors ${rowHover}`}>
                          <td className={`px-4 py-3 text-[13px] font-medium ${heading}`}>{r.workerName}</td>
                          <td className={`px-4 py-3 text-[13px] ${muted}`}>{r.zone}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded text-white text-[9px] font-bold flex items-center justify-center shrink-0" style={{ background: p?.color ?? "#059669" }}>{p?.name[0]}</div>
                              <span className={`text-[12px] ${muted}`}>{p?.name}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-[12px] font-medium capitalize ${statusColor}`}>{r.status}</td>
                          <td className={`px-4 py-3 text-[13px] font-mono ${heading}`}>₹{r.ppd}</td>
                          <td className={`px-4 py-3 text-[13px] font-semibold text-[#059669]`}>₹{r.earningsToday}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Riders */}
        {tab === "riders" && (
          <div className="gs-fade-in">
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              {riders.length === 0 && !loading ? (
                <div className="px-4 py-12 text-center">
                  <Users size={32} className={`mx-auto mb-3 ${sub}`} />
                  <p className={`text-[14px] font-medium ${heading}`}>No riders registered yet</p>
                  <p className={`text-[13px] mt-1 ${muted}`}>Riders will appear here after they sign up.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${divider}`}>
                          {["Name", "Email", "Mobile", "Zone", "Vehicle", "Status", "Joined"].map(h => (
                            <th key={h} className={`text-left text-[11px] font-medium tracking-wider px-4 py-2.5 ${sub}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {riders.map((r, i) => (
                          <tr key={r.id ?? i} className={`border-b last:border-0 ${divider} transition-colors ${rowHover}`}>
                            <td className={`px-4 py-3 text-[13px] font-medium ${heading}`}>{r.name}</td>
                            <td className={`px-4 py-3 text-[13px] ${muted}`}>{r.email}</td>
                            <td className={`px-4 py-3 text-[13px] font-mono ${muted}`}>+91 {r.mobile}</td>
                            <td className={`px-4 py-3 text-[13px] ${heading}`}>{r.zone}</td>
                            <td className={`px-4 py-3 text-[13px] capitalize ${muted}`}>{r.vehicle_type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                r.status === "active" ? "bg-[#F0FDF4] text-[#059669]" : "bg-gray-100 text-gray-500"
                              }`}>{r.status}</span>
                            </td>
                            <td className={`px-4 py-3 text-[12px] ${sub}`}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: Platforms */}
        {tab === "platforms" && (
          <div className="gs-fade-in">
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              {platforms.length === 0 && !loading ? (
                <div className="px-4 py-12 text-center">
                  <Building2 size={32} className={`mx-auto mb-3 ${sub}`} />
                  <p className={`text-[14px] font-medium ${heading}`}>No platforms registered yet</p>
                  <p className={`text-[13px] mt-1 ${muted}`}>Platforms will appear here after they sign up.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${divider}`}>
                        {["Company", "Contact", "Email", "Volume", "Zones", "Status", "Joined"].map(h => (
                          <th key={h} className={`text-left text-[11px] font-medium tracking-wider px-4 py-2.5 ${sub}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {platforms.map((p, i) => (
                        <tr key={p.id ?? i} className={`border-b last:border-0 ${divider} transition-colors ${rowHover}`}>
                          <td className={`px-4 py-3 text-[13px] font-semibold ${heading}`}>{p.company_name}</td>
                          <td className={`px-4 py-3 text-[13px] ${heading}`}>{p.contact_name}</td>
                          <td className={`px-4 py-3 text-[13px] ${muted}`}>{p.email}</td>
                          <td className={`px-4 py-3 text-[13px] ${muted}`}>{p.expected_volume}</td>
                          <td className={`px-4 py-3 text-[12px] ${muted}`}>{p.zones?.slice(0, 2).join(", ")}{p.zones?.length > 2 ? ` +${p.zones.length - 2}` : ""}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              p.status === "active" ? "bg-[#F0FDF4] text-[#059669]" : "bg-gray-100 text-gray-500"
                            }`}>{p.status}</span>
                          </td>
                          <td className={`px-4 py-3 text-[12px] ${sub}`}>
                            {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Orders */}
        {tab === "orders" && (
          <div className="gs-fade-in">
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${divider}`}>
                      {["Order ID", "Platform", "Zone", "Riders", "PPD", "Total", "Status", "Time"].map(h => (
                        <th key={h} className={`text-left text-[11px] font-medium tracking-wider px-4 py-2.5 ${sub}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...liveOrders.map(o => ({
                      id: o.id, platformName: PLATFORMS.find(p => p.id === o.platformId)?.name ?? o.platformId,
                      zone: o.zone, requested: o.ridersRequested, confirmed: o.ridersConfirmed,
                      ppd: o.quotedPPD, total: o.totalCost, status: o.status, time: "Live"
                    })), ...dbOrders.map(o => ({
                      id: o.id ?? "—", platformName: o.platform_name, zone: o.zone,
                      requested: o.riders_requested, confirmed: o.riders_confirmed,
                      ppd: o.ppd, total: o.total_cost, status: o.status,
                      time: o.created_at ? new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"
                    }))].map((o, i, arr) => {
                      const statusColor = o.status === "fulfilled" ? "text-[#059669]" : o.status === "at_risk" ? "text-red-500" : "text-amber-500";
                      return (
                        <tr key={`${o.id}-${i}`} className={`border-b last:border-0 ${divider} transition-colors ${rowHover}`}>
                          <td className={`px-4 py-3 text-[12px] font-mono ${heading}`}>{typeof o.id === "string" ? o.id.slice(0, 12) : o.id}</td>
                          <td className={`px-4 py-3 text-[13px] ${heading}`}>{o.platformName}</td>
                          <td className={`px-4 py-3 text-[13px] ${muted}`}>{o.zone}</td>
                          <td className={`px-4 py-3 text-[13px] font-mono ${heading}`}>{o.confirmed}/{o.requested}</td>
                          <td className={`px-4 py-3 text-[13px] font-mono text-[#059669]`}>₹{o.ppd}</td>
                          <td className={`px-4 py-3 text-[13px] font-semibold ${heading}`}>₹{o.total}</td>
                          <td className={`px-4 py-3 text-[12px] font-medium capitalize ${statusColor}`}>
                            {o.status === "fulfilling" ? "Filling" : o.status === "fulfilled" ? "Done" : "At risk"}
                          </td>
                          <td className={`px-4 py-3 text-[12px] ${sub}`}>{o.time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
