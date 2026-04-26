'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { useThemeColors } from '@/lib/use-theme-colors'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Activity, BarChart3, Target } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import type { PredictResponse, SDPPrediction } from '@/lib/api'
import { api } from '@/lib/api'

export default function PredictionPage() {
  const [predictions, setPredictions] = useState<PredictResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const c = useThemeColors()

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getPredict()
      setPredictions(data)
      setError(null)
    } catch (err) {
      setError('Impossible de charger les prédictions')
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.refreshPredict()
      await fetchData()
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (isLoading) return (
    <DashboardLayout><Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(0,130,240,0.2)', borderTop: '4px solid #0082f0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: c.textSecondary }}>Chargement des prédictions...</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout><Topbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 64px)' }}>
        <div style={{ background: c.cardBg, border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: c.textPrimary, fontWeight: 700, marginBottom: '8px' }}>Erreur de chargement</h2>
          <p style={{ color: c.textSecondary, marginBottom: '24px' }}>{error}</p>
          <button onClick={fetchData} style={{ background: 'linear-gradient(135deg, #0082f0, #00d4aa)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>Réessayer</button>
        </div>
      </div>
    </DashboardLayout>
  )

  const sdpNodes = predictions ? Object.entries(predictions.sdp_nodes) : []
  const riskScore = (predictions?.global.risk_score || 0) * 100

  return (
    <DashboardLayout>
      <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdate={predictions?.timestamp} />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Global Risk */}
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: '16px' }}>
          {/* Gauge */}
          <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '24px', boxShadow: c.shadow }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>Score de risque global</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RiskGauge score={riskScore} level={predictions?.global.risk_level || 'NORMAL'} textColor={c.textPrimary} subColor={c.textSecondary} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <StatusBadge status={predictions?.global.risk_level || 'NORMAL'} size="lg" pulse={predictions?.global.risk_level === 'CRITICAL'} />
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px', boxShadow: c.shadow }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Interprétation</p>
              <p style={{ fontSize: '15px', color: c.textPrimary, lineHeight: 1.6 }}>{predictions?.global.interpretation || 'Analyse en cours...'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px', boxShadow: c.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0,130,240,0.1)' }}><Activity size={16} style={{ color: '#0082f0' }} /></div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Noeuds SDP analysés</p>
                </div>
                <p style={{ fontSize: '3rem', fontWeight: 800, color: '#0082f0', lineHeight: 1 }}>{predictions?.global.nb_sdp || 0}</p>
              </div>
              <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px', boxShadow: c.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={handleRefresh} disabled={isRefreshing} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ padding: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #0082f0, #00d4aa)' }}>
                    <RefreshCw size={22} style={{ color: 'white', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: c.textPrimary }}>{isRefreshing ? 'Actualisation...' : 'Actualiser les prédictions'}</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SDP Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sdpNodes.map(([name, sdp]) => <SDPNodeCard key={name} name={name} sdp={sdp} />)}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}

