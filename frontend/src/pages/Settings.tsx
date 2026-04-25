import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser, login, logout } from "@/lib/auth";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const user = getUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => {
    document.title = "Settings — Nero Sense";
  }, []);

  const save = () => {
    if (!email) return toast.error("Email required");
    login(email, name);
    toast.success("Profile updated");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
        <SettingsIcon className="h-6 w-6 text-primary" /> Settings
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Profile & account.</p>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={handleLogout}>Log out</Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-4">
        Prototype mode — settings persist in your browser only.
      </p>
    </div>
  );
}
