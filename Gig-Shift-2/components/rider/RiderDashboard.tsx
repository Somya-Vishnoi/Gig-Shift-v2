"use client";

import { useState, useEffect } from "react";
import type { MarketSnapshot, WeeklyRow } from "@/lib/data/types";
import { PLATFORMS, ZONES } from "@/lib/data/types";
import { generateGigSlots, type GigSlot } from "@/lib/simulation/gigslots";
import { TrendingUp, TrendingDown, Minus, MapPin, Clock, ChevronRight, AlertCircle } from "lucide-react";

interface Props {
  snapshots: MarketSnapshot[];
  weekly: WeeklyRow[];
  pulseId: string | null;
  dark: boolean;
  name: string;
  language: string;
}

export default function RiderDashboard({ snapshots, weekly, pulseId, dark, name }: Props) {
  const [tab, setTab] = useState<"overview" | "slots" | "earnings">("overview");
  const [slots, setSlots] = useState<GigSlot[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const [acceptedSlot, setAcceptedSlot] = useState<string | null>(null);

  useEffect(() => {
    setSlots(generateGigSlots(tickCount));
    const id = setInterval(() => {
      setTickCount(c => c + 1);
      setSlots(generateGigSlots(tickCount + 1));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...snapshots].sort((a, b) => b.ppd - a.ppd);
  const best = sorted[0];
  const bestPlatform = PLATFORMS.find(p => p.id === best?.platformId);

  const surface = dark ? "bg-[#111827] border-gray-800" : "bg-white border-gray-200";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const heading = dark ? "text-gray-100" : "text-gray-900";
  const sub = dark ? "text-gray-500" : "text-gray-400";
  const divider = dark ? "border-gray-800" : "border-gray-100";

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "slots", label: "Available Slots" },
    { key: "earnings", label: "Earnings Forecast" },
  ] as const;

  return (
    <div className={`min-h-screen ${dark ? "bg-[#0C0C0C]" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className={`text-[24px] font-semibold tracking-tight mb-1 ${heading}`}>
            Good {getTimeOfDay()}, {name.split(" ")[0]}
          </h1>
          <p className={`text-[14px] ${muted}`}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Best opportunity — top card */}
        {best && bestPlatform && (
          <div
            className={`rounded-2xl p-6 mb-6 border ${surface} transition-all duration-500 ${pulseId === best.platformId ? "shadow-md" : ""}`}
          >
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-4 ${sub}`}>
              Best earning opportunity now
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className={`text-[13px] font-medium mb-1 ${muted}`}>{bestPlatform.name}</div>
                <div className={`text-[42px] font-bold tracking-tight leading-none ${heading}`}>
                  ₹{best.ppd}
                  <span className={`text-[16px] font-normal ml-1 ${muted}`}>/delivery</span>
                </div>
                {best.surgeMult > 1.05 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[12px] text-amber-600 dark:text-amber-400 font-medium">
                      {best.surgeMult.toFixed(2)}× surge pricing active
                    </span>
                  </div>
                )}
                {best.shortage > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle size={12} className="text-[#059669]" />
                    <span className="text-[12px] text-[#059669] font-medium">
                      {best.shortage} rider shortage — high demand
                    </span>
                  </div>
                )}
              </div>
              <button
                className="px-5 py-2.5 rounded-xl bg-[#059669] text-white text-[13px] font-semibold hover:bg-[#047857] transition-colors cursor-pointer shrink-0"
                onClick={() => setTab("slots")}
              >
                View slots
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-0 border-b mb-6 ${divider}`}>
          {TABS.map(tab_ => (
            <button
              key={tab_.key}
              onClick={() => setTab(tab_.key)}
              className={`px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                tab === tab_.key
                  ? "border-[#059669] text-[#059669]"
                  : `border-transparent ${muted} hover:text-gray-700 dark:hover:text-gray-300`
              }`}
            >
              {tab_.label}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab === "overview" && (
          <div className="space-y-3 gs-fade-in">
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-3 ${sub}`}>
              All platforms · Live rates
            </div>
            {sorted.map((snap, i) => {
              const p = PLATFORMS.find(pl => pl.id === snap.platformId)!;
              const isPulsing = pulseId === snap.platformId;
              const coveragePct = Math.round(snap.fulfillmentRate * 100);
              return (
                <div
                  key={snap.platformId}
                  className={`rounded-xl border p-4 transition-all duration-300 ${surface} ${isPulsing ? "shadow-sm" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Platform color dot */}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                        style={{ background: p.color }}>
                        {p.name[0]}
                      </div>
                      <div>
                        <div className={`text-[14px] font-semibold ${heading}`}>{p.name}</div>
                        <div className={`text-[12px] ${muted}`}>
                          {snap.supply} online · {snap.demand} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[20px] font-bold tracking-tight ${heading}`}>
                        ₹{snap.ppd}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {snap.trend === "up" && <TrendingUp size={11} className="text-[#059669]" />}
                        {snap.trend === "down" && <TrendingDown size={11} className="text-gray-400" />}
                        {snap.trend === "stable" && <Minus size={11} className="text-gray-400" />}
                        <span className={`text-[11px] ${snap.trend === "up" ? "text-[#059669]" : muted}`}>
                          {snap.surgeMult > 1.05 ? `${snap.surgeMult.toFixed(2)}× surge` : "Standard"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coverage bar */}
                  <div className="mt-3">
                    <div className={`h-[2px] rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, coveragePct)}%`,
                          background: coveragePct >= 90 ? "#059669" : coveragePct >= 60 ? "#F59E0B" : "#EF4444"
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`text-[11px] ${sub}`}>Supply coverage</span>
                      <span className={`text-[11px] font-mono ${sub}`}>{coveragePct}%</span>
                    </div>
                  </div>

                  {i === 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed" style={{ borderColor: dark ? "#1F2937" : "#F3F4F6" }}>
                      <span className="text-[11px] text-[#059669] font-medium">Highest rate right now</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Slots */}
        {tab === "slots" && (
          <div className="gs-fade-in">
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-4 ${sub}`}>
              Open slots near you · Refreshes every 5s
            </div>
            <div className="space-y-2">
              {slots.map(slot => {
                const p = PLATFORMS.find(pl => pl.id === slot.platformId)!;
                const isAccepted = acceptedSlot === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      isAccepted
                        ? "border-[#059669] bg-[#F0FDF4] dark:bg-[#059669]/10"
                        : `${surface}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                          style={{ background: isAccepted ? "#059669" : p.color }}>
                          {isAccepted ? "✓" : p.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[14px] font-semibold ${heading}`}>{p.name}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              slot.status === "open"
                                ? "bg-[#F0FDF4] text-[#059669]"
                                : "bg-amber-50 text-amber-600"
                            }`}>
                              {slot.status === "open" ? "Open" : "Filling"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className={`flex items-center gap-1 text-[12px] ${muted}`}>
                              <MapPin size={10} /> {slot.zone}
                            </span>
                            <span className={`flex items-center gap-1 text-[12px] ${muted}`}>
                              <Clock size={10} /> {slot.expiresInMin + "m"}s left
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-[18px] font-bold ${heading}`}>₹{Math.round(slot.ppd * 3)}</div>
                          <div className={`text-[11px] ${muted}`}>est. {slot.distanceKm}km</div>
                        </div>
                        {!isAccepted ? (
                          <button
                            onClick={() => setAcceptedSlot(slot.id)}
                            className="px-4 py-2 rounded-lg bg-[#059669] text-white text-[12px] font-semibold cursor-pointer hover:bg-[#047857] transition-colors flex items-center gap-1 shrink-0"
                          >
                            Accept <ChevronRight size={12} />
                          </button>
                        ) : (
                          <div className="px-4 py-2 rounded-lg bg-[#059669]/10 text-[#059669] text-[12px] font-semibold shrink-0">
                            Accepted
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Earnings forecast */}
        {tab === "earnings" && (
          <div className="gs-fade-in">
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-4 ${sub}`}>
              7-day PPD forecast by platform
            </div>
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${divider}`}>
                    <th className={`text-left text-[11px] font-medium tracking-wider px-4 py-3 ${sub}`}>Day</th>
                    {PLATFORMS.map(p => (
                      <th key={p.id} className={`text-right text-[11px] font-medium tracking-wider px-4 py-3`}
                        style={{ color: p.color }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekly.map((row, i) => {
                    const isWeekend = i >= 5;
                    const maxVal = Math.max(...PLATFORMS.map(p => row[p.id] as number));
                    return (
                      <tr key={row.day as string} className={`border-b last:border-0 ${divider} ${isWeekend ? (dark ? "bg-[#059669]/5" : "bg-[#F0FDF4]") : ""}`}>
                        <td className={`px-4 py-3 text-[13px] font-medium ${isWeekend ? "text-[#059669]" : heading}`}>
                          {row.day as string}
                          {isWeekend && <span className={`ml-2 text-[10px] font-normal ${muted}`}>peak</span>}
                        </td>
                        {PLATFORMS.map(p => {
                          const val = row[p.id] as number;
                          return (
                            <td key={p.id} className={`px-4 py-3 text-right text-[13px] font-mono ${
                              val === maxVal ? "font-semibold" : muted
                            }`} style={{ color: val === maxVal ? p.color : undefined }}>
                              ₹{val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className={`text-[12px] mt-3 ${sub}`}>
              Weekends show 40–60% higher rates due to demand concentration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
