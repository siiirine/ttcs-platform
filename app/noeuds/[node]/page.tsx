'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { Panel } from '@/components/dashboard/panel'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { ProgressBar } from '@/components/dashboard/progress-bar'
import {
  ArrowLeft,
  AlertCircle,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  Thermometer,
  Zap,
  Wind,
  Timer,
  Server,
  AlertTriangle,
} from 'lucide-react'
import type { NodeStatus, TimelineResponse, TimelineEvent } from '@/lib/api'
import { api, ROLE_DESCRIPTIONS } from '@/lib/api'

interface PageProps {
  params: Promise<{ node: string }>
}

export default function NodeDetailPage({ params }: PageProps) {
  const { node: nodeName } = use(params)
  const [nodeData, setNodeData] = useState<NodeStatus | null>(null)
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [nodeStatus, timelineData] = await Promise.all([
        api.getNodeStatus(nodeName),
        api.getTimeline(nodeName),
      ])
      setNodeData(nodeStatus)
      setTimeline(timelineData)
      setError(null)
    } catch (err) {
      setError('Impossible de charger les données du noeud')
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [nodeName])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}min`
  }

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

  if (error || !nodeData) {
    return (
      <DashboardLayout>
        <Topbar />
        <div className="p-6">
          <Link
            href="/noeuds"
            className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux noeuds
          </Link>
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
              <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Erreur</h2>
              <p className="text-muted-foreground mb-6">{error || 'Noeud introuvable'}</p>
              <button
                onClick={fetchData}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statusGlow = {
    CRITICAL: 'glow-critical',
    WARNING: 'glow-warning',
    NORMAL: '',
  }

  return (
    <DashboardLayout>
      <Topbar lastUpdate={timeline?.timestamp} />
      
      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Link
          href="/noeuds"
          className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux noeuds
        </Link>

        {/* Header */}
        <div className={`glass-card gradient-border rounded-xl p-6 ${statusGlow[nodeData.global_status]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-heading font-bold text-foreground">{nodeName}</h1>
                  <RoleBadge role={nodeData.role} size="lg" />
                </div>
                <p className="text-muted-foreground">
                  {ROLE_DESCRIPTIONS[nodeData.role] || nodeData.role}
                </p>
              </div>
            </div>
            <StatusBadge status={nodeData.global_status} size="lg" pulse={nodeData.global_status === 'CRITICAL'} />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Hardware Card */}
          <Panel title="Hardware" icon={Cpu}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Statut</span>
                <StatusBadge status={nodeData.hw.status} size="sm" />
              </div>
              
              <ProgressBar value={nodeData.hw.cpu_pct} label="CPU" showValue />
              <ProgressBar value={nodeData.hw.ram_pct} label="RAM" showValue />
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#ff3b5c]/20">
                    <Thermometer className="h-3.5 w-3.5 text-[#ff3b5c]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Température</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.cpu_temp}°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#ffb020]/20">
                    <Zap className="h-3.5 w-3.5 text-[#ffb020]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">UPS</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.ups_pct}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Wind className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fan</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.fan_rpm} RPM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/20">
                    <Timer className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">I/O Latency</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.io_latency} ms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#a855f7]/20">
                    <Zap className="h-3.5 w-3.5 text-[#a855f7]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Watts</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.watts} W</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/20">
                    <HardDrive className="h-3.5 w-3.5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rail 12V</p>
                    <p className="font-semibold text-foreground">{nodeData.hw.rail_12v} V</p>
                  </div>
                </div>
              </div>

              {nodeData.hw.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">Problèmes détectés:</p>
                  <ul className="space-y-2">
                    {nodeData.hw.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          {/* OS Card */}
          <Panel title="Système d&apos;exploitation" icon={HardDrive}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Statut</span>
                <StatusBadge status={nodeData.os.status} size="sm" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl glass-card border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground">Load 1m</p>
                  <p className="text-lg font-heading font-bold text-foreground">{nodeData.os.load_avg_1m}</p>
                </div>
                <div className="p-3 rounded-xl glass-card border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground">Load 5m</p>
                  <p className="text-lg font-heading font-bold text-foreground">{nodeData.os.load_avg_5m}</p>
                </div>
                <div className="p-3 rounded-xl glass-card border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground">Load 15m</p>
                  <p className="text-lg font-heading font-bold text-foreground">{nodeData.os.load_avg_15m}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div>
                  <p className="text-xs text-muted-foreground">Zombies</p>
                  <p className="font-semibold text-foreground">{nodeData.os.zombie_procs}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">OOM Kills</p>
                  <p className="font-semibold text-foreground">{nodeData.os.oom_kills}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">TCP Retrans</p>
                  <p className="font-semibold text-foreground">{nodeData.os.tcp_retrans_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">FD Used</p>
                  <p className="font-semibold text-foreground">{nodeData.os.fd_used}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NTP Offset</p>
                  <p className="font-semibold text-foreground">{nodeData.os.ntp_offset_ms} ms</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-semibold text-foreground">{formatUptime(nodeData.os.uptime_sec)}</p>
                  </div>
                </div>
              </div>

              {nodeData.os.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">Problèmes détectés:</p>
                  <ul className="space-y-2">
                    {nodeData.os.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          {/* Application Card */}
          <Panel title="Application" icon={Activity}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Statut</span>
                <StatusBadge status={nodeData.app.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border-glow-critical text-center">
                  <p className="text-xs text-[#ff3b5c]">Alarmes critiques</p>
                  <p className="text-2xl font-heading font-bold text-[#ff3b5c]">{nodeData.app.critical_alarms}</p>
                </div>
                <div className="p-3 rounded-xl border-glow-warning text-center">
                  <p className="text-xs text-[#ffb020]">Alarmes majeures</p>
                  <p className="text-2xl font-heading font-bold text-[#ffb020]">{nodeData.app.major_alarms}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                <div>
                  <p className="text-xs text-muted-foreground">SDP Timeouts</p>
                  <p className="font-semibold text-foreground">{nodeData.app.sdp_timeout_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SDP Conflicts</p>
                  <p className="font-semibold text-foreground">{nodeData.app.sdp_conflict_count}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CCN Lookup Fails</p>
                  <p className="font-semibold text-foreground">{nodeData.app.ccn_lookup_fail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CCN Comm Errors</p>
                  <p className="font-semibold text-foreground">{nodeData.app.ccn_comm_error}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">OCC Alarm State</p>
                  <p className="font-semibold text-foreground">{nodeData.app.occ_alarm_state}</p>
                </div>
              </div>

              {nodeData.app.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">Problèmes détectés:</p>
                  <ul className="space-y-2">
                    {nodeData.app.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* CIP Card if available */}
        {nodeData.cip && (
          <Panel title="CIP (Charging Interface)" icon={Activity} variant="gradient">
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 rounded-xl glass-card border border-border/30 text-center">
                <p className="section-title mb-2">Fail Rate</p>
                <p className="metric-xl font-heading text-foreground">{(nodeData.cip.fail_rate * 100).toFixed(2)}%</p>
              </div>
              <div className="p-5 rounded-xl glass-card border border-border/30 text-center">
                <p className="section-title mb-2">Reject Rate</p>
                <p className="metric-xl font-heading text-foreground">{(nodeData.cip.reject_rate * 100).toFixed(2)}%</p>
              </div>
              <div className="p-5 rounded-xl glass-card border border-border/30 text-center">
                <p className="section-title mb-2">Z-Score Fail</p>
                <p className="metric-xl font-heading text-foreground">{nodeData.cip.z_score_fail.toFixed(3)}</p>
              </div>
            </div>
          </Panel>
        )}

        {/* Timeline */}
        <Panel title="Timeline des événements" icon={Clock}>
          {timeline && timeline.events.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {timeline.events.map((event, index) => (
                <TimelineEventItem key={index} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-accent/20 w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <p className="text-muted-foreground">Aucun événement dans la timeline</p>
            </div>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  )
}

function TimelineEventItem({ event }: { event: TimelineEvent }) {
  const typeConfig: Record<string, { bg: string; text: string }> = {
    HW: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    OS: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    APP: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    ANOMALY: { bg: 'bg-[#ff3b5c]/20', text: 'text-[#ff3b5c]' },
    CIP: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  }

  const config = typeConfig[event.type] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl glass-card border border-border/30 hover-scale">
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>
        {event.type}
      </span>
      <div className="flex-1">
        <p className="text-sm text-foreground">{event.message}</p>
        {event.type === 'ANOMALY' && event.severity && (
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={event.severity} size="sm" />
            {event.value !== undefined && (
              <span className="text-xs text-muted-foreground">
                Valeur: <span className="text-foreground font-medium">{event.value}</span>
              </span>
            )}
            {event.source && (
              <span className="text-xs text-muted-foreground">
                Source: <span className="text-foreground font-medium">{event.source}</span>
              </span>
            )}
          </div>
        )}
      </div>
      {event.type === 'ANOMALY' && (
        <AlertTriangle className="h-4 w-4 text-[#ffb020]" />
      )}
    </div>
  )
}
