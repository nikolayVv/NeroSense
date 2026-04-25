import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listMissions, deleteMission, type Mission } from "@/lib/missions";
import { toast } from "sonner";

export default function Missions() {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    document.title = "Missions — Nero Sense";
    setMissions(listMissions());
  }, []);

  const handleDelete = (id: string) => {
    deleteMission(id);
    setMissions(listMissions());
    toast.success("Mission deleted");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" /> Missions
          </h1>
          <p className="text-sm text-muted-foreground">
            History of your phytoplankton research runs.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/missions/new">
            <Plus className="h-4 w-4 mr-1" /> New Mission
          </Link>
        </Button>
      </div>

      {missions.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No missions yet.</p>
          <Button asChild>
            <Link to="/app/missions/new">
              <Plus className="h-4 w-4 mr-1" /> Start your first mission
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {missions.map((m) => (
            <Card
              key={m.id}
              className="p-4 hover:border-primary/40 transition-colors flex items-center justify-between gap-4"
            >
              <Link to={`/app/missions/${m.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                    #{String(m.number).padStart(3, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.config.waterSourceLabel ?? m.config.waterSource} · {m.config.dateFrom} → {m.config.dateTo}
                    </div>
                  </div>
                </div>
              </Link>
              <Badge
                variant={
                  m.status === "completed"
                    ? "default"
                    : m.status === "running"
                    ? "secondary"
                    : "outline"
                }
              >
                {m.status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(m.id)}
                aria-label="Delete mission"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
