const BASE_URL = 'http://192.168.147.129:8000'

export interface SummaryResponse {
  timestamp: string
  total_nodes: number
  CRITICAL: number
  WARNING: number
  NORMAL: number
  critical_nodes: string[]
  warning_nodes: string[]
}

export interface HardwareStatus {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  cpu_pct: number
  ram_pct: number
  cpu_temp: number
  ups_pct: number
  fan_rpm: number
  io_latency: number
  watts: number
  rail_12v: number
  issues: string[]
}

export interface OSStatus {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  zombie_procs: number
  fd_used: number
  tcp_retrans_rate: number
  oom_kills: number
  ntp_offset_ms: number
  load_avg_1m: number
  load_avg_5m: number
  load_avg_15m: number
  uptime_sec: number
  issues: string[]
}

export interface AppStatus {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  down_services: string[]
  critical_alarms: number
  major_alarms: number
  sdp_timeout_count: number
  sdp_conflict_count: number
  ccn_lookup_fail: number
  ccn_comm_error: number
  occ_alarm_state: number
  issues: string[]
}

export interface CIPStatus {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  last_fail_rate: number
  last_reject_rate: number
  z_score_fail: number
  z_score_reject: number
  issues: string[]
}

export interface NodeStatus {
  role: string
  global_status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  hw: HardwareStatus
  os: OSStatus
  app: AppStatus
  cip?: CIPStatus
}

export interface StatusResponse {
  timestamp: string
  nodes: Record<string, NodeStatus>
}

export interface Anomaly {
  rule_id: string
  node: string
  role: string
  severity: 'CRITICAL' | 'WARNING'
  message: string
  value: number
  threshold: number
  source: string
}

export interface AnomaliesResponse {
  timestamp: string
  anomalies: Anomaly[]
  correlation: Record<string, unknown>
}

export interface NodeAnomaliesResponse {
  node: string
  anomalies: Anomaly[]
  count: number
}

export interface CorrelationResponse {
  cause_probable: string
  noeuds_impactes: string[]
  chaine_impact: string[]
  nb_anomalies: number
  nb_critical: number
  nb_warning: number
  sources: string[]
}

export interface TimelineEvent {
  type: 'HW' | 'OS' | 'APP' | 'ANOMALY' | 'CIP'
  message: string
  rule_id?: string
  severity?: 'CRITICAL' | 'WARNING'
  value?: number
  source?: string
}

export interface TimelineResponse {
  node: string
  role: string
  global_status: 'CRITICAL' | 'WARNING' | 'NORMAL'
  timestamp: string
  events: TimelineEvent[]
  nb_anomalies: number
}

export interface InventoryNode {
  role: string
  description: string
  port: number
}

export interface InventoryResponse {
  nodes: Record<string, InventoryNode>
}

export interface SDPPrediction {
  statistiques: {
    nb_points: number
    periode_debut: string
    periode_fin: string
    fail_rate_moyen: number
    fail_rate_max: number
    reject_rate_moyen: number
    total_moyen: number
  }
  isolation_forest: {
    nb_anomalies_historiques: number
    taux_anomalie: number
    score_moyen: number
  }
  prediction: {
    status: string
    horizon: string
    current_fail_rate: number
    mean_predicted_fail_rate: number
    tendance: number
    z_score_actuel: number
    risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL'
    risk_score: number
    predictions: Array<{
      step: number
      label: string
      fail_rate: number
      lower: number
      upper: number
    }>
  }
}

export interface PredictResponse {
  timestamp: string
  sdp_nodes: Record<string, SDPPrediction>
  global: {
    risk_level: 'NORMAL' | 'WARNING' | 'CRITICAL'
    risk_score: number
    nb_sdp: number
    interpretation: string
  }
}

// ✅ Récupère le token JWT depuis les cookies (stocké par proxy.ts)
function getToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)ttcs_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// ✅ fetchAPI injecte automatiquement le Bearer token dans chaque requête
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Injecte le token s'il existe
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    // Si 401 → token expiré, rediriger vers login
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Session expirée — redirection vers login')
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  getSummary:       () => fetchAPI<SummaryResponse>('/summary'),
  getStatus:        () => fetchAPI<StatusResponse>('/status'),
  getNodeStatus:    (node: string) => fetchAPI<NodeStatus>(`/status/${node}`),
  getAnomalies:     () => fetchAPI<AnomaliesResponse>('/anomalies'),
  getNodeAnomalies: (node: string) => fetchAPI<NodeAnomaliesResponse>(`/anomalies/${node}`),
  getCorrelation:   () => fetchAPI<CorrelationResponse>('/correlation'),
  getTimeline:      (node: string) => fetchAPI<TimelineResponse>(`/timeline/${node}`),
  getInventory:     () => fetchAPI<InventoryResponse>('/inventory'),
  getPredict:       () => fetchAPI<PredictResponse>('/predict'),
  refresh:          () => fetchAPI<{ message: string }>('/refresh', { method: 'POST' }),
  refreshPredict:   () => fetchAPI<{ message: string }>('/predict/refresh', { method: 'POST' }),
}

export const KNOWN_NODES = ['jambala', 'ttair6', 'ttsdp17a', 'ttvs3a', 'ttocc1', 'ttaf1']

export const ROLE_COLORS: Record<string, string> = {
  CCN: 'from-blue-500 to-blue-600',
  SDP: 'from-purple-500 to-purple-600',
  OCC: 'from-orange-500 to-orange-600',
  AIR: 'from-teal-500 to-teal-600',
  VS:  'from-slate-500 to-slate-600',
  AF:  'from-pink-500 to-pink-600',
}

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  CCN: 'Charging Control Node',
  SDP: 'Service Data Point / TimesTen',
  OCC: 'Online Charging Center',
  AIR: 'Account Information & Reservation',
  VS:  'Voucher Server',
  AF:  'Account Filter / DNS',
}