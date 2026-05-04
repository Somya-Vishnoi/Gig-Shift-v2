"use client";

import { useState } from "react";
import type { Role } from "@/lib/data/types";
import { PITCH_STATS } from "@/lib/data/types";

interface Props {
  onAuth: (role: Role, name: string, email?: string) => void;
}

const ADMIN_EMAIL = "admin@gigshift.in";

// EmailJS — uses service_lm3rjmm
async function sendWelcomeEmail(name: string, email: string, role: string) {
  try {
    await fetch("yZpmfwswhyWbfcUBE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: "service_lm3rjmm",
        template_id: "template_0alg46p", // replace with your actual template ID
        user_id: process.env.NEXT_PUBLIC_EMAILJS_KEY || "YOUR_PUBLIC_KEY",
        template_params: {
          to_name: name,
          to_email: email,
          role: role,
          platform: "GigShift",
        },
      }),
    });
  } catch {
    // Silent — don't break UX if email fails
  }
}

export default function LoginScreen({ onAuth }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<"rider" | "platform" | null>(null);
  const [entering, setEntering] = useState(false);

  const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL;
  const canEnter = name.trim().length > 1 && (isAdmin || selected !== null);

  async function handleEnter() {
    if (!canEnter) return;
    setEntering(true);
    const role: Role = isAdmin ? "admin" : selected!;
    if (email.includes("@")) {
      await sendWelcomeEmail(name.trim(), email.trim(), role);
    }
    setTimeout(() => onAuth(role, name.trim(), email.trim()), 350);
  }

  return (
    <div className="min-h-screen bg-[#070710] flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#6C5CE7 1px, transparent 1px), linear-gradient(90deg, #6C5CE7 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#6C5CE7] opacity-[0.05] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/5 w-80 h-80 bg-[#FF4D1C] opacity-[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">

        {/* Left — value prop (hidden on mobile, shown on lg) */}
        <div className="hidden lg:flex flex-col justify-center px-16 py-12 flex-1 max-w-xl">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF4D1C] to-[#6C5CE7] rounded-xl flex items-center justify-center text-xl shadow-lg">
                ⚡
              </div>
              <span className="text-white text-[20px] font-bold tracking-widest uppercase">GigShift</span>
            </div>
            <h2 className="text-[38px] font-bold text-white leading-tight mb-4">
              The OS for<br />gig logistics.
            </h2>
            <p className="text-[16px] text-[#666] leading-relaxed max-w-sm">
              Platforms get riders in minutes. Riders earn more per delivery.
              GigShift optimises the middle — in real time.
            </p>
          </div>

          {/* Live KPIs */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Active riders", value: PITCH_STATS.totalRiders.toLocaleString() },
              { label: "SLA rate", value: PITCH_STATS.slaRate },
              { label: "Dispatched this month", value: PITCH_STATS.dispatchedThisMonth },
              { label: "Avg fill time", value: PITCH_STATS.avgFillTime },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#0D0D18] border border-[#1E1E2E] rounded-xl px-4 py-3">
                <div className="text-[11px] text-[#444] tracking-widest uppercase mb-1">{stat.label}</div>
                <div className="text-[22px] font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — login form */}
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 lg:px-12">

          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF4D1C] to-[#6C5CE7] rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-lg">
              ⚡
            </div>
            <h1 className="text-[22px] font-bold tracking-widest text-white uppercase">GigShift</h1>
            <p className="text-[11px] text-[#444] tracking-[0.2em] mt-1">The OS for gig logistics</p>
          </div>

          <div
            className={`w-full max-w-sm transition-all duration-300 ${entering ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
          >
            <div className="bg-[#0D0D18] border border-[#1E1E2E] rounded-2xl p-6 shadow-2xl">
              <div className="mb-1 text-[18px] font-semibold text-white">Sign in</div>
              <div className="text-[12px] text-[#444] mb-5">No password needed for demo</div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-[10px] text-[#444] tracking-[0.15em] uppercase block mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  onKeyDown={e => e.key === "Enter" && handleEnter()}
                  className="w-full bg-[#13131F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-[#333] outline-none focus:border-[#6C5CE7] transition-colors"
                />
              </div>

              {/* Email */}
              <div className="mb-5">
                <label className="text-[10px] text-[#444] tracking-[0.15em] uppercase block mb-1.5">
                  Email <span className="text-[#333] normal-case">(optional — for welcome email)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  onKeyDown={e => e.key === "Enter" && handleEnter()}
                  className="w-full bg-[#13131F] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder-[#333] outline-none focus:border-[#6C5CE7] transition-colors"
                />
                {isAdmin && (
                  <div className="mt-1.5 text-[11px] text-[#F7B731]">Admin access unlocked</div>
                )}
              </div>

              {/* Role — hidden for admin */}
              {!isAdmin && (
                <div className="mb-5">
                  <label className="text-[10px] text-[#444] tracking-[0.15em] uppercase block mb-2">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { role: "rider" as const, label: "Rider", sub: "Delivery partner", color: "#00C896" },
                      { role: "platform" as const, label: "Platform", sub: "Ops / Pricing", color: "#6C5CE7" },
                    ].map(opt => (
                      <button
                        key={opt.role}
                        onClick={() => setSelected(opt.role)}
                        className="rounded-xl p-3.5 text-left transition-all duration-150 cursor-pointer active:scale-[0.97] border"
                        style={{
                          background: selected === opt.role ? `${opt.color}12` : "#13131F",
                          borderColor: selected === opt.role ? opt.color : "#1E1E2E",
                          borderWidth: selected === opt.role ? 2 : 1,
                        }}
                      >
                        <div className="text-[13px] font-semibold mb-0.5"
                          style={{ color: selected === opt.role ? opt.color : "#E8E8F0" }}>
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-[#444]">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleEnter}
                disabled={!canEnter}
                className={`w-full py-3 rounded-xl font-semibold text-[14px] transition-all duration-200 ${
                  canEnter
                    ? "bg-gradient-to-r from-[#FF4D1C] to-[#6C5CE7] text-white cursor-pointer hover:opacity-90 active:scale-[0.98]"
                    : "bg-[#13131F] text-[#333] cursor-not-allowed border border-[#1E1E2E]"
                }`}
              >
                {entering ? "Entering..." : "Enter Dashboard →"}
              </button>
            </div>

            {/* Mobile KPIs */}
            <div className="grid grid-cols-2 gap-2 mt-4 lg:hidden">
              {[
                { label: "Active riders", value: PITCH_STATS.totalRiders.toLocaleString() },
                { label: "SLA rate", value: PITCH_STATS.slaRate },
              ].map(stat => (
                <div key={stat.label} className="bg-[#0D0D18] border border-[#1E1E2E] rounded-xl px-3 py-2.5">
                  <div className="text-[10px] text-[#444] uppercase tracking-wider mb-0.5">{stat.label}</div>
                  <div className="text-[18px] font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-[#2a2a2a] mt-4 tracking-wider">
              DEMO · NO REAL DATA STORED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
