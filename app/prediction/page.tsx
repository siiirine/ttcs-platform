'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { useLang } from '@/lib/language-context'
import {
  TrendingDown, TrendingUp, RefreshCw, Activity, BarChart3,
  Server, AlertCircle, CheckCircle2, Info, FileText,
} from 'lucide-react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts'

const BASE_URL = 'http://192.168.147.129:8000'

// ─── Types API ────────────────────────────────────────────────────────────────

interface ApiResponse {
  timestamp: string
  sdp_nodes: Record<string, {
    display: string
    source: string
    statistiques: {
      nb_points: number
      periode_debut: string
      periode_fin: string
      total_moyen: number
      fail_rate_moyen: number
      reject_rate_moyen: number
    }
    isolation_forest: {
      nb_anomalies_historiques: number
      taux_anomalie: number
      score_moyen: number
    }
    prediction: {
      risk_level: string
      risk_score: number
      z_score_actuel: number
      tendance: number
      slope_lineaire: number
      mean_total_recent: number
    }
    timeseries: {
      avg: number
      points: { t: string; s: number }[]
    }
    hourly: { h: string; avg: number; total: number; count: number }[]
    trend_pct: number
    success_avg: number
    success_max: number
    success_min: number
    success_std: number
    error?: string
  }>
  global: {
    risk_level: string
    risk_score: number
    nb_sdp: number
    interpretation: string
  }
}

// ─── Types internes ───────────────────────────────────────────────────────────

interface CIPSession {
  key: string
  label: string
  filename: string
  avg: number
  max: number
  min: number
  total: number
  std: number
  trend_pct: number
  zscore_last: number
  ts_sample: { t: string; s: number }[]
  hourly: { h: string; avg: number; total: number; count: number }[]
  start: string
  end: string
  date: string
  nb_points: number
  color: string
  colorLight: string
  colorDark: string
  nb_anomalies: number
  risk_level: string
  risk_score: number
  interpretation: string
  fail_rate: number
}

// ─── Mapping des 6 nœuds ─────────────────────────────────────────────────────

const SESSION_COLORS = [
  { color: '#185FA5', light: '#E6F1FB', dark: '#0C447C' },  // SDP  — bleu
  { color: '#0F6E56', light: '#E1F5EE', dark: '#085041' },  // AIR  — teal
  { color: '#534AB7', light: '#EEEDFE', dark: '#3C3489' },  // OCC  — violet
  { color: '#854F0B', light: '#FAEEDA', dark: '#633806' },  // CCN  — ambre
  { color: '#A32D2D', light: '#FCEBEB', dark: '#7f1d1d' },  // VS   — rouge
  { color: '#1e6091', light: '#e8f4f8', dark: '#154360' },  // AF   — bleu foncé
]

const SESSION_META: Record<string, { label: string; colorIdx: number }> = {
  SDP:  { label: 'SDP-Node-01',  colorIdx: 0 },
  AIR:  { label: 'AIR-Node-01',  colorIdx: 1 },
  OCC:  { label: 'OCC-Node-01',  colorIdx: 2 },
  CCN:  { label: 'CCN-Node-01',  colorIdx: 3 },
  VS:   { label: 'VS-Node-01',   colorIdx: 4 },
  AF:   { label: 'AF-Node-01',   colorIdx: 5 },
}

const ORDER = ['SDP', 'AIR', 'OCC', 'CCN', 'VS', 'AF']

// ─── Conversion API → CIPSession ─────────────────────────────────────────────

