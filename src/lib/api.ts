const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e   = new Error(`API error ${res.status}`) as any;
    e.response = { data: err };
    throw e;
  }
  return res.json();
}

export const api = {
  getDashboard:    () => get<any>("/api/dashboard"),
  getSector:       (name: string) => get<any>(`/api/sectors/${name}`),
  generateBrief:   (payload: any) => post<any>("/api/brief", payload),
  briefStatus:     () => get<any>("/api/brief/status"),
  chat:            (payload: any) => post<any>("/api/chat", payload),
  status:          () => get<any>("/api/status"),
  pipelineStatus:  () => get<any>("/api/pipeline/status"),
  triggerPipeline: (secret: string, maxPerFeed: number) =>
    post<any>("/api/pipeline/run", { secret, max_per_feed: maxPerFeed }),
};
