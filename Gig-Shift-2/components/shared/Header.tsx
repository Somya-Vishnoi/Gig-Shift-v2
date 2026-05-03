"use client";

import type { Role } from "@/lib/data/types";
import { t } from "@/lib/data/types";
import { Sun, Moon, LogOut } from "lucide-react";

interface Props {
  role: Role;
  name: string;
  language: string;
  darkMode: boolean;
  toggleDark: () => void;
  lastTick: Date;
  tickCount: number;
  onLogout: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  rider: "Rider",
  platform: "Platform",
  admin: "Admin",
};

export default function Header({ role, name, language, darkMode, toggleDark, lastTick, tickCount, onLogout }: Props) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-white/95 dark:bg-[#0C0C0C]/95 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 bg-[#059669] rounded-md flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L10.5 6H15L11.5 9.5L13 15L8 12L3 15L4.5 9.5L1 6H5.5L8 1Z" fill="white"/>
          </svg>
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">GigShift</span>
        {role === "admin" && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#059669] text-white tracking-wide">ADMIN</span>
        )}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#059669] gs-pulse-dot" />
        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
          {t(language, "liveLabel")} · {lastTick.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-gray-500 dark:text-gray-400 hidden sm:block">
          {name} · <span className="text-gray-400">{ROLE_LABELS[role]}</span>
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleDark}
            className="p-2 rounded-md cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={darkMode ? t(language, "lightMode") : t(language, "darkMode")}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-md cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title={t(language, "logout")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
