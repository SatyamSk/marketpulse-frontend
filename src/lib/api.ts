const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  getDashboard: () => get<any>("/api/dashboard"),
  getSector: (name: string) => get<any>(`/api/sectors/${name}`),
  generateBrief: (payload: any) => post<any>("/api/brief", payload),
  chat: (payload: any) => post<any>("/api/chat", payload),
  status: () => get<any>("/api/status"),
};
