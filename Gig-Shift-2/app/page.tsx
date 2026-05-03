"use client";

import { useState, useEffect } from "react";
import type { AuthState } from "@/lib/data/types";
import { useSimulation } from "@/lib/simulation/engine";
import LoginScreen from "@/components/auth/LoginScreen";
import Header from "@/components/shared/Header";
import RiderDashboard from "@/components/rider/RiderDashboard";
import PlatformDashboard from "@/components/platform/PlatformDashboard";
import AdminDashboard from "@/components/admin/AdminDashboard";

const STORAGE_KEY = "gigshift_auth_v3";

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { snapshots, weekly, lastTick, tickCount, pulseId } = useSimulation();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthState;
        if (["rider", "platform", "admin"].includes(parsed.role)) {
          setAuth(parsed);
        }
      }
    } catch {}
  }, []);

  function handleAuth(
    role: AuthState["role"],
    name: string,
    email: string,
    mobile: string,
    language: string
  ) {
    const state: AuthState = { role, name, email, mobile, language };
    setAuth(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function handleLogout() {
    setAuth(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  if (!mounted) return null;
  if (!auth) return <LoginScreen onAuth={handleAuth} />;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-[#0C0C0C] text-gray-900 dark:text-gray-100 transition-colors">
        <Header
          role={auth.role}
          name={auth.name}
          language={auth.language}
          darkMode={darkMode}
          toggleDark={() => setDarkMode(d => !d)}
          lastTick={lastTick}
          tickCount={tickCount}
          onLogout={handleLogout}
        />
        <main>
          {auth.role === "rider" && (
            <RiderDashboard
              snapshots={snapshots}
              weekly={weekly}
              pulseId={pulseId}
              dark={darkMode}
              name={auth.name}
              language={auth.language}
            />
          )}
          {auth.role === "platform" && (
            <PlatformDashboard
              dark={darkMode}
              name={auth.name}
            />
          )}
          {auth.role === "admin" && (
            <AdminDashboard
              snapshots={snapshots}
              tickCount={tickCount}
              dark={darkMode}
              name={auth.name}
            />
          )}
        </main>
      </div>
    </div>
  );
}
