import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MorningBrief from "./pages/MorningBrief";
import SectorWatchlist from "./pages/SectorWatchlist";
import GeopoliticalTracker from "./pages/GeopoliticalTracker";
import SentimentLab from "./pages/SentimentLab";
import AskAI from "./pages/AskAI";
import AboutProject from "./pages/AboutProject";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

// Inside <Routes>
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MorningBrief />} />
          <Route path="/sectors" element={<SectorWatchlist />} />
          <Route path="/geopolitical" element={<GeopoliticalTracker />} />
          <Route path="/sentiment-lab" element={<SentimentLab />} />
          <Route path="/ask-ai" element={<AskAI />} />
          <Route path="/about" element={<AboutProject />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
