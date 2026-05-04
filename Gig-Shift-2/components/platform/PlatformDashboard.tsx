"use client";

import { useState, useEffect, useRef } from "react";
import { ZONES } from "@/lib/data/types";
import {
  TIERS, TIME_WINDOWS, computeQuote, generateOrderId,
  getFulfillmentRatePerTick, timeWindowToNoticeMinutes,
  type OrderRequest, type PriceQuote,
} from "@/lib/simulation/orders";
import { ChevronDown, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface Props {
  dark: boolean;
  name: string;
  email?: string;
}

type Step = "request" | "quote" | "fulfilling";
type HistoryTab = "active" | "history";

export default function PlatformDashboard({ dark, name, email: _email }: Props) {
  const [step, setStep] = useState<Step>("request");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("active");
  const [zone, setZone] = useState(ZONES[0]);
  const [riderCount, setRiderCount] = useState(20);
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[2]);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderRequest | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const fulfillInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const noticeMinutes = timeWindowToNoticeMinutes(timeWindow);

  useEffect(() => {
    if (step === "quote") setQuote(computeQuote(riderCount, zone, noticeMinutes));
  }, [riderCount, zone, timeWindow, step, noticeMinutes]);

  function handleGetQuote() {
    setQuote(computeQuote(riderCount, zone, noticeMinutes));
    setStep("quote");
  }

  function handleConfirm() {
    if (!quote) return;
    const order: OrderRequest = {
      id: generateOrderId(), zone, ridersRequested: riderCount,
      timeWindow, noticeMinutes, placedAt: new Date(),
      tier: quote.tier.name, quotedPPD: quote.finalPPD,
      totalQuote: quote.totalCost, status: "fulfilling", ridersConfirmed: 0,
    };
    setActiveOrder(order);
    setStep("fulfilling");
    let confirmed = 0;
    fulfillInterval.current = setInterval(() => {
      const rate = getFulfillmentRatePerTick(quote.tier.name, riderCount);
      confirmed = Math.min(riderCount, confirmed + rate);
      setActiveOrder(prev => prev ? { ...prev, ridersConfirmed: confirmed, status: confirmed >= riderCount ? "fulfilled" : "fulfilling" } : prev);
      if (confirmed >= riderCount) {
        clearInterval(fulfillInterval.current!);
        const done: OrderRequest = { ...order, ridersConfirmed: riderCount, status: "fulfilled" };
        setOrders(prev => [done, ...prev]);
      }
    }, 1800);
  }

  function handleReset() {
    fulfillInterval.current && clearInterval(fulfillInterval.current);
    setActiveOrder(null);
    setQuote(null);
    setStep("request");
  }

  const surface = dark ? "bg-[#111827] border-gray-800" : "bg-white border-gray-200";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const heading = dark ? "text-gray-100" : "text-gray-900";
  const sub = dark ? "text-gray-500" : "text-gray-400";
  const divider = dark ? "border-gray-800" : "border-gray-100";
  const inputClass = `w-full px-3.5 py-2.5 rounded-lg border text-[14px] outline-none transition-colors ${
    dark
      ? "bg-[#0C0C0C] border-gray-800 text-gray-100 focus:border-[#059669]"
      : "bg-white border-gray-200 text-gray-900 focus:border-[#059669]"
  }`;

  const fulfillPct = activeOrder
    ? Math.round((activeOrder.ridersConfirmed / activeOrder.ridersRequested) * 100)
    : 0;

  const tier = TIERS.find(t => t.name === (noticeMinutes < 30 || riderCount > 50 ? "surge" : riderCount > 10 ? "standard" : "basic"))!;

  return (
    <div className={`min-h-screen ${dark ? "bg-[#0C0C0C]" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-[24px] font-semibold tracking-tight mb-1 ${heading}`}>
              Platform Operations
            </h1>
            <p className={`text-[14px] ${muted}`}>{name} · Request and manage rider dispatch</p>
          </div>
          {orders.length > 0 && (
            <div className="flex gap-1">
              {(["active", "history"] as const).map(t => (
                <button key={t} onClick={() => setHistoryTab(t)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg cursor-pointer transition-colors ${
                    historyTab === t
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : `${muted} hover:bg-gray-100 dark:hover:bg-gray-800`
                  }`}>
                  {t === "active" ? "New order" : `History (${orders.length})`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* History view */}
        {historyTab === "history" && orders.length > 0 && (
          <div className="gs-fade-in">
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>Order history</span>
              </div>
              {orders.map((o, i) => {
                const t = TIERS.find(t => t.name === o.tier)!;
                return (
                  <div key={o.id} className={`px-4 py-4 flex items-center justify-between ${i < orders.length - 1 ? `border-b ${divider}` : ""}`}>
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-[#059669] shrink-0" />
                      <div>
                        <div className={`text-[13px] font-semibold ${heading}`}>{o.id}</div>
                        <div className={`text-[12px] ${muted}`}>{o.zone} · {o.timeWindow}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-[12px] font-mono ${heading}`}>{o.ridersConfirmed}/{o.ridersRequested} riders</div>
                        <div className={`text-[11px] ${muted}`}>{t.label} tier</div>
                      </div>
                      <div className={`text-[15px] font-semibold text-[#059669]`}>₹{o.totalQuote}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active: Request / Quote / Fulfilling */}
        {historyTab === "active" && (
          <div className="space-y-4 gs-fade-in">

            {/* Tier info bar */}
            <div className={`rounded-xl border ${surface} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${divider}`}>
                <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>Service tiers</span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                {TIERS.map(t => (
                  <div key={t.name} className={`px-4 py-3 ${tier.name === t.name ? (dark ? "bg-[#059669]/5" : "bg-[#F0FDF4]") : ""}`}>
                    <div className={`text-[11px] font-semibold mb-0.5`} style={{ color: tier.name === t.name ? "#059669" : undefined }}>
                      <span className={tier.name === t.name ? "text-[#059669]" : muted}>{t.label}</span>
                    </div>
                    <div className={`text-[12px] ${muted}`}>{t.description}</div>
                    <div className={`text-[15px] font-semibold mt-1 ${tier.name === t.name ? "text-[#059669]" : heading}`}>
                      ₹{t.basePPD}<span className={`text-[11px] font-normal ${muted}`}>/rider</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step: Request form */}
            {step === "request" && (
              <div className={`rounded-xl border ${surface}`}>
                <div className={`px-5 py-4 border-b ${divider}`}>
                  <span className={`text-[13px] font-semibold ${heading}`}>New rider request</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[12px] font-medium mb-1.5 ${muted}`}>Zone</label>
                      <div className="relative">
                        <select value={zone} onChange={e => setZone(e.target.value)} className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[12px] font-medium mb-1.5 ${muted}`}>Dispatch time</label>
                      <div className="relative">
                        <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)} className={`${inputClass} appearance-none pr-8 cursor-pointer`}>
                          {TIME_WINDOWS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                      </div>
                    </div>
                  </div>

                  {/* Rider count — stepper, not slider */}
                  <div>
                    <label className={`block text-[12px] font-medium mb-1.5 ${muted}`}>Riders required</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setRiderCount(c => Math.max(1, c - 5))}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg font-light cursor-pointer transition-colors ${
                          dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>−</button>
                      <div className="flex-1 relative">
                        <input
                          type="number" value={riderCount}
                          onChange={e => setRiderCount(Math.max(1, Math.min(200, Number(e.target.value))))}
                          className={`${inputClass} text-center text-[18px] font-semibold`}
                        />
                      </div>
                      <button onClick={() => setRiderCount(c => Math.min(200, c + 5))}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg font-light cursor-pointer transition-colors ${
                          dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>+</button>
                      <div className="flex gap-1">
                        {[10, 25, 50, 100].map(n => (
                          <button key={n} onClick={() => setRiderCount(n)}
                            className={`px-2.5 py-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                              riderCount === n
                                ? "bg-[#059669] text-white"
                                : dark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}>{n}</button>
                        ))}
                      </div>
                    </div>
                    <div className={`mt-1.5 text-[11px] ${sub}`}>
                      Current tier: <span className="font-semibold text-[#059669]">{tier.label}</span> · {tier.description}
                    </div>
                  </div>

                  <button onClick={handleGetQuote}
                    className="w-full py-2.5 rounded-lg bg-[#059669] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#047857] transition-colors">
                    Get quote
                  </button>
                </div>
              </div>
            )}

            {/* Step: Quote */}
            {step === "quote" && quote && (
              <div className={`rounded-xl border ${surface} gs-fade-in`}>
                <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
                  <span className={`text-[13px] font-semibold ${heading}`}>Price quote</span>
                  <button onClick={() => setStep("request")} className={`text-[12px] cursor-pointer ${muted} hover:text-gray-700`}>Edit request</button>
                </div>
                <div className="p-5">
                  <div className={`rounded-lg p-4 mb-4 ${dark ? "bg-[#0C0C0C]" : "bg-gray-50"} border ${divider}`}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className={`text-[11px] ${sub} mb-1`}>Riders</div>
                        <div className={`text-[22px] font-bold ${heading}`}>{riderCount}</div>
                      </div>
                      <div>
                        <div className={`text-[11px] ${sub} mb-1`}>Rate per rider</div>
                        <div className="text-[22px] font-bold text-[#059669]">₹{quote.finalPPD}</div>
                      </div>
                      <div>
                        <div className={`text-[11px] ${sub} mb-1`}>Total</div>
                        <div className={`text-[22px] font-bold ${heading}`}>₹{quote.totalCost}</div>
                      </div>
                    </div>

                    <div className={`border-t pt-3 ${divider}`}>
                      <div className={`text-[11px] font-medium mb-2 ${sub}`}>Pricing breakdown</div>
                      <div className="grid grid-cols-4 gap-2 text-[12px]">
                        <div>
                          <div className={sub}>Base</div>
                          <div className={`font-mono font-medium ${heading}`}>₹{quote.basePPD}</div>
                        </div>
                        <div>
                          <div className={sub}>Time</div>
                          <div className={`font-mono font-medium ${quote.multipliers.hour > 1.2 ? "text-amber-500" : "text-[#059669]"}`}>
                            ×{quote.multipliers.hour.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className={sub}>Zone</div>
                          <div className={`font-mono font-medium ${quote.multipliers.zone > 1.1 ? "text-amber-500" : "text-[#059669]"}`}>
                            ×{quote.multipliers.zone.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className={sub}>Notice</div>
                          <div className={`font-mono font-medium ${quote.multipliers.notice > 1.2 ? "text-red-500" : "text-[#059669]"}`}>
                            ×{quote.multipliers.notice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setStep("request")}
                      className={`py-2.5 rounded-lg border text-[13px] font-medium cursor-pointer transition-colors ${
                        dark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}>
                      Back
                    </button>
                    <button onClick={handleConfirm}
                      className="py-2.5 rounded-lg bg-[#059669] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#047857] transition-colors">
                      Confirm order
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Fulfilling */}
            {step === "fulfilling" && activeOrder && (
              <div className={`rounded-xl border ${surface} gs-fade-in`}>
                <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between`}>
                  <div>
                    <span className={`text-[13px] font-semibold ${heading}`}>{activeOrder.id}</span>
                    <span className={`text-[12px] ml-3 ${muted}`}>{activeOrder.zone} · {activeOrder.timeWindow}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[12px] font-medium ${
                    activeOrder.status === "fulfilled" ? "text-[#059669]" : "text-amber-500"
                  }`}>
                    {activeOrder.status === "fulfilled"
                      ? <><CheckCircle size={13} /> Fulfilled</>
                      : <><Clock size={13} /> Dispatching</>
                    }
                  </div>
                </div>
                <div className="p-5">
                  {/* Progress */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <span className={`text-[42px] font-bold tracking-tight leading-none ${heading}`}>
                        {activeOrder.ridersConfirmed}
                      </span>
                      <span className={`text-[16px] ${muted} ml-1`}>/ {activeOrder.ridersRequested} riders</span>
                    </div>
                    <span className={`text-[14px] font-mono font-medium ${muted}`}>{fulfillPct}%</span>
                  </div>

                  <div className={`h-1.5 rounded-full mb-4 ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${fulfillPct}%`,
                        background: activeOrder.status === "fulfilled" ? "#059669" : "#F59E0B"
                      }}
                    />
                  </div>

                  <div className={`grid grid-cols-3 gap-3 pt-3 border-t ${divider} text-center`}>
                    <div>
                      <div className={`text-[11px] ${sub} mb-0.5`}>Rate/rider</div>
                      <div className={`text-[14px] font-semibold ${heading}`}>₹{activeOrder.quotedPPD}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] ${sub} mb-0.5`}>Total cost</div>
                      <div className={`text-[14px] font-semibold ${heading}`}>₹{activeOrder.totalQuote}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] ${sub} mb-0.5`}>Tier</div>
                      <div className={`text-[14px] font-semibold text-[#059669]`}>
                        {TIERS.find(t => t.name === activeOrder.tier)?.label}
                      </div>
                    </div>
                  </div>

                  {activeOrder.status === "fulfilled" && (
                    <button onClick={handleReset}
                      className="w-full mt-4 py-2.5 rounded-lg bg-[#059669] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#047857] transition-colors">
                      Place another order
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Zone demand table */}
            <ZoneDemandTable dark={dark} surface={surface} muted={muted} heading={heading} sub={sub} divider={divider} />
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneDemandTable({ dark, surface, muted, heading, sub, divider }: {
  dark: boolean; surface: string; muted: string; heading: string; sub: string; divider: string;
}) {
  const hour = new Date().getHours();
  const isPeak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 22);

  const data = ZONES.map((z, i) => {
    const base = 35 + ((i * 17 + hour * 3) % 35);
    const demand = isPeak ? Math.round(base * 1.4) : base;
    const supply = Math.round(demand * (0.5 + ((i * 7 + hour) % 50) / 100));
    const gap = Math.max(0, demand - supply);
    return { zone: z, demand, supply, gap, pct: Math.round(Math.min(100, (supply / demand) * 100)) };
  }).sort((a, b) => b.gap - a.gap);

  return (
    <div className={`rounded-xl border ${surface} overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${divider} flex items-center justify-between`}>
        <span className={`text-[11px] font-medium tracking-widest uppercase ${sub}`}>Zone demand</span>
        {isPeak && (
          <span className="text-[11px] font-medium text-amber-500 flex items-center gap-1">
            <AlertTriangle size={11} /> Peak hours active
          </span>
        )}
      </div>
      <div>
        {data.map((z, i) => (
          <div key={z.zone} className={`px-4 py-3 flex items-center gap-4 ${i < data.length - 1 ? `border-b ${divider}` : ""}`}>
            <div className={`w-32 text-[13px] font-medium shrink-0 ${heading}`}>{z.zone}</div>
            <div className="flex-1">
              <div className={`h-1 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${z.pct}%`, background: z.pct >= 90 ? "#059669" : z.pct >= 60 ? "#F59E0B" : "#EF4444" }} />
              </div>
            </div>
            <div className={`text-[12px] font-mono w-16 text-right ${muted}`}>{z.supply}/{z.demand}</div>
            {z.gap > 0 && (
              <div className="text-[11px] text-red-500 w-14 text-right font-medium">−{z.gap}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
