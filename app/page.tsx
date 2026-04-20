'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { Panel } from '@/components/dashboard/panel'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import {
  Server,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Zap,
  ArrowRight,
  Activity,
  TrendingUp,
  MessageSquare,
  Database,
  ExternalLink,
} from 'lucide-react'
import type { SummaryResponse, CorrelationResponse, Anomaly } from '@/lib/api'
import { api } from '@/lib/api'

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [correlation, setCorrelation] = useState<CorrelationResponse | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, correlationData, anomaliesData] = await Promise.all([
        api.getSummary(),
        api.getCorrelation(),
        api.getAnomalies(),
      ])
      setSummary(summaryData)
      setCorrelation(correlationData)
      setAnomalies(anomaliesData.anomalies.slice(0, 10))
      setLastUpdate(summaryData.timestamp)
      setError(null)
    } catch (err) {
      setError('Impossible de se connecter au serveur API')
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await api.refresh()
      await fetchData()
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (isLoading) {
    return (
      <DashboardLayout>
        <Topbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Topbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
            <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">Erreur de connexion</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Réessayer
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdate={lastUpdate} />
      
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Total Noeuds"
            value={summary?.total_nodes ?? 0}
            icon={Server}
            variant="default"
          />
          <StatCard
            title="Critiques"
            value={summary?.CRITICAL ?? 0}
            subtitle={summary?.critical_nodes.join(', ') || 'Aucun'}
            icon={AlertCircle}
            variant="critical"
          />
          <StatCard
            title="Avertissements"
            value={summary?.WARNING ?? 0}
            subtitle={summary?.warning_nodes.join(', ') || 'Aucun'}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Normaux"
            value={summary?.NORMAL ?? 0}
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Correlation and Impact Section */}
        <div className="grid grid-cols-3 gap-4">
          {/* Cause Probable - Highlighted */}
          <Panel title="Cause probable" icon={AlertTriangle} variant="warning" className="col-span-1">
            <div className="flex items-start gap-3">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {correlation?.cause_probable || 'Aucune corrélation détectée'}
              </p>
            </div>
          </Panel>

          {/* Impact Chain */}
          <Panel title="Chaîne d&apos;impact" icon={ArrowRight} className="col-span-1">
            {correlation?.chaine_impact && correlation.chaine_impact.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {correlation.chaine_impact.map((node, index) => (
                  <div key={node} className="flex items-center gap-2">
                    <Link
                      href={`/noeuds/${node.split(' ')[0]}`}
                      className="px-3 py-2 rounded-lg bg-[#ff3b5c]/20 text-[#ff3b5c] font-semibold hover:bg-[#ff3b5c]/30 transition-all hover:scale-105"
                    >
                      {node}
                    </Link>
                    {index < correlation.chaine_impact.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune chaîne d&apos;impact</p>
            )}
          </Panel>

          {/* Impacted Nodes */}
          <Panel title="Noeuds impactés" icon={Server} className="col-span-1">
            <div className="flex flex-wrap gap-2">
              {correlation?.noeuds_impactes && correlation.noeuds_impactes.length > 0 ? (
                correlation.noeuds_impactes.map((node) => (
                  <Link
                    key={node}
                    href={`/noeuds/${node}`}
                    className="px-3 py-2 rounded-lg glass-card border border-primary/30 text-foreground font-medium hover:border-primary/60 transition-all hover:scale-105 flex items-center gap-1.5"
                  >
                    {node}
                    <ExternalLink className="h-3 w-3 text-primary" />
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">Aucun noeud impacté</p>
              )}
            </div>
          </Panel>
        </div>

        {/* Anomalies and Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          {/* Recent Anomalies */}
          <Panel title="Anomalies récentes" icon={Activity} className="col-span-2">
            {anomalies.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {anomalies.map((anomaly, index) => (
                  <div
                    key={`${anomaly.rule_id}-${index}`}
                    className={`flex items-start gap-3 p-4 rounded-xl glass-card transition-all hover:scale-[1.01] ${
                      anomaly.severity === 'CRITICAL' 
                        ? 'border-glow-critical' 
                        : 'border-glow-warning'
                    }`}
                  >
                    <StatusBadge status={anomaly.severity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <RoleBadge role={anomaly.role} size="sm" />
                        <Link
                          href={`/noeuds/${anomaly.node}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {anomaly.node}
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {anomaly.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valeur: <span className="text-foreground font-medium">{anomaly.value}</span> (seuil: {anomaly.threshold})
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
                <p className="text-muted-foreground">Aucune anomalie détectée</p>
              </div>
            )}
          </Panel>

          {/* Quick Actions */}
          <Panel title="Actions rapides" icon={Zap} variant="gradient" className="col-span-1">
            <div className="space-y-3">
              <Link
                href="/noeuds"
                className="flex items-center gap-3 p-4 rounded-xl glass-card border border-border/50 hover:border-primary/50 transition-all group hover:scale-[1.02]"
              >
                <div className="p-2.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Voir les noeuds</p>
                  <p className="text-sm text-muted-foreground">État de tous les serveurs</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/inventaire"
                className="flex items-center gap-3 p-4 rounded-xl glass-card border border-border/50 hover:border-[#a855f7]/50 transition-all group hover:scale-[1.02]"
              >
                <div className="p-2.5 rounded-lg bg-[#a855f7]/20 group-hover:bg-[#a855f7]/30 transition-colors">
                  <Database className="h-5 w-5 text-[#a855f7]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Inventaire</p>
                  <p className="text-sm text-muted-foreground">Configuration système</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#a855f7] group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/prediction"
                className="flex items-center gap-3 p-4 rounded-xl glass-card border border-border/50 hover:border-accent/50 transition-all group hover:scale-[1.02]"
              >
                <div className="p-2.5 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Prédictions</p>
                  <p className="text-sm text-muted-foreground">Analyse prédictive SDP</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/assistant"
                className="flex items-center gap-3 p-4 rounded-xl glass-card border border-border/50 hover:border-[#ffb020]/50 transition-all group hover:scale-[1.02]"
              >
                <div className="p-2.5 rounded-lg bg-[#ffb020]/20 group-hover:bg-[#ffb020]/30 transition-colors">
                  <MessageSquare className="h-5 w-5 text-[#ffb020]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Assistant</p>
                  <p className="text-sm text-muted-foreground">Chatbot intelligent</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#ffb020] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </Panel>
        </div>

        {/* Summary Stats Bar */}
        <div className="glass-card gradient-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className="section-title mb-1">Total anomalies</p>
                <p className="text-3xl font-heading font-bold text-foreground">{correlation?.nb_anomalies ?? 0}</p>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div>
                <p className="section-title mb-1">Critiques</p>
                <p className="text-3xl font-heading font-bold text-[#ff3b5c]">{correlation?.nb_critical ?? 0}</p>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div>
                <p className="section-title mb-1">Avertissements</p>
                <p className="text-3xl font-heading font-bold text-[#ffb020]">{correlation?.nb_warning ?? 0}</p>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div>
                <p className="section-title mb-1">Sources</p>
                <p className="text-2xl font-heading font-bold text-foreground">{correlation?.sources?.join(', ') || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="section-title mb-1">Mis à jour</p>
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
