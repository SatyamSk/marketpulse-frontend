import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useDashboard() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboard();
      setData(result);
      setLastFetch(new Date());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Cannot connect to pipeline. Make sure api.py is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, lastFetch };
}
