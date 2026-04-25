import { useEffect } from "react";
import { Database, Satellite, Waves, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SOURCES = [
  { name: "Sentinel-2 MSI", type: "Satellite", icon: Satellite, status: "connected", desc: "10m multispectral, 5-day revisit." },
  { name: "Sentinel-3 OLCI", type: "Satellite", icon: Satellite, status: "connected", desc: "Ocean & Land Colour Instrument." },
  { name: "Landsat 9 OLI", type: "Satellite", icon: Satellite, status: "available", desc: "30m multispectral imagery." },
  { name: "MODIS Aqua", type: "Satellite", icon: Globe, status: "available", desc: "Daily ocean colour." },
  { name: "In-situ probes", type: "Hardware", icon: Waves, status: "connected", desc: "Iskar river deployed sensors." },
  { name: "FastAPI backend", type: "Compute", icon: Database, status: "offline", desc: "http://localhost:8000" },
];

export default function DataSources() {
  useEffect(() => {
    document.title = "Data Sources — Nero Sense";
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
        <Database className="h-6 w-6 text-primary" /> Data Sources
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Inputs available to your phytoplankton analysis pipeline.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {SOURCES.map((s) => (
          <Card key={s.name} className="p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium truncate">{s.name}</div>
                  <Badge
                    variant={
                      s.status === "connected"
                        ? "default"
                        : s.status === "offline"
                        ? "destructive"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {s.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{s.type}</div>
                <p className="text-xs mt-2">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
