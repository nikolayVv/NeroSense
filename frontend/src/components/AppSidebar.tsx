import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, Database, Settings, Cpu, LogOut, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { logout, getUser } from "@/lib/auth";

const items = [
  { title: "Missions", url: "/app/missions", icon: FlaskConical },
  { title: "Data Sources", url: "/app/data-sources", icon: Database },
  { title: "Hardware", url: "/app/hardware", icon: Cpu },
  { title: "Settings", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">N</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <div className="font-bold text-sm tracking-wide">
              Nero<span className="text-primary">Sense</span>
            </div>
            <div className="text-[10px] text-muted-foreground">PhytoWatch</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="New Mission">
                  <NavLink to="/app/missions/new">
                    <Plus className="h-4 w-4" />
                    <span>New Mission</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {items.map((item) => {
                const active = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="text-xs font-medium truncate">{user?.name ?? "Guest"}</div>
          <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="justify-start gap-2 group-data-[collapsible=icon]:justify-center"
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Log out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
