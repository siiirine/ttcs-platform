'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { Panel } from '@/components/dashboard/panel'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { useLang } from '@/lib/language-context'
import {
  Server, AlertTriangle, AlertCircle, CheckCircle,
  Zap, ArrowRight, Activity, TrendingUp,
  MessageSquare, Database, ExternalLink,
} from 'lucide-react'
import type { SummaryResponse, CorrelationResponse, Anomaly } from '@/lib/api'
import { api } from '@/lib/api'

const go = (path: string) => { window.location.href = path }

const NODE_DISPLAY_NAMES: Record<string, string> = {
  'jambala':  'CCN-Node-01',
  'ttair6':   'AIR-Node-01',
  'ttsdp17a': 'SDP-Node-01',
  'ttvs3a':   'VS-Node-01',
  'ttocc1':   'OCC-Node-01',
  'ttaf1':    'AF-Node-01',
}

const dn = (name: string) => NODE_DISPLAY_NAMES[name] || name
const dnList = (names: string[]) => names.map(dn)

export default function DashboardPage() {
  const { t } = useLang()
  const [summary, setSummary]           = useState<SummaryResponse | null>(null)
  const [correlation, setCorrelation]   = useState<CorrelationResponse | null>(null)
  const [anomalies, setAnomalies]       = useState<Anomaly[]>([])
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [lastUpdate, setLastUpdate]     = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, correlationData, anomaliesData] = await Promise.all([
        api.getSummary(), api.getCorrelation(), api.getAnomalies(),
      ])
      setSummary(summaryData)
      setCorrelation(correlationData)
      setAnomalies(anomaliesData.anomalies.slice(0, 10))
      setLastUpdate(summaryData.timestamp)
      setError(null)
    } catch (err) {
      setError(t('dashboard', 'apiError'))
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try { await api.refresh(); await fetchData() }
    catch (err) { console.error('Refresh error:', err) }
    finally { setIsRefreshing(false) }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (isLoading) return (
    <DashboardLayout>
      <Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">{t('dashboard', 'loading')}</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout>
      <Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
          <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">{t('dashboard', 'connectionError')}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity">
            {t('dashboard', 'retry')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdate={lastUpdate} />
      <div className="p-6 space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title={t('dashboard','totalNodes')}  value={summary?.total_nodes ?? 0} icon={Server}        variant="default"  />
          <StatCard title={t('dashboard','critical')}    value={summary?.CRITICAL ?? 0}    icon={AlertCircle}   variant="critical"
            subtitle={summary?.critical_nodes?.length ? dnList(summary.critical_nodes).join(', ') : t('dashboard','none')} />
          <StatCard title={t('dashboard','warnings')}   value={summary?.WARNING ?? 0}     icon={AlertTriangle}  variant="warning"
            subtitle={summary?.warning_nodes?.length ? dnList(summary.warning_nodes).join(', ') : t('dashboard','none')} />
          <StatCard title={t('dashboard','normal')}     value={summary?.NORMAL ?? 0}      icon={CheckCircle}   variant="success"  />
        </div>

        {/* Correlation */}
        <div className="grid grid-cols-3 gap-4">
          <Panel title={t('dashboard','probableCause')} icon={AlertTriangle} variant="warning" className="col-span-1">
            <p className="text-lg font-medium text-foreground leading-relaxed">
              {correlation?.cause_probable || t('dashboard','noCorrelation')}
            </p>
          </Panel>

          <Panel title={t('dashboard','impactChain')} icon={ArrowRight} className="col-span-1">
            {correlation?.chaine_impact?.length ? (
              <div className="flex items-center gap-2 flex-wrap">
                {correlation.chaine_impact.map((node, index) => {
                  const techName = node.split(' ')[0]
                  const displayLabel = node.replace(techName, dn(techName))
                  return (
                    <div key={node} className="flex items-center gap-2">
                      <button onClick={() => go(`/noeuds/${techName}`)} className="px-3 py-2 rounded-lg bg-[#ff3b5c]/20 text-[#ff3b5c] font-semibold hover:bg-[#ff3b5c]/30 transition-all hover:scale-105 cursor-pointer border-0">
                        {displayLabel}
                      </button>
                      {index < correlation.chaine_impact.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('dashboard','noImpactChain')}</p>
            )}
          </Panel>

          <Panel title={t('dashboard','impactedNodes')} icon={Server} className="col-span-1">
            <div className="flex flex-wrap gap-2">
              {correlation?.noeuds_impactes?.length ? (
                correlation.noeuds_impactes.map(node => (
                  <button key={node} onClick={() => go(`/noeuds/${node}`)} className="px-3 py-2 rounded-lg glass-card border border-primary/30 text-foreground font-medium hover:border-primary/60 transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer">
                    {dn(node)}<ExternalLink className="h-3 w-3 text-primary" />
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground">{t('dashboard','noImpactedNodes')}</p>
              )}
            </div>
          </Panel>
        </div>

        {/* Anomalies + Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Panel title={t('dashboard','recentAnomalies')} icon={Activity} className="col-span-2">
            {anomalies.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {anomalies.map((anomaly, index) => (
                  <div key={`${anomaly.rule_id}-${index}`} onClick={() => go(`/noeuds/${anomaly.node}`)} style={{ cursor: 'pointer' }}
                    className={`flex items-start gap-3 p-4 rounded-xl glass-card transition-all hover:scale-[1.01] ${anomaly.severity === 'CRITICAL' ? 'border-glow-critical' : 'border-glow-warning'}`}>
                    <StatusBadge status={anomaly.severity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RoleBadge role={anomaly.role} size="sm" />
                        <span className="font-semibold text-foreground">{dn(anomaly.node)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{anomaly.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('dashboard','value')} <span className="text-foreground font-medium">{anomaly.value}</span> ({t('dashboard','threshold')} {anomaly.threshold})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-accent/20 w-fit mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <p className="text-muted-foreground">{t('dashboard','noAnomalies')}</p>
              </div>
            )}
          </Panel>

          <Panel title={t('dashboard','quickActions')} icon={Zap} variant="default" className="col-span-1">
            <div className="space-y-3">
              {[
                { href: '/noeuds',     icon: Server,       color: 'primary', label: t('dashboard','seeNodes'),   sub: t('dashboard','allServers') },
                { href: '/inventaire', icon: Database,     color: '#a855f7', label: t('dashboard','inventory'),  sub: t('dashboard','systemConfig') },
                { href: '/prediction', icon: TrendingUp,   color: 'accent',  label: t('dashboard','predictions'),sub: t('dashboard','sdpPrediction') },
                { href: '/assistant',  icon: MessageSquare,color: '#ffb020', label: t('dashboard','assistant'),  sub: t('dashboard','intelligentBot') },
              ].map(({ href, icon: Icon, color, label, sub }) => (
                <div key={href} onClick={() => go(href)} style={{ cursor: 'pointer' }}
                  className={`flex items-center gap-3 p-4 rounded-xl glass-card border border-border/50 hover:border-[${color}]/50 transition-all group hover:scale-[1.02]`}>
                  <div className={`p-2.5 rounded-lg bg-[${color}]/20 group-hover:bg-[${color}]/30 transition-colors`}>
                    <Icon className={`h-5 w-5 text-[${color}]`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Summary Bar */}
        <div className="glass-card gradient-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {[
                { label: t('dashboard','totalAnomalies'), value: correlation?.nb_anomalies ?? 0, color: 'text-foreground' },
                { label: t('dashboard','criticalCount'),  value: correlation?.nb_critical ?? 0,  color: 'text-[#ff3b5c]' },
                { label: t('dashboard','warningCount'),   value: correlation?.nb_warning ?? 0,   color: 'text-[#ffb020]' },
              ].map(({ label, value, color }, i) => (
                <div key={label} className="flex items-center gap-8">
                  {i > 0 && <div className="h-12 w-px bg-border/50" />}
                  <div>
                    <p className="section-title mb-1">{label}</p>
                    <p className={`text-3xl font-heading font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
              <div className="h-12 w-px bg-border/50" />
              <div>
                <p className="section-title mb-1">{t('dashboard','sources')}</p>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {correlation?.sources ? dnList(correlation.sources).join(', ') : 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="section-title mb-1">{t('dashboard','updatedAt')}</p>
              <p className="text-sm font-medium text-foreground">
                {lastUpdate ? new Date(lastUpdate).toLocaleString('fr-FR') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}