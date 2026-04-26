import { useEffect, useState } from "react";
import { Cpu, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createRobot, listRobots, removeRobot, type Robot, type RobotStatus } from "@/lib/hardware";
import { toast } from "sonner";

const TYPES = ["River drone", "Underwater sampler", "Drifter buoy", "Bench microscope", "Other"];
const STATUSES: RobotStatus[] = ["online", "offline", "maintenance"];

export default function Hardware() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Robot, "id">>({
    name: "",
    type: TYPES[0],
    status: "offline",
    notes: "",
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listRobots();
      setRobots(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load hardware";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Hardware — Nero Sense";
    void refresh();
  }, []);

  const submit = async () => {
    if (!form.name) return toast.error("Name required");
    setSubmitting(true);
    try {
      await createRobot({
        name: form.name.trim(),
        type: form.type,
        status: form.status,
        notes: form.notes,
      });
      toast.success("Robot registered");
      setForm({ name: "", type: TYPES[0], status: "offline", notes: "" });
      setOpen(false);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register robot";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const cycleStatus = (r: Robot) => {
    const idx = STATUSES.indexOf(r.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    setRobots((prev) => prev.map((item) => (item.id === r.id ? { ...item, status: next } : item)));
    toast.info("Status cycling is currently local-only");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" /> Hardware
          </h1>
          <p className="text-sm text-muted-foreground">Connected robots & sampling devices.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add robot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register robot</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Iskar Drone 01" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: Robot["status"]) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={() => void submit()} disabled={submitting}>
                {submitting ? "Registering..." : "Register"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground">Loading hardware...</p>
        </Card>
      ) : robots.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Cpu className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No robots registered yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {robots.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground truncate">{r.type}</div>
              </div>
              <button onClick={() => cycleStatus(r)} title="Click to cycle status">
                <Badge
                  variant={
                    r.status === "online" ? "default" : r.status === "maintenance" ? "secondary" : "outline"
                  }
                  className="cursor-pointer"
                >
                  {r.status}
                </Badge>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    await removeRobot(r.id);
                    toast.success("Removed");
                    await refresh();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Failed to remove robot";
                    toast.error(message);
                  }
                }}
                aria-label="Delete"
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
