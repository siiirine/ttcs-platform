'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { useLang } from '@/lib/language-context'
import {
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  Activity, Zap, GitBranch, ChevronRight, Server,
  TrendingUp, Shield, Radio, BarChart2, Clock, ArrowRight,
} from 'lucide-react'

interface NodeStatus {
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNKNOWN'
  display_name?: string
  role?: string
  hw?: {
    cpu_pct?: number
    ram_pct?: number
    memory_pct?: number
    disk_pct?: number
    status?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}
interface Summary { total: number; critical: number; warning: number; normal: number }
interface Anomaly {
  node: string; severity: string; message: string
  impact_level?: string; detected_at?: string; peak_hour?: boolean
}
interface Correlation {
  probable_cause?: string; impact_chain?: string; impacted_nodes?: string[]
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : ''
}

function getCpu(hw: any): number {
  return hw?.cpu_pct ?? hw?.cpu ?? 0
}
function getRam(hw: any): number {
  return hw?.ram_pct ?? hw?.memory_pct ?? hw?.mem_pct ?? hw?.ram ?? hw?.memory ?? 0
}

// ─────────────────────────────────────────────────────────────
// Sparkline SVG
// ─────────────────────────────────────────────────────────────
function Sparkline({ color, trend }: { color: string; trend: 'up' | 'down' | 'flat' }) {
  const pts = trend === 'up'
    ? [30, 28, 32, 25, 20, 22, 18, 15, 12, 10, 8, 6]
    : trend === 'down'
    ? [8, 10, 12, 9, 14, 18, 16, 20, 22, 25, 28, 30]
    : [18, 16, 20, 17, 19, 18, 21, 17, 19, 18, 20, 18]
  const w = 72; const h = 26
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w)
  const max = Math.max(...pts); const min = Math.min(...pts)
  const ys = pts.map(v => h - ((v - min) / (max - min + 1)) * h)
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const area = path + ` L ${w} ${h} L 0 ${h} Z`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }}>
      <path d={area} fill={color} opacity="0.12"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Health Score Donut
// ─────────────────────────────────────────────────────────────
function HealthDonut({ pct, color, trackColor }: { pct: number; color: string; trackColor: string }) {
  const r = 22; const cx = 28; const cy = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth="5"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}/>
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color}
        style={{ fontFamily: 'inherit', fontSize: '11px', fontWeight: 700 }}>
        {pct}%
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Metric Bar
// ─────────────────────────────────────────────────────────────
function MetricBar({ value, color, trackColor }: { value: number; color: string; trackColor: string }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div style={{ height: '4px', background: trackColor, borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.8s ease' }}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Status Dot pulsant
// ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const color = status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : status === 'NORMAL' ? '#22c55e' : '#9ca3af'
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px' }}>
      {status !== 'UNKNOWN' && (
        <span style={{
          position: 'absolute', width: '18px', height: '18px', borderRadius: '50%',
          background: color, opacity: 0.25,
          animation: 'ttcs-ping 2s cubic-bezier(0,0,0.2,1) infinite'
        }}/>
      )}
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, position: 'relative' }}/>
    </span>
  )
}

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  CCN: { bg: 'rgba(24,95,165,0.15)',  text: '#185FA5' },
  AIR: { bg: 'rgba(15,110,86,0.15)',  text: '#0F6E56' },
  SDP: { bg: 'rgba(133,79,11,0.15)',  text: '#854F0B' },
  VS:  { bg: 'rgba(95,94,90,0.15)',   text: '#5F5E5A' },
  OCC: { bg: 'rgba(163,45,45,0.15)',  text: '#A32D2D' },
  AF:  { bg: 'rgba(153,53,86,0.15)',  text: '#993556' },
}

