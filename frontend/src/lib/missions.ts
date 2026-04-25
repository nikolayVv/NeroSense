// Mission storage — localStorage prototype.
export type HardwareSelection = {
  hardwareId: string;
  /** In-situ indicator ids selected for this device */
  inSituIndicators: string[];
};

export type MissionConfig = {
  /** Water source id (basin) */
  waterSource: string;
  /** Display label for the water source */
  waterSourceLabel?: string;
  /** Original English Name_en — used by the dashboard map for polygon lookup */
  waterSourceNameEn?: string;
  dateFrom: string;
  dateTo: string;
  /** Sensor ids (satellite / remote) */
  sensors: string[];
  /** Satellite indicator ids */
  indicators: string[];
  /** Hardware devices + their per-device in-situ indicators */
  hardware: HardwareSelection[];
  notes?: string;
};

export type MissionResults = {
  totalCells?: number;
  speciesCount?: number;
  density?: number;
  avgIndex?: number;
  detections?: Array<{ species: string; count: number; confidence: number }>;
};

export type Mission = {
  id: string;
  number: number;
  name: string;
  createdAt: string;
  status: "draft" | "running" | "completed";
  config: MissionConfig;
  results?: MissionResults;
};

const KEY = "nerosense.missions";

export function listMissions(): Mission[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Mission[]) : [];
    return arr.sort((a, b) => b.number - a.number);
  } catch {
    return [];
  }
}

export function getMission(id: string): Mission | null {
  return listMissions().find((m) => m.id === id) ?? null;
}

export function saveMission(m: Mission) {
  const all = listMissions().filter((x) => x.id !== m.id);
  all.push(m);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteMission(id: string) {
  const all = listMissions().filter((m) => m.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function createMission(config: MissionConfig, name?: string): Mission {
  const all = listMissions();
  const number = (all[0]?.number ?? 0) + 1;
  const m: Mission = {
    id: crypto.randomUUID(),
    number,
    name: name || `Mission #${String(number).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    status: "draft",
    config,
  };
  saveMission(m);
  return m;
}
