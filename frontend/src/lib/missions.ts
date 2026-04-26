import { apiFetch } from "@/lib/api";

export type HardwareSelection = {
  hardwareId: number;
  inSituIndicators: number[];
};

export type MissionConfig = {
  waterSource: string;
  waterSourceLabel?: string;
  waterSourceNameEn?: string;
  dateFrom: string;
  dateTo: string;
  sensors: number[];
  indicators: number[];
  hardware: HardwareSelection[];
  notes?: string;
};

type MissionApi = {
  id: number;
  name: string;
  water_source_name: string | null;
  water_source_bbox: string | null;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
  insights: string | null;
  strategy: string | null;
};

type MissionConfigMap = Record<string, MissionConfig>;
const CONFIG_KEY = "nerosense.mission-config-map";

function readConfigMap(): MissionConfigMap {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as MissionConfigMap) : {};
  } catch {
    return {};
  }
}

function writeConfigMap(map: MissionConfigMap) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(map));
}

function upsertMissionConfig(missionId: number, config: MissionConfig) {
  const map = readConfigMap();
  map[String(missionId)] = config;
  writeConfigMap(map);
}

function getMissionConfig(missionId: number): MissionConfig | undefined {
  return readConfigMap()[String(missionId)];
}

export type Mission = {
  id: string;
  number: number;
  name: string;
  createdAt: string;
  status: "draft" | "running" | "completed";
  config: MissionConfig;
};

export type CreateMissionInput = {
  name?: string;
  waterSource: string;
  waterSourceLabel?: string;
  waterSourceNameEn?: string;
  dateFrom: string;
  dateTo: string;
  sensors: number[];
  indicators: number[];
  hardware: number[];
  notes?: string;
};

function toIsoStart(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

function fromApi(api: MissionApi, config?: MissionConfig): Mission {
  const derivedConfig: MissionConfig = config ?? {
    waterSource: api.water_source_bbox ?? "iskar",
    waterSourceLabel: api.water_source_name ?? "Iskar",
    waterSourceNameEn: api.water_source_name ?? "ISKAR",
    dateFrom: (api.date_from ?? "").slice(0, 10),
    dateTo: (api.date_to ?? "").slice(0, 10),
    sensors: [],
    indicators: [],
    hardware: [],
    notes: api.notes ?? "",
  };

  return {
    id: String(api.id),
    number: api.id,
    name: api.name,
    createdAt: api.date_from ?? new Date().toISOString(),
    status: "draft",
    config: derivedConfig,
  };
}

export async function listMissions(): Promise<Mission[]> {
  const data = await apiFetch<MissionApi[]>("/missions/");
  const map = readConfigMap();
  const missions = data.map((item) => fromApi(item, map[String(item.id)]));
  return missions.sort((a, b) => b.number - a.number);
}

export async function getMission(id: string): Promise<Mission | null> {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  try {
    const data = await apiFetch<MissionApi>(`/missions/${numId}`);
    return fromApi(data, getMissionConfig(numId));
  } catch {
    return null;
  }
}

export async function deleteMission(id: string): Promise<void> {
  const numId = Number(id);
  await apiFetch(`/missions/${numId}`, { method: "DELETE" });
}

export async function createMission(input: CreateMissionInput): Promise<Mission> {
  const payload = {
    name: input.name?.trim() || `Mission ${new Date().toISOString().slice(0, 10)}`,
    water_source_name: input.waterSourceNameEn ?? input.waterSourceLabel ?? input.waterSource,
    water_source_bbox: input.waterSource,
    date_from: toIsoStart(input.dateFrom),
    date_to: toIsoEnd(input.dateTo),
    notes: input.notes?.trim() || null,
    insights: null,
    strategy: null,
    data_source_ids: input.sensors,
    indicator_ids: input.indicators,
    hardware_ids: input.hardware,
  };

  const created = await apiFetch<MissionApi>("/missions/", {
    method: "POST",
    body: payload,
  });

  const config: MissionConfig = {
    waterSource: input.waterSource,
    waterSourceLabel: input.waterSourceLabel,
    waterSourceNameEn: input.waterSourceNameEn,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    sensors: input.sensors,
    indicators: input.indicators,
    hardware: input.hardware.map((id) => ({ hardwareId: id, inSituIndicators: [] })),
    notes: input.notes,
  };
  upsertMissionConfig(created.id, config);
  return fromApi(created, config);
}
