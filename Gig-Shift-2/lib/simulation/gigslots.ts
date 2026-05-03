import { ZONES, PLATFORMS } from "../data/types";

export interface GigSlot {
  id: string;
  zone: string;
  platformId: string;
  platformName: string;
  platformIcon?: string;
  platformColor: string;
  slotsOpen: number;
  ppd: number;
  surgeMult: number;
  shortage: number;
  isShortageZone: boolean;
  ppdNudge: number;
  expiresIn: number;
  // batch2 RiderDashboard also uses these
  status: "open" | "filling";
  distanceKm: number;
  expiresInMin: number;
}

export interface DispatchEvent {
  id: string;
  riderId: string;
  riderName: string;
  platformId: string;
  platformName: string;
  zone: string;
  ppd: number;
  timestamp: Date;
  nudged: boolean;
}

const RIDER_NAMES = [
  "Ravi K.", "Anita S.", "Suresh M.", "Priya R.", "Deepak J.",
  "Meena P.", "Karthik B.", "Sneha T.", "Vikram L.", "Anjali N.",
  "Mohan D.", "Lakshmi V.", "Arjun G.", "Pooja H.", "Rahul C.",
  "Divya F.", "Sanjay E.", "Kavya I.", "Manoj O.", "Nisha Q.",
];

let _slotSeed = 0;
let _dispatchSeed = 0;

// Overload: called with tickCount (number) from RiderDashboard
// OR called with snapshots array from AdminDashboard
export function generateGigSlots(
  input: number | { platformId: string; ppd: number; surgeMult: number; shortage: number; supply: number }[]
): GigSlot[] {
  const slots: GigSlot[] = [];

  // Normalize input
  let snaps: { platformId: string; ppd: number; surgeMult: number; shortage: number; supply: number }[];

  if (typeof input === "number") {
    // Called with tickCount — generate synthetic snaps
    const seed = input;
    snaps = PLATFORMS.map((p, i) => ({
      platformId: p.id,
      ppd: 38 + Math.floor(Math.abs(Math.sin((seed + i) * 2.1)) * 25),
      surgeMult: 1 + Math.abs(Math.sin((seed + i) * 3.7)) * 0.4,
      shortage: Math.floor(Math.abs(Math.sin((seed + i) * 5.3)) * 8),
      supply: 20 + Math.floor(Math.abs(Math.sin((seed + i) * 1.9)) * 30),
    }));
  } else {
    snaps = input;
  }

  const shuffledZones = [...ZONES].sort(() => Math.sin(_slotSeed++) * 10 - 5);

  for (const snap of snaps) {
    const platform = PLATFORMS.find((p) => p.id === snap.platformId);
    if (!platform) continue;

    const zoneCount = 2 + Math.floor(Math.abs(Math.sin(_slotSeed * 1.7)) * 3);
    const zones = shuffledZones.slice(0, zoneCount);

    for (const zone of zones) {
      const baseSlots = 2 + Math.floor(Math.abs(Math.sin(_slotSeed * 2.3)) * 10);
      const isShortageZone = snap.shortage > 3;
      const nudgePct = isShortageZone ? 0.05 + Math.abs(Math.sin(_slotSeed * 3.1)) * 0.10 : 0;
      const nudgePPD = Math.round(snap.ppd * nudgePct);
      const expiresIn = 60 + Math.floor(Math.abs(Math.sin(_slotSeed * 4.2)) * 180);

      slots.push({
        id: `slot-${snap.platformId}-${zone}-${_slotSeed}`,
        zone,
        platformId: snap.platformId,
        platformName: platform.name,
        platformColor: platform.color,
        slotsOpen: baseSlots,
        ppd: snap.ppd,
        surgeMult: snap.surgeMult,
        shortage: snap.shortage,
        isShortageZone,
        ppdNudge: nudgePPD,
        expiresIn,
        // batch2 compat fields
        status: isShortageZone ? "filling" : "open",
        distanceKm: parseFloat((0.5 + Math.abs(Math.sin(_slotSeed * 6.1)) * 4.5).toFixed(1)),
        expiresInMin: Math.max(1, Math.round(expiresIn / 60)),
      });
      _slotSeed++;
    }
  }

  return slots.sort((a, b) => (b.ppd + b.ppdNudge) - (a.ppd + a.ppdNudge));
}

export function generateDispatchEvents(count = 8): DispatchEvent[] {
  const events: DispatchEvent[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const platform = PLATFORMS[Math.floor(Math.abs(Math.sin(_dispatchSeed * 1.3)) * PLATFORMS.length)];
    const zone = ZONES[Math.floor(Math.abs(Math.sin(_dispatchSeed * 2.7)) * ZONES.length)];
    const rider = RIDER_NAMES[Math.floor(Math.abs(Math.sin(_dispatchSeed * 3.9)) * RIDER_NAMES.length)];
    const nudged = Math.abs(Math.sin(_dispatchSeed * 5.1)) > 0.65;
    const basePPD = 35 + Math.floor(Math.abs(Math.sin(_dispatchSeed * 6.2)) * 25);

    events.push({
      id: `dispatch-${_dispatchSeed}`,
      riderId: `R${1000 + _dispatchSeed}`,
      riderName: rider,
      platformId: platform.id,
      platformName: platform.name,
      zone,
      ppd: nudged ? basePPD + Math.floor(basePPD * 0.08) : basePPD,
      timestamp: new Date(now.getTime() - i * 12000),
      nudged,
    });
    _dispatchSeed++;
  }

  return events;
}

export function getSLAStatus(
  fillRate: number,
  elapsedSeconds: number
): "green" | "yellow" | "red" {
  if (fillRate >= 0.85 || elapsedSeconds < 60) return "green";
  if (fillRate >= 0.55 || elapsedSeconds < 180) return "yellow";
  return "red";
}
