import { apiFetch } from "@/lib/api";

export type RobotStatus = "online" | "offline" | "maintenance";

export type Robot = {
  id: number;
  name: string;
  type: string;
  status: RobotStatus;
  notes?: string;
};

type RobotApi = {
  id: number;
  name: string;
  type: string | null;
  status: string | null;
  notes: string | null;
};

type CreateRobotInput = {
  name: string;
  type: string;
  status: RobotStatus;
  notes?: string;
};

function normalizeStatus(status: string | null): RobotStatus {
  if (status === "online" || status === "maintenance") return status;
  return "offline";
}

function fromApi(item: RobotApi): Robot {
  return {
    id: item.id,
    name: item.name,
    type: item.type ?? "Other",
    status: normalizeStatus(item.status),
    notes: item.notes ?? "",
  };
}

export async function listRobots(): Promise<Robot[]> {
  const data = await apiFetch<RobotApi[]>("/hardwares/");
  return data.map(fromApi);
}

export async function createRobot(input: CreateRobotInput): Promise<Robot> {
  const data = await apiFetch<RobotApi>("/hardwares/", {
    method: "POST",
    body: {
      name: input.name,
      type: input.type,
      status: input.status,
      notes: input.notes?.trim() ? input.notes : null,
    },
  });
  return fromApi(data);
}

export async function removeRobot(id: number): Promise<void> {
  await apiFetch(`/hardwares/${id}`, { method: "DELETE" });
}
