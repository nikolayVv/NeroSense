import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import AppLayout from "./pages/AppLayout.tsx";
import Missions from "./pages/Missions.tsx";
import NewMission from "./pages/NewMission.tsx";
import MissionDetail from "./pages/MissionDetail.tsx";
import DataSources from "./pages/DataSources.tsx";
import Settings from "./pages/Settings.tsx";
import Hardware from "./pages/Hardware.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Missions />} />
            <Route path="missions" element={<Missions />} />
            <Route path="missions/new" element={<NewMission />} />
            <Route path="missions/:id" element={<MissionDetail />} />
            <Route path="data-sources" element={<DataSources />} />
            <Route path="hardware" element={<Hardware />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
