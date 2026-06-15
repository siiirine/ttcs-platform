'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { Panel } from '@/components/dashboard/panel'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { ProgressBar } from '@/components/dashboard/progress-bar'
import { useLang } from '@/lib/language-context'
import {
  ArrowLeft, AlertCircle, Cpu, HardDrive, Activity,
  Clock, Thermometer, Zap, Wind, Timer, Server, AlertTriangle,
} from 'lucide-react'
import type { NodeStatus, TimelineResponse, TimelineEvent } from '@/lib/api'
import { api, ROLE_DESCRIPTIONS } from '@/lib/api'

interface PageProps {
  params: Promise<{ node: string }>
}

export default function NodeDetailPage({ params }: PageProps) {
  const { node: nodeName } = use(params)
  const [nodeData, setNodeData]   = useState<NodeStatus | null>(null)
  const [timeline, setTimeline]   = useState<TimelineResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const { t } = useLang()

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
      setError(t('nodes', 'apiError'))
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [nodeName, t])

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

  // ✅ display_name depuis l'API ou nodeName technique
  const displayName = (nodeData as any)?.display_name || nodeName

  if (isLoading) return (
    <DashboardLayout>
      <Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-muted-foreground">{t('nodes', 'loading')}</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error || !nodeData) return (
    <DashboardLayout>
      <Topbar />
      <div className="p-6">
        <Link href="/noeuds" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          {t('nodeDetail', 'backToNodes')}
        </Link>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
            <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">{t('common', 'error')}</h2>
            <p className="text-muted-foreground mb-6">{error || t('nodeDetail', 'notFound')}</p>
            <button onClick={fetchData} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity">
              {t('nodes', 'retry')}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )

  const statusGlow: Record<string, string> = {
    CRITICAL: 'glow-critical', WARNING: 'glow-warning', NORMAL: '',
  }

  return (
    <DashboardLayout>
      <Topbar lastUpdate={timeline?.timestamp} />
      <div className="p-6 space-y-6">

        {/* Retour */}
        <Link href="/noeuds" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium">
          <ArrowLeft className="h-4 w-4" />
          {t('nodeDetail', 'backToNodes')}
        </Link>

        {/* Header — ✅ displayName au lieu de nodeName */}
        <div className={`glass-card gradient-border rounded-xl p-6 ${statusGlow[nodeData.global_status]}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {/* ✅ Affiche CCN-Node-01 au lieu de jambala */}
                  <h1 className="text-3xl font-heading font-bold text-foreground">{displayName}</h1>
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

          {/* Hardware */}
          <Panel title={t('nodeDetail', 'hardware')} icon={Cpu}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t('nodeDetail', 'status')}</span>
                <StatusBadge status={nodeData.hw.status} size="sm" />
              </div>
              <ProgressBar value={nodeData.hw.cpu_pct} label="CPU" showValue />
              <ProgressBar value={nodeData.hw.ram_pct} label="RAM" showValue />
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                {[
                  { icon: Thermometer, color: '#ff3b5c', bg: 'bg-[#ff3b5c]/20', label: t('nodeDetail', 'temperature'), value: `${nodeData.hw.cpu_temp}°C` },
                  { icon: Zap,         color: '#ffb020', bg: 'bg-[#ffb020]/20',  label: 'UPS',                         value: `${nodeData.hw.ups_pct}%` },
                  { icon: Wind,        color: '#0082f0', bg: 'bg-primary/20',    label: 'Fan',                         value: `${nodeData.hw.fan_rpm} RPM` },
                  { icon: Timer,       color: '#00d4aa', bg: 'bg-accent/20',     label: 'I/O Latency',                 value: `${nodeData.hw.io_latency} ms` },
                  { icon: Zap,         color: '#a855f7', bg: 'bg-[#a855f7]/20', label: 'Watts',                       value: `${nodeData.hw.watts} W` },
                  { icon: HardDrive,   color: '#14b8a6', bg: 'bg-teal-500/20',  label: 'Rail 12V',                   value: `${nodeData.hw.rail_12v} V` },
                ].map(({ icon: Icon, color, bg, label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${bg}`}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {nodeData.hw.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">{t('nodeDetail', 'detectedIssues')}</p>
                  <ul className="space-y-2">
                    {nodeData.hw.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          {/* OS */}
          <Panel title={t('nodeDetail', 'os')} icon={HardDrive}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t('nodeDetail', 'status')}</span>
                <StatusBadge status={nodeData.os.status} size="sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Load 1m',  value: nodeData.os.load_avg_1m },
                  { label: 'Load 5m',  value: nodeData.os.load_avg_5m },
                  { label: 'Load 15m', value: nodeData.os.load_avg_15m },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl glass-card border border-border/30 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-heading font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                {[
                  { label: 'Zombies',     value: nodeData.os.zombie_procs },
                  { label: 'OOM Kills',   value: nodeData.os.oom_kills },
                  { label: 'TCP Retrans', value: nodeData.os.tcp_retrans_rate },
                  { label: 'FD Used',     value: nodeData.os.fd_used },
                  { label: 'NTP Offset',  value: `${nodeData.os.ntp_offset_ms} ms` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{value}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('nodeDetail', 'uptime')}</p>
                    <p className="font-semibold text-foreground">{formatUptime(nodeData.os.uptime_sec)}</p>
                  </div>
                </div>
              </div>
              {nodeData.os.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">{t('nodeDetail', 'detectedIssues')}</p>
                  <ul className="space-y-2">
                    {nodeData.os.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>

          {/* Application */}
          <Panel title={t('nodeDetail', 'application')} icon={Activity}>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">{t('nodeDetail', 'status')}</span>
                <StatusBadge status={nodeData.app.status} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border-glow-critical text-center">
                  <p className="text-xs text-[#ff3b5c]">{t('nodeDetail', 'criticalAlarms')}</p>
                  <p className="text-2xl font-heading font-bold text-[#ff3b5c]">{nodeData.app.critical_alarms}</p>
                </div>
                <div className="p-3 rounded-xl border-glow-warning text-center">
                  <p className="text-xs text-[#ffb020]">{t('nodeDetail', 'majorAlarms')}</p>
                  <p className="text-2xl font-heading font-bold text-[#ffb020]">{nodeData.app.major_alarms}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                {[
                  { label: 'SDP Timeouts',   value: nodeData.app.sdp_timeout_count },
                  { label: 'SDP Conflicts',  value: nodeData.app.sdp_conflict_count },
                  { label: 'CCN Lookup Fails', value: nodeData.app.ccn_lookup_fail },
                  { label: 'CCN Comm Errors',  value: nodeData.app.ccn_comm_error },
                  { label: 'OCC Alarm State',  value: nodeData.app.occ_alarm_state },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              {nodeData.app.issues.length > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-semibold text-[#ff3b5c] mb-2">{t('nodeDetail', 'detectedIssues')}</p>
                  <ul className="space-y-2">
                    {nodeData.app.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg bg-[#ff3b5c]/10">
                        <AlertCircle className="h-4 w-4 text-[#ff3b5c] mt-0.5 flex-shrink-0" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* CIP */}
        {nodeData.cip && (
          <Panel title={t('nodeDetail', 'cip')} icon={Activity} variant="gradient">
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Fail Rate',    value: `${(nodeData.cip.fail_rate * 100).toFixed(2)}%` },
                { label: 'Reject Rate',  value: `${(nodeData.cip.reject_rate * 100).toFixed(2)}%` },
                { label: 'Z-Score Fail', value: nodeData.cip.z_score_fail.toFixed(3) },
              ].map(({ label, value }) => (
                <div key={label} className="p-5 rounded-xl glass-card border border-border/30 text-center">
                  <p className="section-title mb-2">{label}</p>
                  <p className="metric-xl font-heading text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Timeline */}
        <Panel title={t('nodeDetail', 'timeline')} icon={Clock}>
          {timeline && timeline.events.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {timeline.events.map((event, index) => (
                <TimelineEventItem key={index} event={event} valueLabel={t('nodeDetail', 'value')} sourceLabel={t('nodeDetail', 'source')} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-accent/20 w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-accent" />
              </div>
              <p className="text-muted-foreground">{t('nodeDetail', 'noEvents')}</p>
            </div>
          )}
        </Panel>

      </div>
    </DashboardLayout>
  )
}

function TimelineEventItem({ event, valueLabel, sourceLabel }: { event: TimelineEvent; valueLabel: string; sourceLabel: string }) {
  const typeConfig: Record<string, { bg: string; text: string }> = {
    HW:      { bg: 'bg-blue-500/20',   text: 'text-blue-400' },
    OS:      { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    APP:     { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    ANOMALY: { bg: 'bg-[#ff3b5c]/20',  text: 'text-[#ff3b5c]' },
    CIP:     { bg: 'bg-teal-500/20',   text: 'text-teal-400' },
  }
  const config = typeConfig[event.type] || { bg: 'bg-gray-500/20', text: 'text-gray-400' }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl glass-card border border-border/30 hover-scale">
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bg} ${config.text}`}>{event.type}</span>
      <div className="flex-1">
        <p className="text-sm text-foreground">{event.message}</p>
        {event.type === 'ANOMALY' && event.severity && (
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={event.severity} size="sm" />
            {event.value !== undefined && (
              <span className="text-xs text-muted-foreground">
                {valueLabel}: <span className="text-foreground font-medium">{event.value}</span>
              </span>
            )}
            {event.source && (
              <span className="text-xs text-muted-foreground">
                {sourceLabel}: <span className="text-foreground font-medium">{event.source}</span>
              </span>
            )}
          </div>
        )}
      </div>
      {event.type === 'ANOMALY' && <AlertTriangle className="h-4 w-4 text-[#ffb020]" />}
    </div>
  )
}