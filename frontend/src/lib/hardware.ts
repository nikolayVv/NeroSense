export type Robot = {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "maintenance";
  lastSeen?: string;
  notes?: string;
};

const KEY = "nerosense.robots";

export function listRobots(): Robot[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Robot[]) : [];
  } catch {
    return [];
  }
}

export function saveRobot(r: Robot) {
  const all = listRobots().filter((x) => x.id !== r.id);
  all.push(r);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteRobot(id: string) {
  const all = listRobots().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
