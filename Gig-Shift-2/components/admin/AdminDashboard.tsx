"use client";

import { useState, useEffect, useCallback } from "react";
import type { MarketSnapshot } from "@/lib/data/types";
import { PLATFORMS, ZONES, PITCH_STATS } from "@/lib/data/types";
import { CheckCircle, TrendingUp, Users, AlertTriangle } from "lucide-react";

interface Props {
  snapshots: MarketSnapshot[];
  tickCount: number;
  dark: boolean;
  name: string;
}

type Tab = "overview" | "orders" | "dispatch" | "incentives";

const c = (dark: boolean) => ({
  bg: dark ? "bg-[#0D0D18] border-[#1E1E2E]" : "bg-white border-[#E8E8F0]",
  surface: dark ? "bg-[#13131F]" : "bg-[#F8F8FF]",
  text: dark ? "text-[#E8E8F0]" : "text-[#1A1A2E]",
  muted: dark ? "text-[#555]" : "text-[#999]",
  border: dark ? "border-[#1E1E2E]" : "border-[#E8E8F0]",
  divider: dark ? "divide-[#1E1E2E]" : "divide-[#F0F0F8]",
  page: dark ? "bg-[#0A0A0F]" : "bg-[#F5F5FA]",
});

let _seed = 200;
const RIDER_NAMES = ["Ravi K.", "Anita S.", "Suresh M.", "Priya R.", "Deepak J.", "Meena P.", "Karthik B.", "Sneha T.", "Vikram L.", "Anjali N."];

function makeOrders(snapshots: MarketSnapshot[]) {
  return snapshots.map(snap => {
    const p = PLATFORMS.find(p => p.id === snap.platformId)!;
    const zone = ZONES[Math.floor(Math.abs(Math.sin(_seed++ * 1.7)) * ZONES.length)];
    const requested = 5 + Math.floor(Math.abs(Math.sin(_seed * 2.3)) * 30);
    const confirmed = Math.min(requested, Math.round(requested * snap.fulfillmentRate * (0.7 + Math.abs(Math.sin(_seed * 3.1)) * 0.3)));
    const elapsed = 30 + Math.floor(Math.abs(Math.sin(_seed * 4.7)) * 240);
    const fillRate = confirmed / requested;
    const sla: "green" | "yellow" | "red" = fillRate >= 0.85 ? "green" : fillRate >= 0.55 ? "yellow" : "red";
    return { id: `ORD-${1000 + _seed}`, platform: p, zone, requested, confirmed, elapsed, ppd: snap.ppd, sla };
  });
}

function makeDispatches(tick: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const seed = tick + i;
    const p = PLATFORMS[Math.floor(Math.abs(Math.sin(seed * 1.3)) * PLATFORMS.length)];
    const zone = ZONES[Math.floor(Math.abs(Math.sin(seed * 2.7)) * ZONES.length)];
    const rider = RIDER_NAMES[Math.floor(Math.abs(Math.sin(seed * 3.9)) * RIDER_NAMES.length)];
    const nudged = Math.abs(Math.sin(seed * 5.1)) > 0.65;
    const ppd = 35 + Math.floor(Math.abs(Math.sin(seed * 6.2)) * 25);
    const ts = new Date(Date.now() - i * 12000);
    return { id: `D-${seed}`, rider, platform: p, zone, ppd: nudged ? ppd + Math.round(ppd * 0.08) : ppd, nudged, ts };
  });
}

