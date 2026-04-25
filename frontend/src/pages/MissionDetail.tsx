import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMission, type Mission } from "@/lib/missions";

export default function MissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);

  useEffect(() => {
    if (!id) return;
    const m = getMission(id);
    if (!m) {
      navigate("/app/missions", { replace: true });
      return;
    }
    setMission(m);
    document.title = `${m.name} — Nero Sense`;
  }, [id, navigate]);

  if (!mission) return null;

  // Pass mission filters to dashboard via URL params. Dashboard reads them
  // and renders mock visualisations dynamically — no Run button.
  const cfg = mission.config;
  const sensors = cfg.sensors ?? [];
  const indicators = cfg.indicators ?? [];
  const hardware = cfg.hardware ?? [];
  const params = new URLSearchParams({
    water_source: cfg.waterSource ?? (cfg as any).river ?? "iskar",
    water_source_label: cfg.waterSourceLabel ?? "",
    water_source_name_en: cfg.waterSourceNameEn ?? cfg.waterSourceLabel ?? "",
    date_from: cfg.dateFrom,
    date_to: cfg.dateTo,
    sensors: sensors.join(","),
    indicators: indicators.join(","),
    hardware: hardware.map((h) => h.hardwareId).join(","),
    in_situ: hardware.flatMap((h) => h.inSituIndicators).join(","),
    embed: "1",
  });
  const dashboardSrc = `/dashboard/index.html?${params.toString()}`;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/app/missions" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              #{String(mission.number).padStart(3, "0")}
            </div>
            <div className="min-w-0">
              <div className="font-bold truncate">{mission.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {cfg.waterSourceLabel ?? cfg.waterSource ?? (cfg as any).river} ·{" "}
                {cfg.dateFrom} → {cfg.dateTo} ·{" "}
                {sensors.length} sensor(s) ·{" "}
                {indicators.length} indicator(s) ·{" "}
                {hardware.length} device(s)
              </div>
            </div>
          </div>
          <Badge>{mission.status}</Badge>
        </div>
      </div>

      <Card className="m-4 p-0 overflow-hidden flex-1 min-h-[600px]">
        <iframe
          src={dashboardSrc}
          title={mission.name}
          className="w-full h-full min-h-[600px] border-0"
          style={{ display: "block" }}
        />
      </Card>

      <div className="px-4 pb-4 max-w-7xl mx-auto w-full">
        <a
          href={dashboardSrc}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
        >
          Open dashboard in new tab <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
