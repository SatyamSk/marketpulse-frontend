import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api } from "@/lib/api";

interface DashboardContextType {
  data:      any;
  loading:   boolean;
  error:     string | null;
  refetch:   () => Promise<void>;
  lastFetch: Date | null;
}

const DashboardContext = createContext<DashboardContextType>({
  data: null, loading: true, error: null,
  refetch: async () => {}, lastFetch: null,
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData]           = useState<any>(null);
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

  return (
    <DashboardContext.Provider value={{ data, loading, error, refetch: fetchData, lastFetch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
