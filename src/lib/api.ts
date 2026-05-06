import type { DashboardData, AccuracyData, StockSearchResult } from './types';

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function get<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `API error ${res.status}` }));
    const detail = typeof err.detail === "object" ? JSON.stringify(err.detail) : err.detail;
    throw new Error(detail || `API error ${res.status} on ${path}`);
  }
  return await res.json();
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = typeof err.detail === "object" ? JSON.stringify(err.detail) : err.detail;
    const e = new Error(detail || err.message || `API error ${res.status}`) as Error & { response?: { data: unknown } };
    e.response = { data: err };
    throw e;
  }
  return await res.json();
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  default: boolean;
}

export const api = {
  // Core
  getDashboard:    ()                          => get<DashboardData>("/api/dashboard"),
  health:          ()                          => get<{ status: string }>("/api/health"),
  
  // CausalEdge: Today (plain-English intelligence)
  getToday:        ()                          => get<Record<string, unknown>>("/api/today"),
  
  // CausalEdge: Full Analysis
  getAnalysisAgents: ()                        => get<{ agents: Record<string, unknown>; timestamp: string }>("/api/analysis/agents"),
  getAnalysisCausal: ()                        => get<Record<string, unknown>>("/api/analysis/causal"),
  getAnalysisRegime: ()                        => get<Record<string, unknown>>("/api/analysis/regime"),

  // Pipeline
  pipelineStatus:  ()                          => get<{ last_headlines_update: string | null; headlines_count: number; is_running: boolean; data_available: boolean }>("/api/pipeline/status"),
  triggerPipeline: (secret: string, maxPerFeed: number, token: string, model?: string) =>
    post<{ status: string; message: string; mode: string; model?: string }>("/api/pipeline/run", { secret, max_per_feed: maxPerFeed, model: model || "gpt-4o-mini" }, token),
  
  // Brief
  briefStatus:     ()                          => get<{ allowed: boolean; used: number; remaining: number; limit: number }>("/api/brief/status"),
  generateBrief:   (payload: { top_headlines: unknown[]; sector_summary: unknown[]; regime: unknown }) =>
    post<{ brief: string; used: number; remaining: number }>("/api/brief", payload),
  
  // Chat
  chat: (payload: { message: string; history: unknown[]; context_headlines: unknown[]; context_sectors: unknown[] }) =>
    post<{ answer: string }>("/api/chat", payload),
  
  // Accuracy & History
  getAccuracy:     ()                          => get<AccuracyData>("/api/accuracy"),
  getHistory:      (sector?: string, days?: number) => 
    get<{ history: unknown[]; days: number; sector: string | null }>(`/api/history?${sector ? `sector=${sector}&` : ''}days=${days || 30}`),
  searchStocks:    (query: string)             => get<StockSearchResult>(`/api/stocks/search?q=${encodeURIComponent(query)}`),
  
  // Sector Detail
  getSector:       (sector: string)            => get<{ sector: string; metrics: Record<string, unknown> }>(`/api/sectors/${encodeURIComponent(sector)}`),

  // Agent
  getAgentResult:  ()                          => get<Record<string, unknown>>("/api/agent/result"),
  
  // Models
  getModels:       ()                          => get<{ models: ModelInfo[] }>("/api/models"),

  // Admin
  adminLogin:      (password: string)          => post<{ token: string }>("/api/admin/login", { password }),
  adminLogs:       (token: string)             => get<{ logs: string }>("/api/admin/logs", token),
  adminBacktest:   (token: string)             => post<{ status: string }>("/api/admin/backtest", {}, token),
  adminReflect:    (token: string)             => post<{ status: string }>('/api/admin/reflect', {}, token),
};

/** SSE stream URL for agent thinking logs */
export function getStreamUrl() {
  return `${BASE}/api/pipeline/stream`;
}