export default function AdminDashboard({ snapshots, tickCount, dark, name }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<ReturnType<typeof makeOrders>>([]);
  const [dispatches, setDispatches] = useState<ReturnType<typeof makeDispatches>>([]);
  const [toast, setToast] = useState<string | null>(null);

  const cls = c(dark);

  useEffect(() => {
    if (snapshots.length) {
      setOrders(makeOrders(snapshots));
      setDispatches(makeDispatches(tickCount));
    }
  }, [snapshots, tickCount]);

  const totalReq = orders.reduce((s, o) => s + o.requested, 0);
  const totalConf = orders.reduce((s, o) => s + o.confirmed, 0);
  const fillRate = totalReq > 0 ? Math.round((totalConf / totalReq) * 100) : 0;
  const redSLAs = orders.filter(o => o.sla === "red").length;
  const shortageSnaps = snapshots.filter(s => s.shortage > 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Live orders" },
    { key: "dispatch", label: "Dispatch" },
    { key: "incentives", label: "Incentives" },
  ];

  return (
    <div className={`min-h-screen ${cls.page}`}>
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#00C896] text-black text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Page title */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-[22px] sm:text-[26px] font-bold tracking-tight ${cls.text}`}>Admin Console</h1>
            <p className={`text-[13px] mt-0.5 ${cls.muted}`}>GigShift · {name} · Full system view</p>
          </div>
          <div className="text-right">
            <div className={`text-[10px] tracking-widest uppercase mb-1 ${cls.muted}`}>Fill rate</div>
            <div className={`text-[30px] font-extrabold ${fillRate >= 80 ? "text-[#00C896]" : fillRate >= 55 ? "text-[#F7B731]" : "text-[#FF4D1C]"}`}>
              {fillRate}%
            </div>
          </div>
        </div>

        {/* KPI bar — pitch numbers */}
        <div className={`rounded-2xl border overflow-hidden mb-5 ${cls.bg}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1E1E2E]">
            {[
              { label: "Active riders", value: PITCH_STATS.totalRiders.toLocaleString(), icon: <Users size={14} />, color: "#00C896" },
              { label: "Dispatched this month", value: PITCH_STATS.dispatchedThisMonth, icon: <TrendingUp size={14} />, color: "#6C5CE7" },
              { label: "SLA rate", value: PITCH_STATS.slaRate, icon: <CheckCircle size={14} />, color: "#00C896" },
              { label: "SLA alerts", value: String(redSLAs), icon: <AlertTriangle size={14} />, color: redSLAs > 0 ? "#FF4D1C" : "#555" },
            ].map(stat => (
              <div key={stat.label} className={`px-5 py-4 ${dark ? "bg-[#0D0D18]" : "bg-white"}`}>
                <div className="flex items-center gap-1.5 mb-2" style={{ color: stat.color }}>
                  {stat.icon}
                  <span className="text-[10px] tracking-widest uppercase font-medium">{stat.label}</span>
                </div>
                <div className={`text-[24px] font-bold`} style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b mb-5 overflow-x-auto ${cls.border}`}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.key ? "border-[#6C5CE7] text-[#9D8FFF]" : `border-transparent ${cls.muted}`
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab — Dispatch Zone Map */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Platform health grid */}
            <div className={`rounded-2xl border ${cls.bg} overflow-hidden`}>
              <div className={`px-5 py-3 border-b text-[11px] font-medium tracking-widest uppercase ${cls.muted} ${cls.border}`}>
                Platform SLA health
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1E1E2E]">
                {snapshots.map(snap => {
                  const p = PLATFORMS.find(pl => pl.id === snap.platformId)!;
                  const pct = Math.round(snap.fulfillmentRate * 100);
                  const col = pct >= 85 ? "#00C896" : pct >= 55 ? "#F7B731" : "#FF4D1C";
                  return (
                    <div key={snap.platformId} className={`px-5 py-4 ${dark ? "bg-[#0D0D18]" : "bg-white"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: p.color }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div className={`text-[13px] font-semibold ${cls.text}`}>{p.name}</div>
                            {snap.surgeMult > 1.1 && (
                              <div className="text-[10px] font-medium" style={{ color: p.color }}>{snap.surgeMult.toFixed(2)}× surge</div>
                            )}
                          </div>
                        </div>
                        <div className="text-[20px] font-bold font-mono" style={{ color: col }}>{pct}%</div>
                      </div>
                      <div className={`h-1.5 rounded-full ${dark ? "bg-[#1E1E2E]" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: col }} />
                      </div>
                      <div className={`flex justify-between text-[11px] mt-1.5 ${cls.muted}`}>
                        <span>{snap.supply} supply · {snap.demand} demand</span>
                        {snap.shortage > 0 && <span className="text-[#FF4D1C]">{snap.shortage} short</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Zone demand grid — the WOW visual */}
            <div className={`rounded-2xl border ${cls.bg} overflow-hidden`}>
              <div className={`px-5 py-3 border-b text-[11px] font-medium tracking-widest uppercase ${cls.muted} ${cls.border}`}>
                Zone demand map — Bangalore
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {ZONES.map((zone, i) => {
                  const seed = tickCount + i;
                  const demand = 30 + Math.floor(Math.abs(Math.sin(seed * 2.1)) * 50);
                  const supply = Math.round(demand * (0.5 + Math.abs(Math.sin(seed * 3.7)) * 0.6));
                  const shortage = Math.max(0, demand - supply);
                  const pct = Math.min(100, Math.round((supply / demand) * 100));
                  const intensity = shortage > 10 ? "high" : shortage > 4 ? "mid" : "ok";
                  const bg = intensity === "high"
                    ? dark ? "bg-[#FF4D1C]/15 border-[#FF4D1C]/30" : "bg-[#FF4D1C]/08 border-[#FF4D1C]/20"
                    : intensity === "mid"
                    ? dark ? "bg-[#F7B731]/12 border-[#F7B731]/30" : "bg-[#F7B731]/08 border-[#F7B731]/20"
                    : dark ? "bg-[#00C896]/10 border-[#00C896]/20" : "bg-[#00C896]/05 border-[#00C896]/15";
                  const dotColor = intensity === "high" ? "#FF4D1C" : intensity === "mid" ? "#F7B731" : "#00C896";

                  // Simulated rider dots
                  const riderCount = Math.min(6, Math.floor(supply / 8));

                  return (
                    <div key={zone} className={`rounded-xl border p-3 ${bg} transition-all duration-500`}>
                      <div className={`text-[10px] font-semibold tracking-wide mb-1 ${cls.text}`}>{zone}</div>
                      <div className="flex gap-0.5 flex-wrap mb-2" style={{ minHeight: 16 }}>
                        {Array.from({ length: riderCount }).map((_, ri) => (
                          <div key={ri} className="w-2 h-2 rounded-full" style={{ background: dotColor, opacity: 0.7 + ri * 0.05 }} />
                        ))}
                        {supply === 0 && <div className={`text-[9px] ${cls.muted}`}>No riders</div>}
                      </div>
                      <div className={`text-[9px] ${cls.muted}`}>{supply}/{demand} · {pct}%</div>
                      <div className={`mt-1 h-1 rounded-full ${dark ? "bg-[#1E1E2E]" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: dotColor }} />
                      </div>
                      {shortage > 0 && (
                        <div className="text-[9px] mt-1 font-semibold" style={{ color: dotColor }}>-{shortage} needed</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue simulation */}
            <div className={`rounded-2xl border p-5 ${cls.bg}`}>
              <div className={`text-[11px] font-medium tracking-widest uppercase mb-4 ${cls.muted}`}>Revenue model snapshot</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Avg platform margin", value: "12%", sub: "per delivery" },
                  { label: "Avg rider earning", value: "₹48", sub: "per delivery" },
                  { label: "Orders/day (sim)", value: "1,240", sub: "across 4 platforms" },
                  { label: "GigShift take", value: "₹71K", sub: "estimated daily" },
                ].map(item => (
                  <div key={item.label} className={`rounded-xl p-4 ${cls.surface}`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-1 ${cls.muted}`}>{item.label}</div>
                    <div className={`text-[22px] font-bold ${cls.text}`}>{item.value}</div>
                    <div className={`text-[11px] ${cls.muted}`}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className={`rounded-2xl border ${cls.bg} overflow-hidden`}>
            <div className={`px-5 py-3 border-b flex items-center justify-between ${cls.border}`}>
              <span className={`text-[11px] font-medium tracking-widest uppercase ${cls.muted}`}>All active platform orders</span>
              <span className={`text-[11px] ${cls.muted}`}>Auto-refresh 4s</span>
            </div>
            {orders.length === 0 ? (
              <div className={`px-5 py-10 text-center ${cls.muted}`}>
                <CheckCircle size={20} className="mx-auto mb-2 text-[#00C896]" />
                <div className="text-[13px]">No active orders right now.</div>
              </div>
            ) : (
              <div>
                {orders.map((order, i) => {
                  const pct = Math.round((order.confirmed / order.requested) * 100);
                  const slaColor = order.sla === "green" ? "#00C896" : order.sla === "yellow" ? "#F7B731" : "#FF4D1C";
                  return (
                    <div key={order.id}
                      className={`px-4 sm:px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 ${i < orders.length - 1 ? `border-b ${cls.border}` : ""}`}
                    >
                      <div className="flex items-center gap-2.5 w-28 shrink-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: order.platform.color }}>
                          {order.platform.name[0]}
                        </div>
                        <span className={`text-[13px] font-semibold ${cls.text}`}>{order.platform.name}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-mono ${cls.muted}`}>{order.id}</div>
                        <div className={`text-[13px] font-medium ${cls.text}`}>{order.zone}</div>
                      </div>
                      <div className="w-36">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className={`font-mono ${cls.text}`}>{order.confirmed}/{order.requested}</span>
                          <span className={cls.muted}>{pct}%</span>
                        </div>
                        <div className={`h-1 rounded-full ${dark ? "bg-[#1E1E2E]" : "bg-gray-100"}`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: slaColor }} />
                        </div>
                      </div>
                      <div className={`text-[11px] font-mono ${cls.muted} hidden sm:block`}>{order.elapsed}s</div>
                      <div className="text-[13px] font-semibold font-mono text-[#00C896]">₹{order.ppd}</div>
                      <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: slaColor + "20", color: slaColor, border: `1px solid ${slaColor}40` }}>
                        {order.sla.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dispatch Tab */}
        {tab === "dispatch" && (
          <div className={`rounded-2xl border ${cls.bg} overflow-hidden`}>
            <div className={`px-5 py-3 border-b flex items-center justify-between ${cls.border}`}>
              <span className={`text-[11px] font-medium tracking-widest uppercase ${cls.muted}`}>Live rider assignments</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#00C896]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C896] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00C896]" />
                </span>
                Live
              </span>
            </div>
            <div>
              {dispatches.map((d, i) => (
                <div key={d.id}
                  className={`px-4 sm:px-5 py-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3 ${i < dispatches.length - 1 ? `border-b ${cls.border}` : ""}`}
                >
                  <div className="w-28 shrink-0">
                    <div className={`text-[13px] font-medium ${cls.text}`}>{d.rider}</div>
                    <div className={`text-[10px] font-mono ${cls.muted}`}>R{1000 + i + tickCount}</div>
                  </div>
                  <div className={`text-[11px] ${cls.muted} hidden sm:block`}>→</div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ background: d.platform.color }}>
                      {d.platform.name[0]}
                    </div>
                    <span className={`text-[13px] font-medium ${cls.text}`}>{d.platform.name}</span>
                  </div>
                  <div className={`flex-1 text-[12px] ${cls.muted}`}>{d.zone}</div>
                  <div className="text-[13px] font-semibold font-mono text-[#00C896]">₹{d.ppd}/del</div>
                  {d.nudged && (
                    <div className="text-[10px] font-semibold px-2 py-0.5 rounded"
                      style={{ background: "#F7B73115", color: "#F7B731", border: "1px solid #F7B73130" }}>
                      Incentivized
                    </div>
                  )}
                  <div className={`text-[11px] font-mono ${cls.muted} hidden md:block`}>
                    {d.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incentives Tab */}
        {tab === "incentives" && (
          <div className="space-y-4">
            <div className={`rounded-2xl border ${cls.bg} overflow-hidden`}>
              <div className={`px-5 py-3 border-b text-[11px] font-medium tracking-widest uppercase ${cls.muted} ${cls.border}`}>
                Active incentive zones
              </div>
              {shortageSnaps.length === 0 ? (
                <div className={`px-5 py-8 text-center ${cls.muted}`}>
                  <CheckCircle size={18} className="mx-auto mb-2 text-[#00C896]" />
                  <div className="text-[13px]">All zones balanced. No incentives active.</div>
                </div>
              ) : (
                shortageSnaps.map((snap, i) => {
                  const p = PLATFORMS.find(pl => pl.id === snap.platformId)!;
                  const nudgePct = Math.min(15, Math.round((snap.shortage / snap.demand) * 30));
                  const nudge = Math.round(snap.ppd * nudgePct / 100);
                  return (
                    <div key={snap.platformId}
                      className={`px-5 py-4 ${i < shortageSnaps.length - 1 ? `border-b ${cls.border}` : ""}`}
                    >
                      <div className="flex flex-wrap items-center gap-4 justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold" style={{ background: p.color }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div className={`text-[14px] font-semibold ${cls.text}`}>{p.name}</div>
                            <div className={`text-[12px] ${cls.muted}`}>{snap.shortage} short · {Math.round(snap.fulfillmentRate * 100)}% fill rate</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 text-right">
                          <div>
                            <div className={`text-[10px] ${cls.muted}`}>Base</div>
                            <div className={`text-[16px] font-bold font-mono ${cls.text}`}>₹{snap.ppd}</div>
                          </div>
                          <div className={cls.muted}>+</div>
                          <div>
                            <div className={`text-[10px] ${cls.muted}`}>Boost</div>
                            <div className="text-[16px] font-bold font-mono text-[#F7B731]">₹{nudge}</div>
                          </div>
                          <div className={cls.muted}>=</div>
                          <div>
                            <div className={`text-[10px] ${cls.muted}`}>Rider sees</div>
                            <div className="text-[20px] font-bold font-mono text-[#00C896]">₹{snap.ppd + nudge}</div>
                          </div>
                        </div>
                      </div>
                      <div className={`mt-3 h-1 rounded-full ${dark ? "bg-[#1E1E2E]" : "bg-gray-100"}`}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, nudgePct * 5)}%`, background: "#F7B731" }} />
                      </div>
                      <div className={`text-[11px] mt-1 ${cls.muted}`}>{nudgePct}% incentive boost active</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
