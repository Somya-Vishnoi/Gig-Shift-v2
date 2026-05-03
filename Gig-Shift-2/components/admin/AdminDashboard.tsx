"use client";

import { useState, useEffect } from "react";
import type { MarketSnapshot } from "@/lib/data/types";
import { PLATFORMS, ZONES } from "@/lib/data/types";
import {
  generateDispatchEvents,
  getSLAStatus,
  type DispatchEvent,
} from "@/lib/simulation/gigslots";
import { CheckCircle, AlertCircle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props {
  snapshots: MarketSnapshot[];
  tickCount: number;
  dark: boolean;
  name: string;
}

interface ActiveOrder {
  id: string;
  platformId: string;
  platformName: string;
  zone: string;
  ridersRequested: number;
  ridersConfirmed: number;
  elapsedSeconds: number;
  ppd: number;
}

let _orderSeed = 100;
function makeOrders(snapshots: MarketSnapshot[]): ActiveOrder[] {
  const orders: ActiveOrder[] = [];
  for (const snap of snapshots) {
    const platform = PLATFORMS.find((p) => p.id === snap.platformId);
    if (!platform) continue;
    const zone = ZONES[Math.floor(Math.abs(Math.sin(_orderSeed++ * 1.7)) * ZONES.length)];
    const requested = 5 + Math.floor(Math.abs(Math.sin(_orderSeed * 2.3)) * 30);
    const confirmed = Math.round(requested * snap.fulfillmentRate * (0.7 + Math.abs(Math.sin(_orderSeed * 3.1)) * 0.3));
    const elapsed = 30 + Math.floor(Math.abs(Math.sin(_orderSeed * 4.7)) * 240);
    orders.push({
      id: `ORD-${1000 + _orderSeed}`,
      platformId: platform.id,
      platformName: platform.name,
      zone,
      ridersRequested: requested,
      ridersConfirmed: Math.min(confirmed, requested),
      elapsedSeconds: elapsed,
      ppd: snap.ppd,
    });
    _orderSeed++;
  }
  return orders;
}

type Tab = "orders" | "dispatch" | "incentives";

export default function AdminDashboard({ snapshots, dark, name }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [dispatchEvents, setDispatchEvents] = useState<DispatchEvent[]>([]);
  const [orders, setOrders] = useState<ActiveOrder[]>([]);

  useEffect(() => {
    if (snapshots.length > 0) {
      setOrders(makeOrders(snapshots));
      setDispatchEvents(generateDispatchEvents(12));
    }
  }, [snapshots]);

  const surface = dark ? "bg-[#111827] border-gray-800" : "bg-white border-gray-200";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const heading = dark ? "text-gray-100" : "text-gray-900";
  const sub = dark ? "text-gray-500" : "text-gray-400";
  const divider = dark ? "border-gray-800" : "border-gray-100";
  const pageBg = dark ? "bg-[#0C0C0C]" : "bg-gray-50";

  const totalRequested = orders.reduce((s, o) => s + o.ridersRequested, 0);
  const totalConfirmed = orders.reduce((s, o) => s + o.ridersConfirmed, 0);
  const overallFill = totalRequested > 0 ? Math.round((totalConfirmed / totalRequested) * 100) : 0;
  const redSLAs = orders.filter(
    (o) => getSLAStatus(o.ridersConfirmed / o.ridersRequested, o.elapsedSeconds) === "red"
  ).length;
  const shortageSnaps = snapshots.filter((s) => s.shortage > 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "orders", label: "Live orders" },
    { key: "dispatch", label: "Dispatch feed" },
    { key: "incentives", label: "Incentives" },
  ];

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-[24px] font-semibold tracking-tight mb-1 ${heading}`}>
              Admin Console
            </h1>
            <p className={`text-[14px] ${muted}`}>
              {name} · Full system visibility
            </p>
          </div>
          {/* System health summary */}
          <div className="text-right">
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-1 ${sub}`}>
              System fill rate
            </div>
            <div className={`text-[32px] font-bold tracking-tight ${
              overallFill >= 80 ? "text-[#059669]" : overallFill >= 55 ? "text-amber-500" : "text-red-500"
            }`}>
              {overallFill}%
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className={`grid grid-cols-4 gap-px rounded-xl overflow-hidden border mb-6 ${surface}`}>
          {[
            { label: "Active platforms", value: PLATFORMS.length, note: "All connected" },
            { label: "Riders requested", value: totalRequested, note: "Across all orders" },
            { label: "Riders confirmed", value: totalConfirmed, note: `${overallFill}% fill rate` },
            { label: "SLA alerts", value: redSLAs, note: redSLAs > 0 ? "Need attention" : "All healthy", alert: redSLAs > 0 },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`px-5 py-4 ${dark ? "bg-[#111827]" : "bg-white"} ${i > 0 ? `border-l ${divider}` : ""}`}
            >
              <div className={`text-[11px] font-medium tracking-widest uppercase mb-2 ${sub}`}>
                {stat.label}
              </div>
              <div className={`text-[26px] font-bold tracking-tight ${stat.alert ? "text-red-500" : heading}`}>
                {stat.value}
              </div>
              <div className={`text-[12px] mt-0.5 ${stat.alert ? "text-red-400" : sub}`}>
                {stat.note}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-0 border-b mb-6 ${divider}`}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-[#059669] text-[#059669]"
                  : `border-transparent ${muted} hover:text-gray-700 dark:hover:text-gray-300`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Live Orders */}
        {tab === "orders" && (
          <div className={`rounded-xl border ${surface} overflow-hidden gs-fade-in`}>
            <div className={`px-5 py-3 border-b ${divider} flex items-center justify-between`}>
              <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>
                All active platform orders
              </span>
              <span className={`text-[11px] ${sub}`}>Auto-refresh 4s</span>
            </div>
            <div>
              {orders.map((order, i) => {
                const platform = PLATFORMS.find(p => p.id === order.platformId)!;
                const fillPct = Math.round((order.ridersConfirmed / order.ridersRequested) * 100);
                const sla = getSLAStatus(order.ridersConfirmed / order.ridersRequested, order.elapsedSeconds);
                const slaColor = sla === "green" ? "#059669" : sla === "yellow" ? "#F59E0B" : "#EF4444";

                return (
                  <div
                    key={order.id}
                    className={`px-5 py-4 flex items-center gap-6 ${i < orders.length - 1 ? `border-b ${divider}` : ""}`}
                  >
                    {/* Platform */}
                    <div className="flex items-center gap-2.5 w-24 shrink-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ background: platform.color }}
                      >
                        {platform.name[0]}
                      </div>
                      <span className={`text-[13px] font-semibold ${heading}`}>{platform.name}</span>
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-mono ${sub}`}>{order.id}</div>
                      <div className={`text-[13px] font-medium mt-0.5 ${heading}`}>{order.zone}</div>
                    </div>

                    {/* Fill progress */}
                    <div className="w-40">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-[12px] font-mono ${heading}`}>
                          {order.ridersConfirmed}/{order.ridersRequested}
                        </span>
                        <span className={`text-[11px] font-mono ${sub}`}>{fillPct}%</span>
                      </div>
                      <div className={`h-1 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${fillPct}%`, background: slaColor }}
                        />
                      </div>
                    </div>

                    {/* Elapsed */}
                    <div className={`text-[12px] font-mono w-12 text-right ${sub}`}>
                      {order.elapsedSeconds}s
                    </div>

                    {/* PPD */}
                    <div className={`text-[13px] font-semibold font-mono w-12 text-right text-[#059669]`}>
                      ₹{order.ppd}
                    </div>

                    {/* SLA pill */}
                    <div
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full w-16 text-center shrink-0"
                      style={{
                        background: `${slaColor}15`,
                        color: slaColor,
                        border: `1px solid ${slaColor}30`,
                      }}
                    >
                      {sla.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Dispatch Feed */}
        {tab === "dispatch" && (
          <div className={`rounded-xl border ${surface} overflow-hidden gs-fade-in`}>
            <div className={`px-5 py-3 border-b ${divider} flex items-center justify-between`}>
              <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>
                Live rider assignments
              </span>
              <span className={`flex items-center gap-1.5 text-[11px] ${sub}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#059669] gs-pulse-dot" />
                Live
              </span>
            </div>
            <div>
              {dispatchEvents.map((ev, i) => {
                const platform = PLATFORMS.find(p => p.id === ev.platformId);
                return (
                  <div
                    key={ev.id}
                    className={`px-5 py-3.5 flex items-center gap-4 ${i < dispatchEvents.length - 1 ? `border-b ${divider}` : ""}`}
                  >
                    {/* Rider */}
                    <div className="w-24 shrink-0">
                      <div className={`text-[13px] font-medium ${heading}`}>{ev.riderName}</div>
                      <div className={`text-[11px] font-mono ${sub}`}>{ev.riderId}</div>
                    </div>

                    {/* Arrow */}
                    <div className={`text-[12px] ${sub}`}>→</div>

                    {/* Platform */}
                    <div className="flex items-center gap-2 w-20 shrink-0">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: platform?.color }}
                      >
                        {ev.platformName[0]}
                      </div>
                      <span className={`text-[13px] font-medium ${heading}`}>{ev.platformName}</span>
                    </div>

                    {/* Zone */}
                    <div className={`flex-1 text-[12px] ${muted}`}>{ev.zone}</div>

                    {/* PPD */}
                    <div className={`text-[13px] font-semibold font-mono text-[#059669]`}>
                      ₹{ev.ppd}/del
                    </div>

                    {/* Nudge badge */}
                    {ev.nudged && (
                      <div
                        className="text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: dark ? "#F59E0B15" : "#FEF3C7",
                          color: "#F59E0B",
                          border: "1px solid #F59E0B30",
                        }}
                      >
                        Incentivized
                      </div>
                    )}

                    {/* Time */}
                    <div className={`text-[11px] font-mono ${sub} shrink-0`}>
                      {ev.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Incentives */}
        {tab === "incentives" && (
          <div className="space-y-4 gs-fade-in">

            {/* Shortage zones */}
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>
                  Active shortage zones — GigShift incentive active
                </span>
              </div>
              {shortageSnaps.length === 0 ? (
                <div className={`px-5 py-8 text-center ${muted} text-[13px]`}>
                  <CheckCircle size={20} className="mx-auto mb-2 text-[#059669]" />
                  All zones balanced — no incentives active
                </div>
              ) : (
                shortageSnaps.map((snap, i) => {
                  const platform = PLATFORMS.find(p => p.id === snap.platformId)!;
                  const nudgePct = Math.min(15, Math.round((snap.shortage / snap.demand) * 30));
                  const nudgePPD = Math.round(snap.ppd * nudgePct / 100);

                  return (
                    <div
                      key={snap.platformId}
                      className={`px-5 py-4 ${i < shortageSnaps.length - 1 ? `border-b ${divider}` : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                            style={{ background: platform.color }}
                          >
                            {platform.name[0]}
                          </div>
                          <div>
                            <div className={`text-[14px] font-semibold ${heading}`}>{platform.name}</div>
                            <div className={`text-[12px] ${muted}`}>
                              {snap.shortage} rider shortage · {Math.round(snap.fulfillmentRate * 100)}% fill rate
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <div className={`text-[11px] ${sub} mb-0.5`}>Base rate</div>
                            <div className={`text-[16px] font-semibold font-mono ${heading}`}>₹{snap.ppd}</div>
                          </div>
                          <div className={`text-[14px] ${sub}`}>+</div>
                          <div className="text-right">
                            <div className={`text-[11px] ${sub} mb-0.5`}>GigShift boost</div>
                            <div className="text-[16px] font-semibold font-mono text-amber-500">₹{nudgePPD}</div>
                          </div>
                          <div className={`text-[14px] ${sub}`}>=</div>
                          <div className="text-right">
                            <div className={`text-[11px] ${sub} mb-0.5`}>Rider sees</div>
                            <div className="text-[20px] font-bold font-mono text-[#059669]">
                              ₹{snap.ppd + nudgePPD}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-3 h-1 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, nudgePct * 5)}%`, background: "#F59E0B" }}
                        />
                      </div>
                      <div className={`text-[11px] mt-1 ${sub}`}>
                        Nudge intensity {nudgePct}% — attracting riders to shortage zone
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Platform SLA grid */}
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-5 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>
                  Platform SLA health
                </span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y" style={{ borderColor: dark ? "#1F2937" : "#F3F4F6" }}>
                {snapshots.map((snap) => {
                  const platform = PLATFORMS.find(p => p.id === snap.platformId)!;
                  const fillPct = Math.round(snap.fulfillmentRate * 100);
                  const slaColor = fillPct >= 85 ? "#059669" : fillPct >= 55 ? "#F59E0B" : "#EF4444";

                  return (
                    <div key={snap.platformId} className={`px-5 py-4 ${dark ? "bg-[#111827]" : "bg-white"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: platform.color }}
                          >
                            {platform.name[0]}
                          </div>
                          <span className={`text-[13px] font-semibold ${heading}`}>{platform.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {snap.trend === "up"
                            ? <ArrowUpRight size={13} className="text-[#059669]" />
                            : <ArrowDownRight size={13} className="text-gray-400" />}
                          <span className="text-[16px] font-bold font-mono" style={{ color: slaColor }}>
                            {fillPct}%
                          </span>
                        </div>
                      </div>
                      <div className={`h-1 rounded-full mb-2 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${fillPct}%`, background: slaColor }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-[11px] ${sub}`}>
                          {snap.supply} supply · {snap.demand} demand
                        </span>
                        {snap.surgeMult > 1.1 && (
                          <span className="text-[11px] text-amber-500 font-medium">
                            {snap.surgeMult.toFixed(2)}× surge
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