// ─────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [summary,     setSummary]     = useState<Summary | null>(null)
  const [statuses,    setStatuses]    = useState<Record<string, NodeStatus>>({})
  const [anomalies,   setAnomalies]   = useState<Anomaly[]>([])
  const [correlation, setCorrelation] = useState<Correlation | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null)

  const router = useRouter()
  const { t }  = useLang()
  const c      = useThemeColors()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const BASE = 'http://192.168.147.129:8000'
  const hdrs = () => ({ Authorization: `Bearer ${getCookie('ttcs_token')}` })

  const fetchAll = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    try {
      const [sumR, statR, anomR, corrR] = await Promise.all([
        fetch(`${BASE}/summary`,     { headers: hdrs() }).then(r => r.json()),
        fetch(`${BASE}/status`,      { headers: hdrs() }).then(r => r.json()),
        fetch(`${BASE}/anomalies`,   { headers: hdrs() }).then(r => r.json()),
        fetch(`${BASE}/correlation`, { headers: hdrs() }).then(r => r.json()),
      ])

      // ── Summary ──
      const sumNorm: Summary = {
        total:    sumR?.total    ?? sumR?.nodes ?? 0,
        critical: sumR?.critical ?? 0,
        warning:  sumR?.warning  ?? 0,
        normal:   sumR?.normal   ?? 0,
      }
      setSummary(sumNorm)

      // ── Status : extraire les nœuds ──
      const rawStatus = statR ?? {}
      const SKIP_KEYS = ['timestamp', 'generated_at', 'total', 'critical', 'warning', 'normal']
      const rawNodes: Record<string, any> = rawStatus.nodes
        ? rawStatus.nodes
        : Object.fromEntries(Object.entries(rawStatus).filter(([k]) => !SKIP_KEYS.includes(k)))

      const normalized: Record<string, NodeStatus> = {}
      for (const [name, raw] of Object.entries(rawNodes)) {
        const n = raw as any
        normalized[name] = {
          ...n,
          status:       n.status ?? n.global_status ?? 'UNKNOWN',
          display_name: n.display_name ?? name,
          role:         n.role ?? '—',
          hw:           n.hw ?? {},
        }
      }
      setStatuses(normalized)

      // Recalculer summary si total = 0
      if (sumNorm.total === 0 && Object.keys(normalized).length > 0) {
        const vals = Object.values(normalized)
        setSummary({
          total:    vals.length,
          critical: vals.filter(v => v.status === 'CRITICAL').length,
          warning:  vals.filter(v => v.status === 'WARNING').length,
          normal:   vals.filter(v => v.status === 'NORMAL').length,
        })
      }

      setAnomalies(Array.isArray(anomR) ? anomR : (anomR?.anomalies ?? []))
      setCorrelation(corrR)
      setLastUpdate(new Date())
    } catch (e) { console.error(e) }
    finally { setIsLoading(false); if (refresh) setIsRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    intervalRef.current = setInterval(() => fetchAll(), 15000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchAll])

  const nodes         = Object.entries(statuses)
  const total         = summary?.total || nodes.length || 1
  const normalCount   = summary?.normal ?? nodes.filter(([, n]) => n.status === 'NORMAL').length
  const healthScore   = Math.round((normalCount / total) * 100)
  const critAnomalies = anomalies.filter(a => a.severity === 'CRITICAL' || a.impact_level === 'CRITIQUE')
  const warnAnomalies = anomalies.filter(a => a.severity === 'WARNING'  || a.impact_level === 'ÉLEVÉ')

  const accent   = '#185FA5'
  const trackBg  = c.border
  const panelBg  = c.panelBg  ?? c.cardBg
  const rowHover = c.rowHover ?? panelBg

  if (isLoading) return (
    <DashboardLayout>
      <Topbar
        onRefresh={() => fetchAll(true)}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate?.toISOString()}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '48px', height: '48px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${c.border}` }}/>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${accent}`, borderTopColor: 'transparent', animation: 'ttcs-spin 0.8s linear infinite' }}/>
          </div>
          <p style={{ color: c.textSecondary, fontSize: '13px' }}>Chargement des données…</p>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <Topbar
        onRefresh={() => fetchAll(true)}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate?.toISOString()}
      />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ══ EN-TÊTE ══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.7)', animation: 'ttcs-pulse 2s ease-in-out infinite' }}/>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em' }}>
                SYSTÈME ACTIF
              </span>
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: c.textPrimary }}>Tableau de bord</h1>
            <span style={{ fontSize: '11px', color: c.textSecondary,
              background: panelBg, border: `1px solid ${c.border}`, padding: '2px 8px', borderRadius: '6px' }}>
              ECS Ericsson · Tunisie Telecom
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastUpdate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: c.textSecondary }}>
                <Clock size={12}/>
                <span>Mis à jour {lastUpdate.toLocaleTimeString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* ══ ROW 1 : Health Score + 4 KPI ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr 1fr 1fr', gap: '12px' }}>
          <div style={{
            background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px',
            padding: '18px', boxShadow: c.shadow,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '6px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444',
              borderRadius: '14px 14px 0 0' }}/>
            <span style={{ fontSize: '9px', fontWeight: 700, color: c.textSecondary,
              textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health Score</span>
            <HealthDonut
              pct={healthScore}
              color={healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444'}
              trackColor={c.border}
            />
            <span style={{ fontSize: '10px', fontWeight: 700,
              color: healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444' }}>
              {healthScore >= 80 ? 'Sain' : healthScore >= 50 ? 'Dégradé' : 'Critique'}
            </span>
          </div>

          {[
            { label: 'Total nœuds',    value: summary?.total    ?? 0, color: accent,    icon: Server,        trend: 'flat' as const, sub: 'supervisés' },
            { label: 'Critiques',      value: summary?.critical ?? 0, color: '#ef4444', icon: AlertCircle,   trend: (summary?.critical ?? 0) > 0 ? 'down' as const : 'flat' as const, sub: (summary?.critical ?? 0) > 0 ? 'nœud(s) en alerte' : 'Aucune alerte' },
            { label: 'Avertissements', value: summary?.warning  ?? 0, color: '#f59e0b', icon: AlertTriangle, trend: (summary?.warning ?? 0) > 0 ? 'down' as const : 'flat' as const,  sub: (summary?.warning ?? 0) > 0 ? 'nœud(s) en warning' : 'Aucun avertissement' },
            { label: 'Normaux',        value: summary?.normal   ?? 0, color: '#22c55e', icon: CheckCircle2,  trend: 'up' as const, sub: 'opérationnels' },
          ].map(({ label, value, color, icon: Icon, trend, sub }) => (
            <div key={label} style={{
              background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px',
              padding: '18px 20px', boxShadow: c.shadow,
              display: 'flex', flexDirection: 'column', gap: '10px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: color, borderRadius: '14px 14px 0 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: c.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                <div style={{ padding: '6px', borderRadius: '8px', background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={13} style={{ color }}/>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '38px', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                <Sparkline color={color} trend={trend}/>
              </div>
              <span style={{ fontSize: '11px', color: c.textSecondary }}>
                {value > 0 ? `${value} ${sub}` : sub}
              </span>
            </div>
          ))}
        </div>

        {/* ══ ROW 2 : Nœuds ══ */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`,
          borderRadius: '14px', padding: '16px 18px', boxShadow: c.shadow }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '6px', borderRadius: '7px', background: `${accent}18` }}>
                <Radio size={13} style={{ color: accent }}/>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary,
                textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                État des nœuds — temps réel
              </span>
            </div>
            <button onClick={() => router.push('/noeuds')} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', color: accent, fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer'
            }}>
              Voir tout <ChevronRight size={12}/>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {nodes.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{
                    background: panelBg, border: `1px solid ${c.border}`,
                    borderRadius: '10px', height: '116px',
                    animation: 'ttcs-pulse-bg 1.5s ease-in-out infinite'
                  }}/>
                ))
              : nodes.map(([name, node]) => {
                  const s   = node.status ?? 'UNKNOWN'
                  const rs  = ROLE_STYLE[node.role ?? ''] ?? ROLE_STYLE['CCN']
                  const cpu = getCpu(node.hw)
                  const mem = getRam(node.hw)
                  const sc  = s === 'CRITICAL' ? '#ef4444' : s === 'WARNING' ? '#f59e0b' : s === 'NORMAL' ? '#22c55e' : '#9ca3af'
                  const dn  = node.display_name ?? name
                  return (
                    <div key={name} onClick={() => router.push(`/noeuds/${name}`)}
                      style={{
                        background: panelBg,
                        border: `1px solid ${s === 'CRITICAL' ? 'rgba(239,68,68,0.35)' : s === 'WARNING' ? 'rgba(245,158,11,0.3)' : c.border}`,
                        borderTop: `2px solid ${sc}`,
                        borderRadius: '10px', padding: '12px',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = c.shadowHover ?? c.shadow }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                          borderRadius: '4px', background: rs.bg, color: rs.text }}>
                          {node.role ?? '—'}
                        </span>
                        <StatusDot status={s}/>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: c.textPrimary,
                        marginBottom: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dn}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '9px', color: c.textSecondary }}>CPU</span>
                        <span style={{ fontSize: '9px', fontWeight: 600,
                          color: cpu > 80 ? '#ef4444' : cpu > 60 ? '#f59e0b' : c.textSecondary }}>{cpu}%</span>
                      </div>
                      <MetricBar value={cpu} color={cpu > 80 ? '#ef4444' : cpu > 60 ? '#f59e0b' : accent} trackColor={trackBg}/>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '9px', color: c.textSecondary }}>RAM</span>
                        <span style={{ fontSize: '9px', fontWeight: 600,
                          color: mem > 85 ? '#ef4444' : mem > 70 ? '#f59e0b' : c.textSecondary }}>{mem}%</span>
                      </div>
                      <MetricBar value={mem} color={mem > 85 ? '#ef4444' : mem > 70 ? '#f59e0b' : '#8b5cf6'} trackColor={trackBg}/>
                    </div>
                  )
                })}
          </div>
        </div>

        {/* ══ ROW 3 : Anomalies | Corrélation + Actions ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '12px' }}>

          {/* Anomalies */}
          <div style={{ background: c.cardBg, border: `1px solid ${c.border}`,
            borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)' }}>
                  <Activity size={13} style={{ color: '#ef4444' }}/>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>Anomalies récentes</span>
                {anomalies.length > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px',
                    borderRadius: '10px', background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {anomalies.length}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {critAnomalies.length > 0 && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px',
                    borderRadius: '5px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    {critAnomalies.length} CRITIQUE
                  </span>
                )}
                {warnAnomalies.length > 0 && (
                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px',
                    borderRadius: '5px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    {warnAnomalies.length} ÉLEVÉ
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '270px' }}>
              {anomalies.length === 0 ? (
                <div style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    borderRadius: '9px', background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)', marginBottom: '12px' }}>
                    <CheckCircle2 size={16} style={{ color: '#22c55e', flexShrink: 0 }}/>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>Aucune anomalie détectée</p>
                      <p style={{ fontSize: '10px', color: c.textSecondary }}>Tous les nœuds fonctionnent normalement</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {nodes.slice(0, 6).map(([name, node]) => {
                      const s  = node.status ?? 'UNKNOWN'
                      const sc = s === 'CRITICAL' ? '#ef4444' : s === 'WARNING' ? '#f59e0b' : s === 'NORMAL' ? '#22c55e' : '#9ca3af'
                      const rs = ROLE_STYLE[node.role ?? ''] ?? ROLE_STYLE['CCN']
                      return (
                        <div key={name} onClick={() => router.push(`/noeuds/${name}`)}
                          style={{ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                            background: panelBg, border: `1px solid ${c.border}`,
                            display: 'flex', alignItems: 'center', gap: '7px', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = panelBg}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc, flexShrink: 0 }}/>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: c.textPrimary,
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {node.display_name ?? name}
                            </p>
                            <span style={{ fontSize: '9px', fontWeight: 700,
                              background: rs.bg, color: rs.text, padding: '0px 4px', borderRadius: '3px' }}>
                              {node.role ?? '—'}
                            </span>
                          </div>
                          <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: sc, flexShrink: 0 }}>
                            {s}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                anomalies.slice(0, 8).map((a, i) => {
                  const sev    = a.severity ?? a.impact_level ?? 'INFO'
                  const isCrit = sev === 'CRITICAL' || sev === 'CRITIQUE'
                  const isWarn = sev === 'WARNING'  || sev === 'ÉLEVÉ'
                  const sc     = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : accent
                  const rs     = ROLE_STYLE[statuses[a.node]?.role ?? ''] ?? ROLE_STYLE['CCN']
                  return (
                    <div key={i} onClick={() => router.push(`/noeuds/${a.node}`)}
                      style={{ padding: '11px 18px', borderBottom: `1px solid ${c.border}`,
                        cursor: 'pointer', transition: 'background 0.15s',
                        display: 'flex', alignItems: 'flex-start', gap: '10px' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div style={{ flexShrink: 0, width: '3px', height: '44px',
                        borderRadius: '2px', background: sc, marginTop: '2px' }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px',
                            borderRadius: '4px', background: rs.bg, color: rs.text }}>
                            {statuses[a.node]?.role ?? a.node}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: c.textPrimary }}>
                            {statuses[a.node]?.display_name ?? a.node}
                          </span>
                          {a.peak_hour && <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 600 }}>⚡ Peak</span>}
                          <span style={{ marginLeft: 'auto', fontSize: '10px', color: c.textSecondary, flexShrink: 0 }}>
                            {a.detected_at ?? '—'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: c.textSecondary, lineHeight: 1.4,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.message}
                        </p>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                        background: isCrit ? 'rgba(239,68,68,0.1)' : isWarn ? 'rgba(245,158,11,0.1)' : `${accent}18`,
                        color: sc, flexShrink: 0, alignSelf: 'center' }}>
                        {sev}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Corrélation */}
            <div style={{ background: c.cardBg, border: `1px solid ${c.border}`,
              borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow }}>
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '7px', background: 'rgba(168,85,247,0.1)' }}>
                  <GitBranch size={13} style={{ color: '#a855f7' }}/>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>Corrélation</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'CAUSE PROBABLE',  value: correlation?.probable_cause ?? 'Aucune corrélation détectée', icon: Zap,       color: '#f59e0b' },
                  { label: "CHAÎNE D'IMPACT", value: correlation?.impact_chain   ?? "Aucune chaîne d'impact",     icon: GitBranch, color: accent    },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} style={{ padding: '10px 12px', background: panelBg,
                    borderRadius: '9px', border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                      <Icon size={11} style={{ color }}/>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: c.textSecondary, letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: c.textPrimary, lineHeight: 1.5 }}>{value}</p>
                  </div>
                ))}
                {(correlation?.impacted_nodes ?? []).length > 0 && (
                  <div style={{ padding: '10px 12px', background: panelBg,
                    borderRadius: '9px', border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '7px' }}>
                      <Shield size={11} style={{ color: '#ef4444' }}/>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: c.textSecondary, letterSpacing: '0.08em' }}>NŒUDS IMPACTÉS</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(correlation?.impacted_nodes ?? []).map(n => {
                        const rs = ROLE_STYLE[statuses[n]?.role ?? ''] ?? ROLE_STYLE['CCN']
                        return (
                          <span key={n} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                            borderRadius: '5px', background: rs.bg, color: rs.text }}>
                            {statuses[n]?.display_name ?? n}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div style={{ background: c.cardBg, border: `1px solid ${c.border}`,
              borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow, flex: 1 }}>
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '6px', borderRadius: '7px', background: 'rgba(34,197,94,0.1)' }}>
                  <Zap size={13} style={{ color: '#22c55e' }}/>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions rapides</span>
              </div>
              <div style={{ padding: '6px' }}>
                {[
                  { label: 'Voir les nœuds', sub: 'État de tous les serveurs', path: '/noeuds',     color: accent,    icon: Server     },
                  { label: 'Inventaire',      sub: 'Vue réseau & architecture', path: '/inventaire', color: '#a855f7', icon: BarChart2  },
                  { label: 'Prédictions',     sub: 'Analyse prédictive SDP',    path: '/prediction', color: '#22c55e', icon: TrendingUp },
                  { label: 'Assistant IA',    sub: 'Chatbot Groq LLaMA 3.3',   path: '/assistant',  color: '#f59e0b', icon: Zap        },
                ].map(({ label, sub, path, color, icon: Icon }) => (
                  <button key={path} onClick={() => router.push(path)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 10px', borderRadius: '8px', background: 'transparent',
                      border: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ padding: '7px', borderRadius: '8px', background: `${color}15`, flexShrink: 0 }}>
                      <Icon size={13} style={{ color }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: c.textPrimary, marginBottom: '1px' }}>{label}</p>
                      <p style={{ fontSize: '10px', color: c.textSecondary }}>{sub}</p>
                    </div>
                    <ArrowRight size={12} style={{ color: c.textSecondary, flexShrink: 0 }}/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ FOOTER STATS ══ */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`,
          borderRadius: '10px', padding: '10px 18px', boxShadow: c.shadow,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { label: 'Total anomalies', value: anomalies.length,     alert: undefined },
            { label: 'Critiques',       value: critAnomalies.length, alert: critAnomalies.length > 0 ? '#ef4444' : undefined },
            { label: 'Avertissements',  value: warnAnomalies.length, alert: warnAnomalies.length > 0 ? '#f59e0b' : undefined },
            { label: 'Sources',         value: [...new Set(anomalies.map(a => a.node))].length, alert: undefined },
            { label: 'Refresh',         value: '15s', alert: accent },
            { label: 'Mis à jour',      value: lastUpdate?.toLocaleString('fr-FR') ?? '—', alert: undefined },
          ].map(({ label, value, alert }, i, arr) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              borderRight: i < arr.length - 1 ? `1px solid ${c.border}` : 'none',
              paddingRight: i < arr.length - 1 ? '18px' : 0,
              marginRight:  i < arr.length - 1 ? '18px' : 0,
            }}>
              <span style={{ fontSize: '10px', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: alert ?? c.textPrimary }}>
                {value}
              </span>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @keyframes ttcs-spin     { to { transform: rotate(360deg); } }
        @keyframes ttcs-ping     { 0% { transform:scale(1);opacity:.4; } 75%,100%{ transform:scale(2.2);opacity:0; } }
        @keyframes ttcs-pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes ttcs-pulse-bg { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </DashboardLayout>
  )
}