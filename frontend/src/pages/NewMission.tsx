import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMission } from "@/lib/missions";
import { loadWaterSources, ISKAR_ID, type WaterSource } from "@/lib/waterSources";
import { fetchSensors, fetchIndicators } from "@/lib/catalog";
import { listRobots, type Robot } from "@/lib/hardware";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

type Sensor = { id: number; label: string; provider: string };
type Indicator = { id: number; label: string; unit?: string };

type DataSourceApi = { id: number; name: string; provider: string };
type IndicatorApi = { id: number; name: string; unit: string | null };

async function ensureDataSources(): Promise<DataSourceApi[]> {
  let data = await apiFetch<DataSourceApi[]>("/data-sources/");
  if (data.length > 0) return data;

  const fallback = await fetchSensors();
  for (const item of fallback) {
    await apiFetch("/data-sources/", {
      method: "POST",
      body: {
        name: item.label,
        provider: item.provider,
        description: null,
      },
    });
  }
  data = await apiFetch<DataSourceApi[]>("/data-sources/");
  return data;
}

async function ensureIndicators(): Promise<IndicatorApi[]> {
  let data = await apiFetch<IndicatorApi[]>("/indicators/");
  if (data.length > 0) return data;

  const fallback = await fetchIndicators();
  for (const item of fallback) {
    await apiFetch("/indicators/", {
      method: "POST",
      body: {
        name: item.label,
        description: null,
        unit: item.unit ?? null,
      },
    });
  }
  data = await apiFetch<IndicatorApi[]>("/indicators/");
  return data;
}

export default function NewMission() {
  const navigate = useNavigate();

  const [sources, setSources] = useState<WaterSource[]>([]);
  const [sensorList, setSensorList] = useState<Sensor[]>([]);
  const [indicatorList, setIndicatorList] = useState<Indicator[]>([]);
  const [hardwareList, setHardwareList] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [waterSource, setWaterSource] = useState<string>(ISKAR_ID);
  const [dateFrom, setDateFrom] = useState("2024-05-21");
  const [dateTo, setDateTo] = useState("2024-05-28");
  const [sensors, setSensors] = useState<number[]>([]);
  const [indicators, setIndicators] = useState<number[]>([]);
  const [hardware, setHardware] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "New Mission — Nero Sense";
    Promise.all([
      loadWaterSources(),
      ensureDataSources(),
      ensureIndicators(),
      listRobots(),
    ])
      .then(([ws, ds, ind, hw]) => {
        setSources(ws);
        const mappedSensors = ds.map((item) => ({
          id: item.id,
          label: item.name,
          provider: item.provider,
        }));
        const mappedIndicators = ind.map((item) => ({
          id: item.id,
          label: item.name,
          unit: item.unit ?? undefined,
        }));
        setSensorList(mappedSensors);
        setIndicatorList(mappedIndicators);
        setHardwareList(hw);
        setSensors(mappedSensors[0] ? [mappedSensors[0].id] : []);
        setIndicators(mappedIndicators[0] ? [mappedIndicators[0].id] : []);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load mission options";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedWater = useMemo(
    () => sources.find((s) => s.id === waterSource),
    [sources, waterSource]
  );
  const selectedWaterLabel = selectedWater?.label ?? waterSource;

  const toggle = (
    arr: number[],
    setArr: (v: number[]) => void,
    id: number
  ) => setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const launch = async () => {
    if (sensors.length === 0 && indicators.length === 0) {
      toast.error("Pick at least one sensor or indicator");
      return;
    }
    setSubmitting(true);
    try {
      const m = await createMission({
        name: name || undefined,
        waterSource,
        waterSourceLabel: selectedWaterLabel,
        waterSourceNameEn: selectedWater?.nameEn ?? selectedWaterLabel,
        dateFrom,
        dateTo,
        sensors,
        indicators,
        hardware,
        notes,
      });
      toast.success(`${m.name} created`);
      navigate(`/app/missions/${m.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create mission";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">New Mission</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Configure filters for this research run. Defaults to Iskar &amp; phytoplankton.
      </p>

      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Mission name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Auto-numbered if empty"
          />
        </div>

        <div className="space-y-2">
          <Label>Water source</Label>
          <Select value={waterSource} onValueChange={setWaterSource} disabled={loading || !sources.length}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading basins…" : "Select basin"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                  <span className="text-muted-foreground text-xs ml-2">{s.nameBg}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && !sources.length && (
            <p className="text-xs text-destructive">Could not load basins.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">Date from</Label>
            <Input id="from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">Date to</Label>
            <Input id="to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Sensors / data sources</Label>
          <div className="grid grid-cols-2 gap-2">
            {sensorList.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={sensors.includes(s.id)}
                  onCheckedChange={() => toggle(sensors, setSensors, s.id)}
                />
                <div className="min-w-0">
                  <div className="truncate">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.provider}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Indicators</Label>
          <div className="grid grid-cols-2 gap-2">
            {indicatorList.map((ind) => (
              <label
                key={ind.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={indicators.includes(ind.id)}
                  onCheckedChange={() => toggle(indicators, setIndicators, ind.id)}
                />
                <span className="truncate">
                  {ind.label}
                  {ind.unit && (
                    <span className="text-muted-foreground text-xs ml-1">({ind.unit})</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Hardware (optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {hardwareList.map((hw) => (
              <label
                key={hw.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={hardware.includes(hw.id)}
                  onCheckedChange={() => toggle(hardware, setHardware, hw.id)}
                />
                <span className="truncate">
                  {hw.name}
                  <span className="text-muted-foreground text-xs ml-1">({hw.status})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Goal, hypothesis, context…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => navigate("/app/missions")}>
            Cancel
          </Button>
          <Button onClick={() => void launch()} disabled={loading || submitting}>
            {submitting ? "Creating..." : "Launch mission"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
