"use client";

import { useState, useEffect } from "react";
import type { AuthState, Role } from "@/lib/data/types";
import { useSimulation } from "@/lib/simulation/engine";
import LoginScreen from "@/components/auth/LoginScreen";
import RiderRegistration from "@/components/auth/RiderRegistration";
import PlatformRegistration from "@/components/auth/PlatformRegistration";
import Header from "@/components/shared/Header";
import Toast, { useToast } from "@/components/shared/Toast";
import RiderDashboard from "@/components/rider/RiderDashboard";
import PlatformDashboard from "@/components/platform/PlatformDashboard";
import AdminDashboard from "@/components/admin/AdminDashboard";

const STORAGE_KEY = "gigshift_auth_v3";
type AppState = "login" | "register_rider" | "register_platform" | "app";
interface LoginData { role: Role; email: string; mobile: string; language: string; }

export default function App() {
  const [appState, setAppState]   = useState<AppState>("login");
  const [loginData, setLoginData] = useState<LoginData | null>(null);
  const [auth, setAuth]           = useState<AuthState | null>(null);
  const [darkMode, setDarkMode]   = useState(false);
  const [mounted, setMounted]     = useState(false);

  const { snapshots, weekly, lastTick, tickCount, pulseId } = useSimulation();
  const toast = useToast();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { setAuth(JSON.parse(saved)); setAppState("app"); }
    } catch {}
  }, []);

  function handleLogin(role: Role, name: string, email: string, mobile: string, language: string) {
    if (role === "admin") {
      const state: AuthState = { role, name, email, mobile, language };
      setAuth(state);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
      setAppState("app");
      return;
    }
    setLoginData({ role, email, mobile, language });
    setAppState(role === "rider" ? "register_rider" : "register_platform");
  }

  function handleRegistrationComplete(name: string) {
    if (!loginData) return;
    const state: AuthState = { role: loginData.role, name, email: loginData.email, mobile: loginData.mobile, language: loginData.language };
    setAuth(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    setAppState("app");
    toast.success("Welcome to GigShift", `Signed in as ${name}`);
  }

  function handleLogout() {
    setAuth(null); setLoginData(null); setAppState("login");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  if (!mounted) return null;
  if (appState === "login") return <LoginScreen onAuth={handleLogin} />;
  if (appState === "register_rider" && loginData) return (
    <RiderRegistration email={loginData.email} mobile={loginData.mobile} language={loginData.language}
      onComplete={handleRegistrationComplete} onBack={() => setAppState("login")} />
  );
  if (appState === "register_platform" && loginData) return (
    <PlatformRegistration email={loginData.email} mobile={loginData.mobile}
      onComplete={handleRegistrationComplete} onBack={() => setAppState("login")} />
  );
  if (!auth) return <LoginScreen onAuth={handleLogin} />;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-[#0C0C0C] transition-colors">
        <Header role={auth.role} name={auth.name} language={auth.language}
          darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)}
          lastTick={lastTick} tickCount={tickCount} onLogout={handleLogout} />
        <main>
          {auth.role === "rider" && (
            <RiderDashboard snapshots={snapshots} weekly={weekly} pulseId={pulseId}
              dark={darkMode} name={auth.name} language={auth.language} />
          )}
          {auth.role === "platform" && (
            <PlatformDashboard dark={darkMode} name={auth.name} email={auth.email} />
          )}
          {auth.role === "admin" && (
            <AdminDashboard dark={darkMode} name={auth.name} snapshots={snapshots} tickCount={tickCount} />
          )}
        </main>
        <Toast toasts={toast.toasts} onRemove={toast.remove} />
      </div>
    </div>
  );
}
