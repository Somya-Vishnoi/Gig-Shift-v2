export interface Platform {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface DataRow {
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  platformId: string;
  zone: string;
  demand: number;
  supply: number;
  basePPD: number;
  surgeMult: number;
  ppd: number;
  shortage: number;
  fulfillmentRate: number;
  weather: "clear" | "rain" | "heavy_rain";
  eventBoost: boolean;
}

export interface MarketSnapshot {
  platformId: string;
  demand: number;
  supply: number;
  shortage: number;
  ppd: number;
  surgeMult: number;
  fulfillmentRate: number;
  trend: "up" | "down" | "stable";
}

export interface WeeklyRow {
  day: string;
  [platformId: string]: string | number;
}

export type Role = "rider" | "platform" | "admin";

export interface AuthState {
  role: Role;
  name: string;
  email?: string;
}

export const PLATFORMS: Platform[] = [
  { id: "swft",   name: "Swft",   color: "#FF4D1C", icon: "⚡" },
  { id: "grubgo", name: "GrubGo", color: "#00C896", icon: "🛵" },
  { id: "dropd",  name: "Dropd",  color: "#6C5CE7", icon: "📦" },
  { id: "rushly", name: "Rushly", color: "#F7B731", icon: "🏃" },
];

export const ZONES = [
  "Koramangala", "Indiranagar", "HSR Layout", "Whitefield",
  "Jayanagar", "MG Road", "Electronic City", "Marathahalli",
  "BTM Layout", "JP Nagar",
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Mock KPIs for pitch
export const PITCH_STATS = {
  totalRiders: 2847,
  activePlatforms: 12,
  dispatchedThisMonth: "₹2.4Cr",
  slaRate: "94.2%",
  avgFillTime: "4.1 min",
  citiesCovered: 3,
};
