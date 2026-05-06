import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardProvider } from "@/hooks/DashboardContext";
import Today from "./pages/Today";
import FullAnalysis from "./pages/FullAnalysis";
import AskAI from "./pages/AskAI";
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
            <Route path="/"              element={<Today />}         />
            <Route path="/analysis"      element={<FullAnalysis />}  />
            <Route path="/chat"          element={<AskAI />}         />
            <Route path="/admin"         element={<Admin />}         />
            <Route path="*"              element={<NotFound />}      />
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