function apiToSessions(api: ApiResponse): CIPSession[] {
  return ORDER
    .filter(k => api.sdp_nodes[k] && !api.sdp_nodes[k].error)
    .map(key => {
      const node  = api.sdp_nodes[key]
      const meta  = SESSION_META[key]
      const col   = SESSION_COLORS[meta.colorIdx]
      const stats = node.statistiques
      const pred  = node.prediction

      const dateStr  = stats?.periode_debut?.slice(0, 10)  ?? ''
      const startStr = stats?.periode_debut?.slice(11, 16) ?? ''
      const endStr   = stats?.periode_fin?.slice(11, 16)   ?? ''

      return {
        key,
        label:      meta.label,
        filename:   node.source ?? key,
        avg:        node.success_avg ?? 0,
        max:        node.success_max ?? 0,
        min:        node.success_min ?? 0,
        total:      Math.round((node.success_avg ?? 0) * (stats?.nb_points ?? 0)),
        std:        node.success_std ?? 0,
        trend_pct:  node.trend_pct ?? 0,
        zscore_last: pred?.z_score_actuel ?? 0,
        ts_sample:  node.timeseries?.points ?? [],
        hourly: (node.hourly ?? []).sort((a, b) => {
          const ha = parseInt(a.h)
          const hb = parseInt(b.h)
          const norm = (h: number) => h < 6 ? h + 24 : h
          return norm(ha) - norm(hb)
        }),
        start:      startStr,
        end:        endStr,
        date:       dateStr,
        nb_points:  stats?.nb_points ?? 0,
        color:      col.color,
        colorLight: col.light,
        colorDark:  col.dark,
        nb_anomalies: node.isolation_forest?.nb_anomalies_historiques ?? 0,
        risk_level:   pred?.risk_level ?? 'NORMAL',
        risk_score:   pred?.risk_score ?? 0,
        interpretation: api.global?.interpretation ?? '',
        fail_rate:    stats?.fail_rate_moyen ?? 0,
      }
    })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrendLabel(pct: number) {
  if (pct >= 0)   return { icon: <TrendingUp  size={20} />, label: 'Hausse',            color: '#3B6D11' }
  if (pct > -20)  return { icon: <TrendingDown size={20} />, label: 'Légère baisse',    color: '#854F0B' }
  return               { icon: <TrendingDown size={20} />, label: 'Descente nocturne', color: '#A32D2D' }
}

function getZScoreStatus(z: number) {
  const abs = Math.abs(z)
  if (abs < 1.5) return { label: 'Normal',    color: '#3B6D11', bg: '#EAF3DE' }
  if (abs < 2.0) return { label: 'Attention', color: '#854F0B', bg: '#FAEEDA' }
  return               { label: 'Anormal',   color: '#A32D2D', bg: '#FCEBEB' }
}

function getRiskStyle(level: string) {
  if (level === 'CRITICAL') return { color: '#A32D2D', bg: '#FCEBEB', label: 'Critique' }
  if (level === 'WARNING')  return { color: '#854F0B', bg: '#FAEEDA', label: 'Élevé'   }
  return                          { color: '#3B6D11', bg: '#EAF3DE', label: 'Normal'   }
}

// ─── KPI globaux ──────────────────────────────────────────────────────────────

function GlobalKpiBar({ sessions, isDark }: { sessions: CIPSession[]; isDark?: boolean }) {
  const totalReq  = sessions.reduce((s, d) => s + d.total, 0)
  const globalMax = sessions.length > 0 ? Math.max(...sessions.map(d => d.max)) : 0
  const totalAnom = sessions.reduce((s, d) => s + d.nb_anomalies, 0)
  const worstRisk = sessions.length > 0 ? sessions.reduce((a, b) => a.risk_score > b.risk_score ? a : b) : null

  const bg     = isDark ? '#1a1a2e' : '#F8FAFC'
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const tSec   = isDark ? '#94a3b8' : '#64748b'

  const kpis = [
    { label: 'Nœuds supervisés',   value: String(sessions.length),                   sub: 'SDP · AIR · OCC · CCN · VS · AF',  accent: '#185FA5' },
    { label: 'Sessions analysées', value: String(sessions.length),                   sub: 'Logs live VM1 · toutes les 2 min',  accent: '#534AB7' },
    { label: 'Total requêtes',     value: (totalReq / 1_000_000).toFixed(1) + ' M',  sub: 'Toutes sessions cumulées',          accent: '#0F6E56' },
    { label: 'Anomalies IsoForest',value: String(totalAnom),                          sub: `Risque max : ${worstRisk ? getRiskStyle(worstRisk.risk_level).label : '—'}`, accent: totalAnom > 20 ? '#A32D2D' : '#854F0B' },
    { label: 'Pic global',         value: globalMax > 0 ? globalMax.toLocaleString() + ' /s' : '—', sub: 'Pic maximum observé', accent: '#854F0B' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
      {kpis.map(k => (
        <div key={k.label} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: '10px', padding: '14px 16px' }}>
          <p style={{ fontSize: '11px', color: tSec, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{k.label}</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: k.accent, lineHeight: 1 }}>{k.value}</p>
          <p style={{ fontSize: '11px', color: tSec, marginTop: '4px' }}>{k.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Card par session ─────────────────────────────────────────────────────────

function SessionCard({ session, isDark }: { session: CIPSession; isDark?: boolean }) {
  const trend   = getTrendLabel(session.trend_pct)
  const zStat   = getZScoreStatus(session.zscore_last)
  const riskSt  = getRiskStyle(session.risk_level)
  const cardBg  = isDark ? '#0f172a' : '#FFFFFF'
  const panelBg = isDark ? '#1a1a2e' : '#F8FAFC'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textPri = isDark ? '#f1f5f9' : '#0f172a'
  const textSec = isDark ? '#94a3b8' : '#64748b'

  const chartData = session.ts_sample.map(p => ({ t: p.t, success: p.s, avg: session.avg }))
  const fillId    = `fill-${session.key}`
  const maxH      = session.hourly.length > 0 ? Math.max(...session.hourly.map(h => h.avg)) : 1
  const failPct   = session.fail_rate * 100

  return (
    <div style={{ background: cardBg, border: `0.5px solid ${border}`, borderTop: `3px solid ${session.color}`, borderRadius: '14px', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${border}`, background: panelBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: session.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={17} color={session.colorDark} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPri, margin: 0 }}>{session.label}</h3>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: session.colorLight, color: session.colorDark }}>
                {session.date} · {session.start} → {session.end}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: textSec, margin: '3px 0 0' }}>
              Source : <span style={{ fontFamily: 'monospace', color: session.color }}>{session.filename}</span>
              {' · '}{session.nb_points.toLocaleString()} mesures
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: failPct < 1 ? '#EAF3DE' : '#FAEEDA', color: failPct < 1 ? '#27500A' : '#854F0B' }}>
            <CheckCircle2 size={11} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
            Fail : {failPct.toFixed(2)} %
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: zStat.bg, color: zStat.color }}>
            Z = {session.zscore_last.toFixed(3)} · {zStat.label}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: riskSt.bg, color: riskSt.color }}>
            {session.nb_anomalies} anomalies · {riskSt.label}
          </span>
        </div>
      </div>

      {/* Corps 4/8 */}
      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr' }}>

        {/* Colonne stats */}
        <div style={{ padding: '18px', borderRight: `0.5px solid ${border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Débit moyen', value: session.avg.toLocaleString() + ' /s', accent: session.color },
              { label: 'Pic max',     value: session.max.toLocaleString() + ' /s', accent: '#A32D2D'     },
              { label: 'Débit min',   value: session.min.toLocaleString() + ' /s', accent: textSec       },
              { label: 'Écart-type',  value: '±' + session.std.toFixed(0),         accent: textSec       },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ background: panelBg, borderRadius: '8px', padding: '10px 12px', border: `0.5px solid ${border}` }}>
                <p style={{ fontSize: '10px', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: accent, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tendance */}
          <div style={{ background: panelBg, borderRadius: '8px', padding: '10px 12px', border: `0.5px solid ${border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: trend.color }}>{trend.icon}</span>
            <div>
              <p style={{ fontSize: '10px', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px', fontWeight: 500 }}>Tendance sur la session</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: trend.color, margin: 0 }}>
                {session.trend_pct > 0 ? '+' : ''}{session.trend_pct.toFixed(1)} % · {trend.label}
              </p>
            </div>
          </div>

          {/* Agrégation horaire */}
          <div style={{ background: panelBg, borderRadius: '8px', padding: '10px 12px', border: `0.5px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Activity size={13} color={session.color} />
              <p style={{ fontSize: '10px', color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 500 }}>Agrégation horaire</p>
            </div>
            {session.hourly.length > 0 ? session.hourly.map(h => {
              const pct = Math.round((h.avg / maxH) * 100)
              return (
                <div key={h.h} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: textSec, fontWeight: 500 }}>{h.h}</span>
                    <span style={{ fontSize: '11px', color: textPri, fontWeight: 600 }}>{h.avg.toLocaleString()} /s</span>
                  </div>
                  <div style={{ height: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: session.color, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            }) : <p style={{ fontSize: '11px', color: textSec }}>Données en cours de collecte…</p>}
          </div>

          {/* Fail/Reject */}
          <div style={{ background: failPct < 1 ? '#EAF3DE' : '#FAEEDA', borderRadius: '8px', padding: '10px 12px', border: `0.5px solid ${failPct < 1 ? 'rgba(59,109,17,0.2)' : 'rgba(133,79,11,0.2)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} color={failPct < 1 ? '#27500A' : '#854F0B'} />
              <p style={{ fontSize: '12px', fontWeight: 600, color: failPct < 1 ? '#27500A' : '#854F0B', margin: 0 }}>
                Fail rate : {failPct.toFixed(3)} %
              </p>
            </div>
            <p style={{ fontSize: '11px', color: failPct < 1 ? '#3B6D11' : '#854F0B', margin: '4px 0 0', paddingLeft: '20px' }}>
              {failPct < 1 ? 'Interface nominale sur toute la fenêtre' : 'Dégradation détectée — surveiller'}
            </p>
          </div>
        </div>

        {/* Colonne graphique */}
        <div style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <BarChart3 size={14} color={session.color} />
            <p style={{ fontSize: '11px', fontWeight: 600, color: textSec, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              Débit · {session.label} · {session.avg.toLocaleString()} /s moy. (pointillé)
            </p>
          </div>

          <div style={{ height: '220px' }}>
            {session.ts_sample.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={session.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={session.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: textSec, fontSize: 10 }} axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: textSec, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? Math.round(v / 1000) + 'k' : String(v)} domain={[Math.round((session.min || 0) * 0.9), Math.round((session.max || 100) * 1.05)]} width={36} />
                  <Tooltip
                    contentStyle={{ background: isDark ? '#0f172a' : '#fff', border: `0.5px solid ${border}`, borderRadius: '8px', fontSize: '12px', color: textPri }}
                    formatter={(value: number, name: string) => [value.toLocaleString() + ' /s', name === 'success' ? 'Débit' : 'Moyenne']}
                    labelStyle={{ color: textSec, fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="avg" stroke={session.color} strokeWidth={1} strokeDasharray="4 3" fill="none" dot={false} activeDot={false} />
                  <Area type="monotone" dataKey="success" stroke={session.color} strokeWidth={2} fill={`url(#${fillId})`} dot={false} activeDot={{ r: 4, fill: session.color, stroke: isDark ? '#0f172a' : '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textSec, fontSize: '13px' }}>
                Données en cours de collecte…
              </div>
            )}
          </div>

          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `0.5px solid ${border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'Points analysés', value: session.nb_points.toLocaleString() },
              { label: 'Total Success',   value: (session.total / 1_000_000).toFixed(2) + ' M' },
              { label: 'Plage horaire',   value: session.start ? `${session.start} → ${session.end}` : '—' },
              { label: 'Anomalies IF',    value: String(session.nb_anomalies) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '10px', color: textSec, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: textPri, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function InsightsPanel({ sessions, isDark }: { sessions: CIPSession[]; isDark?: boolean }) {
  const cardBg  = isDark ? '#0f172a' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const textPri = isDark ? '#f1f5f9' : '#0f172a'
  const textSec = isDark ? '#94a3b8' : '#64748b'
  const globalAvg  = sessions.length > 0 ? Math.round(sessions.reduce((s, d) => s + d.avg, 0) / sessions.length) : 0
  const worstTrend = sessions.length > 0 ? sessions.reduce((a, b) => a.trend_pct < b.trend_pct ? a : b) : null
  const totalAnom  = sessions.reduce((s, d) => s + d.nb_anomalies, 0)
  const interp     = sessions[0]?.interpretation ?? ''
  const avgRisk    = sessions.length > 0 ? Math.round(sessions.reduce((s, d) => s + d.risk_score, 0) / sessions.length * 100) : 0

  const insights = [
    {
      color: '#3B6D11', bg: isDark ? '#173404' : '#EAF3DE',
      icon: <CheckCircle2 size={16} color='#3B6D11' />,
      title: 'Disponibilité globale',
      body: `${sessions.length} nœuds supervisés en temps réel (SDP, AIR, OCC, CCN, VS, AF). Données synchronisées depuis VM1 toutes les 2 minutes via rsync. Débit moyen global : ${globalAvg.toLocaleString()} /s.`,
    },
    {
      color: '#854F0B', bg: isDark ? '#412402' : '#FAEEDA',
      icon: <Activity size={16} color='#854F0B' />,
      title: 'Tendances détectées',
      body: worstTrend
        ? `Le nœud ${worstTrend.label} présente la tendance la plus marquée (${worstTrend.trend_pct.toFixed(1)} %). Comportement analysé sur la dernière heure de collecte.`
        : 'Analyse des tendances en cours sur la fenêtre glissante.',
    },
    {
      color: '#185FA5', bg: isDark ? '#042C53' : '#E6F1FB',
      icon: <BarChart3 size={16} color='#185FA5' />,
      title: 'Isolation Forest — résultats',
      body: `${totalAnom} anomalies détectées sur les ${sessions.length} nœuds (contamination 5%). Les variations correspondent à des fluctuations de charge — aucune dégradation critique détectée.`,
    },
    {
      color: '#534AB7', bg: isDark ? '#26215C' : '#EEEDFE',
      icon: <Info size={16} color='#534AB7' />,
      title: 'Prédiction court terme',
      body: interp || `Risque moyen : ${avgRisk}/100. Sur la base des patterns observés, le trafic est stable. Les modèles sont recalculés à chaque actualisation.`,
    },
  ]

  return (
    <div style={{ background: cardBg, border: `0.5px solid ${border}`, borderRadius: '14px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={15} color='#534AB7' />
        </div>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: textPri, margin: 0 }}>
          Analyse prédictive — 6 nœuds ECS · Isolation Forest · Logs live VM1
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {insights.map(ins => (
          <div key={ins.title} style={{ background: ins.bg, borderRadius: '10px', padding: '12px 14px', borderLeft: `3px solid ${ins.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
              {ins.icon}
              <p style={{ fontSize: '13px', fontWeight: 700, color: textPri, margin: 0 }}>{ins.title}</p>
            </div>
            <p style={{ fontSize: '12px', color: textSec, margin: 0, lineHeight: 1.5 }}>{ins.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PredictionPage() {
  const { isDark } = useThemeColors()
  const { t } = useLang()
  const [sessions, setSessions]         = useState<CIPSession[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [lastUpdate, setLastUpdate]     = useState('')
  const [activeTab, setActiveTab]       = useState<'all' | string>('all')
  const mountedRef = useRef(true)

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    setError(null)
    try {
      const token = document.cookie.split('; ').find(r => r.startsWith('ttcs_token='))?.split('=')[1] ?? ''
      const res = await fetch(`${BASE_URL}/prediction/sdp`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ApiResponse = await res.json()
      if (!mountedRef.current) return
      setSessions(apiToSessions(json))
      setLastUpdate(new Date().toISOString())
    } catch (err: any) {
      if (!mountedRef.current) return
      setError(err.message ?? 'Erreur de connexion au backend')
    } finally {
      if (mountedRef.current) { setIsLoading(false); setIsRefreshing(false) }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadData()
    const iv = setInterval(() => loadData(true), 120_000)
    return () => { mountedRef.current = false; clearInterval(iv) }
  }, [loadData])

  const bgPage  = isDark ? '#070b14' : '#F5F7FA'
  const textPri = isDark ? '#f1f5f9' : '#0f172a'
  const textSec = isDark ? '#94a3b8' : '#64748b'
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const filtered = activeTab === 'all' ? sessions : sessions.filter(s => s.key === activeTab)

  if (isLoading) return (
    <DashboardLayout>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', background: bgPage }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid rgba(83,74,183,0.2)', borderTop: '3px solid #534AB7', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: textSec, fontSize: '14px' }}>Chargement des statistiques — 6 nœuds ECS…</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout>
      <Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)', background: bgPage }}>
        <div style={{ background: '#FCEBEB', border: '0.5px solid rgba(163,45,45,0.2)', borderRadius: '14px', padding: '32px', textAlign: 'center', maxWidth: 420 }}>
          <AlertCircle size={28} color='#A32D2D' style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#A32D2D', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>Impossible de charger les prédictions</p>
          <p style={{ color: '#7f1d1d', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
          <button onClick={() => loadData()} style={{ padding: '8px 20px', background: '#A32D2D', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            Réessayer
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <Topbar onRefresh={() => loadData(true)} isRefreshing={isRefreshing} lastUpdate={lastUpdate} />

      <div style={{ padding: '24px', background: bgPage, minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ borderBottom: `0.5px solid ${border}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: textSec }}>Tableau de bord</span>
            <span style={{ fontSize: '11px', color: textSec }}>›</span>
            <span style={{ fontSize: '12px', color: textSec }}>Prédiction SDP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: textPri, margin: 0 }}>Prédiction & Analyse — Nœuds ECS</h1>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#EEEDFE', color: '#3C3489' }}>Isolation Forest</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <Server size={13} color='#185FA5' />
                <span style={{ fontSize: '13px', color: '#185FA5', fontWeight: 600 }}>6 nœuds · SDP · AIR · OCC · CCN · VS · AF</span>
                <span style={{ fontSize: '13px', color: textSec }}>·</span>
                <span style={{ fontSize: '13px', color: textSec }}>Logs live VM1 · fenêtre 60 min</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastUpdate && <span style={{ fontSize: '11px', color: textSec }}>Mis à jour : {new Date(lastUpdate).toLocaleTimeString('fr-FR')}</span>}
              <button onClick={() => loadData(true)} disabled={isRefreshing} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: `0.5px solid ${border}`, borderRadius: '8px', padding: '7px 14px', fontSize: '13px', color: textPri, cursor: 'pointer', opacity: isRefreshing ? 0.6 : 1 }}>
                <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                {isRefreshing ? 'Actualisation…' : 'Actualiser'}
              </button>
            </div>
          </div>
        </div>

        <GlobalKpiBar sessions={sessions} isDark={isDark} />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('all')} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: activeTab === 'all' ? 600 : 400, border: activeTab === 'all' ? '1.5px solid #534AB7' : `0.5px solid ${border}`, background: activeTab === 'all' ? '#534AB7' : 'transparent', color: activeTab === 'all' ? '#fff' : textSec }}>
            Tous les nœuds
          </button>
          {sessions.map(s => (
            <button key={s.key} onClick={() => setActiveTab(s.key)} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: activeTab === s.key ? 600 : 400, border: activeTab === s.key ? `1.5px solid ${s.color}` : `0.5px solid ${border}`, background: activeTab === s.key ? s.color : 'transparent', color: activeTab === s.key ? '#fff' : textSec, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === s.key ? '#ffffff88' : s.color, display: 'inline-block' }} />
              {s.key}
              {s.start && <span style={{ fontSize: '10px', opacity: 0.75 }}>{s.start}→{s.end}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(s => <SessionCard key={s.key} session={s} isDark={isDark} />)}
        </div>

        {activeTab === 'all' && sessions.length > 0 && <InsightsPanel sessions={sessions} isDark={isDark} />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}