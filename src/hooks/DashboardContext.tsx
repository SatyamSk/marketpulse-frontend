import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

interface DashboardContextType {
  data:      DashboardData | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
  lastFetch: Date | null;
  isStale:   boolean;
}

const DashboardContext = createContext<DashboardContextType>({
  data: null, loading: true, error: null,
  refetch: async () => {}, lastFetch: null, isStale: false,
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboard();
      setData(result);
      setLastFetch(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot connect to pipeline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Data is stale if pipeline ran more than 6 hours ago
  const isStale = data?.last_updated
    ? (Date.now() - new Date(data.last_updated).getTime()) > 6 * 60 * 60 * 1000
    : true;

  return (
    <DashboardContext.Provider value={{ data, loading, error, refetch: fetchData, lastFetch, isStale }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
