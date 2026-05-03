import { useEffect, useState, useRef, useCallback } from "react";
import type { MarketSnapshot, WeeklyRow } from "../data/types";
import { PLATFORMS } from "../data/types";
import {
  getDataset,
  aggregateByPlatform,
  getWeeklyAverages,
} from "../data/dataset";

const TICK_MS = 4000; // 4s between ticks

function getCurrentSliceIndex(): number {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = (now.getDay() + 6) % 7; // JS: 0=Sun → 0=Mon
  return hour * 7 + dayOfWeek;
}

// Walk the dataset in order, looping — gives "live" feel
let _cursor = 0;
function nextBatch(size = 40): ReturnType<typeof getDataset> {
  const ds = getDataset();
  const batch = [];
  for (let i = 0; i < size; i++) {
    batch.push(ds[(_cursor + i) % ds.length]);
  }
  _cursor = (_cursor + size) % ds.length;
  return batch;
}

function snapshotFromBatch(
  batch: ReturnType<typeof getDataset>
): MarketSnapshot[] {
  const agg = aggregateByPlatform(batch);
  return PLATFORMS.map((p) => {
    const found = agg.find((a) => a.platformId === p.id);
    if (!found) {
      return {
        platformId: p.id,
        demand: 0,
        supply: 0,
        shortage: 0,
        ppd: 0,
        surgeMult: 1,
        fulfillmentRate: 1,
        trend: "stable" as const,
      };
    }
    const trend: MarketSnapshot["trend"] =
      found.shortage > 5 ? "up" : found.fulfillmentRate > 0.9 ? "down" : "stable";
    return { ...found, trend };
  });
}

export function useSimulation() {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>(() =>
    snapshotFromBatch(nextBatch())
  );
  const [weekly, setWeekly] = useState<WeeklyRow[]>(() => getWeeklyAverages());
  const [lastTick, setLastTick] = useState(new Date());
  const [tickCount, setTickCount] = useState(0);
  const [pulseId, setPulseId] = useState<string | null>(null);
  const prevSnapshotsRef = useRef<MarketSnapshot[]>(snapshots);
  const running = useRef(true);

  const tick = useCallback(() => {
    const batch = nextBatch(40);
    const next = snapshotFromBatch(batch);

    // Find biggest change to pulse
    let maxDelta = 0;
    let pulseTarget: string | null = null;
    for (const n of next) {
      const prev = prevSnapshotsRef.current.find(
        (s) => s.platformId === n.platformId
      );
      if (prev) {
        const delta = Math.abs(n.ppd - prev.ppd);
        if (delta > maxDelta) {
          maxDelta = delta;
          pulseTarget = n.platformId;
        }
      }
    }

    prevSnapshotsRef.current = next;
    setSnapshots(next);
    setLastTick(new Date());
    setTickCount((c) => c + 1);

    if (pulseTarget) {
      setPulseId(pulseTarget);
      setTimeout(() => setPulseId(null), 700);
    }
  }, []);

  useEffect(() => {
    running.current = true;
    const id = setInterval(() => {
      if (running.current) tick();
    }, TICK_MS);
    return () => {
      running.current = false;
      clearInterval(id);
    };
  }, [tick]);

  return { snapshots, weekly, lastTick, tickCount, pulseId };
}

// Compute optimal PPD to fill a demand target
export function computeOptimalPPD(demandTarget: number, basePPD = 29): number {
  return Math.round(basePPD * (1 + (demandTarget / 20) * 0.4) * 10) / 10;
}

// Project how many riders a given PPD will attract
export function projectSupply(ppd: number, demandTarget: number): number {
  return Math.min(demandTarget, Math.floor((ppd / 29) * 15));
}
