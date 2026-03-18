import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardProvider } from "@/hooks/DashboardContext";
import MorningBrief from "./pages/MorningBrief";
import SentimentLab from "./pages/SentimentLab";
import SectorWatchlist from "./pages/SectorWatchlist";
import GeopoliticalTracker from "./pages/GeopoliticalTracker";
import AskAI from "./pages/AskAI";
import AboutProject from "./pages/AboutProject";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"              element={<MorningBrief />}       />
            <Route path="/sentiment-lab" element={<SentimentLab />}       />
            <Route path="/sectors"       element={<SectorWatchlist />}    />
            <Route path="/geopolitical"  element={<GeopoliticalTracker />}/>
            <Route path="/ask-ai"        element={<AskAI />}              />
            <Route path="/about"         element={<AboutProject />}       />
            <Route path="/admin"         element={<Admin />}              />
            <Route path="*"              element={<NotFound />}           />
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