function RiskGauge({ score, level, textColor, subColor }: { score: number; level: string; textColor: string; subColor: string }) {
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  const colors: Record<string, string[]> = { NORMAL: ['#00d4aa', '#00a3ff'], WARNING: ['#ffb020', '#ff8c00'], CRITICAL: ['#ff3b5c', '#ff0040'] }
  const gradId = `rg-${level}`
  const c = colors[level] || colors.NORMAL
  return (
    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
      <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 200 200">
        <defs><linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={c[0]} /><stop offset="100%" stopColor={c[1]} /></linearGradient></defs>
        <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(0,130,240,0.12)" strokeWidth="12" />
        <circle cx="100" cy="100" r={radius} fill="none" stroke={`url(#${gradId})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: textColor }}>{Math.round(score)}%</span>
        <span style={{ fontSize: '11px', color: subColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risque</span>
      </div>
    </div>
  )
}

function SDPNodeCard({ name, sdp }: { name: string; sdp: SDPPrediction }) {
  const c = useThemeColors()
  const chartData = sdp.prediction.predictions.map(p => ({ label: p.label, failRate: +(p.fail_rate * 100).toFixed(4), lower: +(p.lower * 100).toFixed(4), upper: +(p.upper * 100).toFixed(4) }))
  const TrendIcon = sdp.prediction.tendance >= 0 ? TrendingUp : TrendingDown
  const trendColor = sdp.prediction.tendance >= 0 ? '#f59e0b' : '#10b981'
  const borderColors: Record<string, string> = { CRITICAL: '#ef4444', WARNING: '#f59e0b', NORMAL: '#10b981' }
  const borderColor = borderColors[sdp.prediction.risk_level]

  return (
    <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderTop: `4px solid ${borderColor}`, borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.panelBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168,85,247,0.12)' }}><BarChart3 size={18} style={{ color: '#a855f7' }} /></div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: c.textPrimary }}>{name}</h3>
            <p style={{ fontSize: '12px', color: c.textSecondary }}>Service Data Point</p>
          </div>
        </div>
        <StatusBadge status={sdp.prediction.risk_level} size="md" pulse={sdp.prediction.risk_level === 'CRITICAL'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr' }}>
        {/* Stats */}
        <div style={{ padding: '20px', borderRight: `1px solid ${c.borderSubtle}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Fail Rate Actuel', value: `${(sdp.prediction.current_fail_rate * 100).toFixed(4)}%`, color: c.textPrimary },
              { label: 'Moyenne Prédite',  value: `${(sdp.prediction.mean_predicted_fail_rate * 100).toFixed(4)}%`, color: c.textPrimary },
              { label: 'Z-Score',          value: sdp.prediction.z_score_actuel.toFixed(3), color: Math.abs(sdp.prediction.z_score_actuel) > 2 ? '#ef4444' : c.textPrimary },
              { label: 'Horizon',          value: sdp.prediction.horizon, color: '#0082f0' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: c.panelBg, borderRadius: '10px', padding: '12px', border: `1px solid ${c.borderSubtle}` }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ background: c.panelBg, borderRadius: '10px', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${c.borderSubtle}` }}>
            <TrendIcon size={18} style={{ color: trendColor }} />
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tendance</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: trendColor }}>{sdp.prediction.tendance >= 0 ? '+' : ''}{(sdp.prediction.tendance * 100).toFixed(4)}%</p>
            </div>
          </div>
          <div style={{ background: c.panelBg, borderRadius: '10px', padding: '12px', border: `1px solid ${c.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Activity size={14} style={{ color: '#0082f0' }} />
              <p style={{ fontSize: '10px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Isolation Forest</p>
            </div>
            {[
              { label: 'Anomalies historiques', value: sdp.isolation_forest.nb_anomalies_historiques },
              { label: "Taux d'anomalie",        value: `${(sdp.isolation_forest.taux_anomalie * 100).toFixed(2)}%` },
              { label: 'Score moyen',            value: sdp.isolation_forest.score_moyen.toFixed(4) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: c.textSecondary }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: c.textPrimary }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Target size={14} style={{ color: '#0082f0' }} />
            <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Prédiction sur {sdp.prediction.horizon}</p>
          </div>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`cg-${name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0082f0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0082f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,130,240,0.1)'} />
                <XAxis dataKey="label" tick={{ fill: c.textSecondary, fontSize: 11 }} axisLine={{ stroke: c.borderSubtle }} />
                <YAxis tick={{ fill: c.textSecondary, fontSize: 11 }} axisLine={{ stroke: c.borderSubtle }} domain={[0, 'auto']} tickFormatter={v => `${v.toFixed(2)}%`} />
                <Tooltip contentStyle={{ background: c.cardBgSolid, border: `1px solid ${c.border}`, borderRadius: '10px', color: c.textPrimary }} formatter={(value: number) => [`${value.toFixed(4)}%`, '']} />
                <Area type="monotone" dataKey="failRate" stroke="#0082f0" strokeWidth={2.5} fill={`url(#cg-${name})`} name="Fail Rate" dot={{ fill: '#0082f0', strokeWidth: 2, r: 3 }} activeDot={{ r: 5, fill: '#00d4aa' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${c.borderSubtle}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Points analysés',  value: sdp.statistiques.nb_points.toLocaleString() },
              { label: 'Total moyen',       value: sdp.statistiques.total_moyen.toLocaleString() },
              { label: 'Fail rate moyen',   value: `${(sdp.statistiques.fail_rate_moyen * 100).toFixed(4)}%` },
              { label: 'Fail rate max',     value: `${(sdp.statistiques.fail_rate_max * 100).toFixed(4)}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: '11px', color: c.textSecondary, marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: c.textPrimary }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}