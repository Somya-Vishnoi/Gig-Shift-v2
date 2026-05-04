"use client";

import { useState, useEffect, useRef } from "react";
import { ZONES } from "@/lib/data/types";
import {
  TIERS,
  TIME_WINDOWS,
  computeQuote,
  generateOrderId,
  getFulfillmentRatePerTick,
  timeWindowToNoticeMinutes,
  type OrderRequest,
  type PriceQuote,
} from "@/lib/simulation/orders";
import { Minus, Plus, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  dark: boolean;
  name: string;
}

type Step = "request" | "quoting" | "quote" | "confirming" | "fulfilling";

export default function PlatformDashboard({ dark, name }: Props) {
  const [step, setStep] = useState<Step>("request");
  const [zone, setZone] = useState(ZONES[0]);
  const [riderCount, setRiderCount] = useState(20);
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[2]);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderRequest | null>(null);
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fulfillInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const noticeMinutes = timeWindowToNoticeMinutes(timeWindow);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleGetQuote() {
    setStep("quoting");
    setTimeout(() => {
      const q = computeQuote(riderCount, zone, noticeMinutes);
      setQuote(q);
      setStep("quote");
    }, 900);
  }

  function handleConfirmOrder() {
    if (!quote) return;
    setStep("confirming");
    setTimeout(() => {
      const order: OrderRequest = {
        id: generateOrderId(),
        zone,
        ridersRequested: riderCount,
        timeWindow,
        noticeMinutes,
        placedAt: new Date(),
        tier: quote.tier.name,
        quotedPPD: quote.finalPPD,
        totalQuote: quote.totalCost,
        status: "fulfilling",
        ridersConfirmed: 0,
      };
      setActiveOrder(order);
      setStep("fulfilling");
      startFulfillment(order, quote);
      showToast(`Order ${order.id} confirmed — riders dispatching`);
    }, 600);
  }

  function startFulfillment(order: OrderRequest, q: PriceQuote) {
    let confirmed = 0;
    const target = order.ridersRequested;
    fulfillInterval.current = setInterval(() => {
      const rate = getFulfillmentRatePerTick(q.tier.name, target);
      confirmed = Math.min(target, confirmed + rate);
      setActiveOrder(prev =>
        prev ? { ...prev, ridersConfirmed: confirmed, status: confirmed >= target ? "fulfilled" : "fulfilling" } : prev
      );
      if (confirmed >= target) {
        clearInterval(fulfillInterval.current!);
        const done: OrderRequest = { ...order, ridersConfirmed: target, status: "fulfilled" };
        setOrders(prev => [done, ...prev]);
        showToast(`Order fully fulfilled — ${target} riders confirmed`);
      }
    }, 1800);
  }

  function handleNewOrder() {
    if (fulfillInterval.current) clearInterval(fulfillInterval.current);
    setActiveOrder(null);
    setQuote(null);
    setStep("request");
  }

  const fulfillPct = activeOrder
    ? Math.round((activeOrder.ridersConfirmed / activeOrder.ridersRequested) * 100)
    : 0;

  const predictedTier = noticeMinutes < 30 || riderCount > 50 ? TIERS[2] : riderCount > 10 ? TIERS[1] : TIERS[0];

  const c = {
    bg: dark ? "bg-[#0D0D18] border-[#1E1E2E]" : "bg-white border-[#E8E8F0]",
    text: dark ? "text-[#E8E8F0]" : "text-[#1A1A2E]",
    muted: dark ? "text-[#555]" : "text-[#999]",
    input: dark ? "bg-[#13131F] border-[#1E1E2E] text-[#E8E8F0]" : "bg-[#F8F8FF] border-[#E8E8F0] text-[#1A1A2E]",
    surface: dark ? "bg-[#13131F]" : "bg-[#F8F8FF]",
    page: dark ? "bg-[#0A0A0F]" : "bg-[#F5F5FA]",
  };

  return (
    <div className={`min-h-screen ${c.page}`}>
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#00C896] text-black text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-[20px] font-bold ${c.text}`}>Platform Ops</h2>
          <p className={`text-[13px] mt-0.5 ${c.muted}`}>{name} · Request riders, get pricing, track fulfillment</p>
        </div>

        {/* Tier info strip */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {TIERS.map(t => (
            <div key={t.name}
              className={`rounded-xl px-3 py-3 border text-center transition-all ${c.bg} ${predictedTier.name === t.name && step === "request" ? "ring-2" : ""}`}
              style={{ ringColor: t.color }}
            >
              <div className="text-[10px] font-bold mb-1" style={{ color: t.color }}>{t.label}</div>
              <div className={`text-[18px] font-extrabold ${c.text}`}>₹{t.basePPD}</div>
              <div className={`text-[10px] mt-0.5 ${c.muted}`}>{t.description}</div>
            </div>
          ))}
        </div>

        {/* Past orders — always visible at top if any */}
        {orders.length > 0 && step !== "fulfilling" && (
          <div className={`rounded-2xl border mb-5 overflow-hidden ${c.bg}`}>
            <div className={`px-5 py-3 border-b text-[11px] font-medium tracking-widest uppercase ${c.muted} ${dark ? "border-[#1E1E2E]" : "border-[#E8E8F0]"}`}>
              Order history ({orders.length})
            </div>
            {orders.slice(0, 3).map((o, i) => {
              const tier = TIERS.find(t => t.name === o.tier)!;
              return (
                <div key={o.id} className={`px-5 py-3.5 flex flex-wrap gap-3 items-center justify-between ${i < Math.min(orders.length, 3) - 1 ? `border-b ${dark ? "border-[#1E1E2E]" : "border-[#F0F0F8]"}` : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: tier.color, color: "#000" }}>{tier.label}</div>
                    <span className={`font-mono text-[12px] ${c.text}`}>{o.id}</span>
                    <span className={`text-[12px] ${c.muted}`}>{o.zone} · {o.timeWindow}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[12px] font-mono ${c.text}`}>{o.ridersConfirmed}/{o.ridersRequested} riders</span>
                    <span className="text-[12px] font-bold text-[#00C896]">₹{o.totalQuote}</span>
                    <CheckCircle size={14} className="text-[#00C896]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Request form */}
        {(step === "request" || step === "quoting") && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${c.bg}`}>
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-5 ${c.muted}`}>New rider request</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className={`text-[11px] tracking-wider uppercase block mb-2 ${c.muted}`}>Zone</label>
                <select value={zone} onChange={e => setZone(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer border ${c.input}`}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-[11px] tracking-wider uppercase block mb-2 ${c.muted}`}>When</label>
                <select value={timeWindow} onChange={e => setTimeWindow(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer border ${c.input}`}>
                  {TIME_WINDOWS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Stepper — replaces slider */}
            <div className="mb-5">
              <label className={`text-[11px] tracking-wider uppercase block mb-3 ${c.muted}`}>Riders needed</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setRiderCount(c => Math.max(1, c - 5))}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer hover:border-[#6C5CE7] transition-colors ${c.bg}`}
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 text-center">
                  <div className={`text-[40px] font-extrabold ${c.text}`}>{riderCount}</div>
                  <div className={`text-[11px] ${c.muted}`}>riders</div>
                </div>
                <button
                  onClick={() => setRiderCount(c => Math.min(150, c + 5))}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer hover:border-[#6C5CE7] transition-colors ${c.bg}`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex justify-between mt-3">
                {[1, 10, 25, 50, 100, 150].map(n => (
                  <button key={n} onClick={() => setRiderCount(n)}
                    className={`text-[11px] px-2 py-1 rounded cursor-pointer transition-colors ${riderCount === n ? "text-[#6C5CE7] font-semibold" : c.muted}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier preview */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 mb-5 transition-all"
              style={{ background: `${predictedTier.color}12`, border: `1px solid ${predictedTier.color}40` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: predictedTier.color }} />
              <span className="font-semibold text-[13px]" style={{ color: predictedTier.color }}>{predictedTier.label} tier</span>
              <span className={`text-[12px] ${c.muted}`}>· {predictedTier.description}</span>
              <span className="ml-auto font-bold font-mono text-[13px]" style={{ color: predictedTier.color }}>₹{predictedTier.basePPD}/rider</span>
            </div>

            <button
              onClick={handleGetQuote}
              disabled={step === "quoting"}
              className="w-full py-3 rounded-xl font-semibold text-[14px] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #6C5CE7, #FF4D1C)", color: "#fff" }}
            >
              {step === "quoting" ? <><Loader2 size={16} className="animate-spin" /> Getting quote...</> : "Get price quote →"}
            </button>
          </div>
        )}

        {/* Quote */}
        {step === "quote" && quote && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${c.bg}`}>
            <div className={`text-[11px] font-medium tracking-widest uppercase mb-5 ${c.muted}`}>Price quote</div>

            <div className="rounded-xl p-5 mb-5"
              style={{ background: `${quote.tier.color}10`, border: `1px solid ${quote.tier.color}40` }}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider"
                  style={{ background: quote.tier.color, color: "#000" }}>
                  {quote.tier.label.toUpperCase()} TIER
                </div>
                <span className={`text-[12px] ${c.muted}`}>{zone} · {timeWindow}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Riders", value: riderCount.toString() },
                  { label: "Rate/rider", value: `₹${quote.finalPPD}`, color: quote.tier.color },
                  { label: "Total", value: `₹${quote.totalCost}` },
                ].map(item => (
                  <div key={item.label}>
                    <div className={`text-[10px] uppercase tracking-wider mb-1 ${c.muted}`}>{item.label}</div>
                    <div className={`text-[26px] font-extrabold ${c.text}`} style={{ color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className={`${dark ? "bg-[#0D0D18]" : "bg-white"} rounded-lg p-3 text-[11px] font-mono`}>
                <div className={`mb-1.5 ${c.muted}`}>Breakdown</div>
                <div className="flex gap-4 flex-wrap">
                  <span className={c.text}>Base ₹{quote.basePPD}</span>
                  <span style={{ color: quote.multipliers.hour > 1.2 ? "#FF4D1C" : "#00C896" }}>Time ×{quote.multipliers.hour.toFixed(2)}</span>
                  <span style={{ color: quote.multipliers.zone > 1.1 ? "#F7B731" : "#00C896" }}>Zone ×{quote.multipliers.zone.toFixed(2)}</span>
                  <span style={{ color: quote.multipliers.notice > 1.2 ? "#FF4D1C" : "#00C896" }}>Notice ×{quote.multipliers.notice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("request")}
                className={`flex-1 py-3 rounded-xl text-[13px] font-semibold border cursor-pointer transition-colors ${dark ? "border-[#1E1E2E] text-[#555] hover:text-[#E8E8F0]" : "border-[#E8E8F0] text-[#999] hover:text-[#1A1A2E]"}`}>
                Edit
              </button>
              <button onClick={handleConfirmOrder}
                className="flex-1 py-3 rounded-xl font-semibold text-[14px] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ background: quote.tier.color, color: "#000" }}>
                Confirm order →
              </button>
            </div>
          </div>
        )}

        {/* Confirming loading */}
        {step === "confirming" && (
          <div className={`rounded-2xl border p-8 text-center ${c.bg}`}>
            <Loader2 size={28} className="animate-spin mx-auto mb-3 text-[#6C5CE7]" />
            <div className={`text-[14px] font-medium ${c.text}`}>Dispatching riders...</div>
            <div className={`text-[12px] mt-1 ${c.muted}`}>Matching your zone and time window</div>
          </div>
        )}

        {/* Fulfillment */}
        {step === "fulfilling" && activeOrder && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${c.bg}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className={`text-[11px] font-mono ${c.muted}`}>{activeOrder.id}</div>
                <div className={`text-[15px] font-semibold mt-0.5 ${c.text}`}>{activeOrder.zone} · {activeOrder.timeWindow}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                activeOrder.status === "fulfilled" ? "bg-[#00C896] text-black" : "bg-[#F7B731] text-black animate-pulse"
              }`}>
                {activeOrder.status === "fulfilled" ? "Fulfilled" : "Dispatching"}
              </div>
            </div>

            <div className="text-center mb-5">
              <div className="text-[64px] sm:text-[80px] font-extrabold leading-none transition-all duration-300"
                style={{ color: activeOrder.status === "fulfilled" ? "#00C896" : "#F7B731" }}>
                {activeOrder.ridersConfirmed}
              </div>
              <div className={`text-[13px] mt-1 ${c.muted}`}>of {activeOrder.ridersRequested} riders confirmed</div>
            </div>

            <div className={`h-2.5 rounded-full mb-2 ${dark ? "bg-[#1E1E2E]" : "bg-gray-100"}`}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${fulfillPct}%`,
                  background: activeOrder.status === "fulfilled" ? "#00C896" : "linear-gradient(90deg, #6C5CE7, #F7B731)",
                }} />
            </div>
            <div className={`flex justify-between text-[11px] mb-5 ${c.muted}`}>
              <span>{fulfillPct}% filled</span>
              <span>{activeOrder.status === "fulfilled" ? "Complete" : `${activeOrder.ridersRequested - activeOrder.ridersConfirmed} remaining`}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Rate/rider", value: `₹${activeOrder.quotedPPD}`, color: "#6C5CE7" },
                { label: "Total cost", value: `₹${activeOrder.totalQuote}`, color: "#F7B731" },
                { label: "Tier", value: activeOrder.tier.toUpperCase(), color: TIERS.find(t => t.name === activeOrder.tier)?.color },
              ].map(m => (
                <div key={m.label} className={`rounded-xl p-3 ${c.surface}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 ${c.muted}`}>{m.label}</div>
                  <div className="text-[18px] font-bold" style={{ color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {activeOrder.status === "fulfilled" && (
              <button onClick={handleNewOrder}
                className="w-full py-3 rounded-xl font-semibold text-[14px] cursor-pointer hover:opacity-90 transition-all"
                style={{ background: "#00C896", color: "#000" }}>
                Place another order →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
