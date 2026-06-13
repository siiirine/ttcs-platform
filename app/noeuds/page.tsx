'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { ProgressBar } from '@/components/dashboard/progress-bar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { useLang } from '@/lib/language-context'
import { Server, AlertCircle, AlertTriangle, CheckCircle, Download, ExternalLink, LayoutGrid, List } from 'lucide-react'
import type { StatusResponse, NodeStatus } from '@/lib/api'
import { api } from '@/lib/api'

export default function NodesPage() {
  const [statusData, setStatusData]     = useState<StatusResponse | null>(null)
  const [isLoading, setIsLoading]       = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [viewMode, setViewMode]         = useState<'grid' | 'table'>('grid')
  const c = useThemeColors()
  const { t } = useLang()

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getStatus()
      setStatusData(data); setError(null)
    } catch (err) {
      setError(t('nodes', 'apiError'))
      console.error('API Error:', err)
    } finally { setIsLoading(false) }
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

  const nodes = statusData ? Object.entries(statusData.nodes) : []
  const stats = {
    total:    nodes.length,
    critical: nodes.filter(([, n]) => n.global_status === 'CRITICAL').length,
    warning:  nodes.filter(([, n]) => n.global_status === 'WARNING').length,
    normal:   nodes.filter(([, n]) => n.global_status === 'NORMAL').length,
  }

  const exportCSV = () => {
    if (!statusData) return
    const headers = [t('nodes','csvNodeName'), t('nodes','csvDisplayName'), t('nodes','role'), 'HW', 'OS', 'APP', t('nodes','csvGlobalStatus'), t('nodes','csvIssues')]
    const rows = Object.entries(statusData.nodes).map(([name, node]) => [
      name, (node as any).display_name || name,
      node.role, node.hw.status, node.os.status, node.app.status, node.global_status,
      [...node.hw.issues, ...node.os.issues, ...node.app.issues].join('; '),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `noeuds-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p style={{ color: c.textSecondary }}>{t('nodes','loading')}</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div style={{ background: c.cardBg, border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ color: c.textPrimary, fontWeight: 700, marginBottom: '8px' }}>{t('nodes','connectionError')}</h2>
          <p style={{ color: c.textSecondary, marginBottom: '24px' }}>{error}</p>
          <button onClick={fetchData} style={{ background: 'linear-gradient(135deg, #0082f0, #00d4aa)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
            {t('nodes','retry')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdate={statusData?.timestamp} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: c.textPrimary }}>{t('nodes','title')}</h2>
            <p style={{ color: c.textSecondary, marginTop: '4px' }}>{t('nodes','subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ display: 'flex', background: c.toggleBg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '4px' }}>
              <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#0082f0' : 'transparent', color: viewMode === 'grid' ? 'white' : c.textSecondary, transition: 'all 0.2s' }}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('table')} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'table' ? '#0082f0' : 'transparent', color: viewMode === 'table' ? 'white' : c.textSecondary, transition: 'all 0.2s' }}><List size={16} /></button>
            </div>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', background: c.cardBg, border: `1px solid ${c.border}`, color: c.textPrimary, fontWeight: 500, cursor: 'pointer' }}>
              <Download size={16} /> {t('nodes','exportCSV')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard title={t('nodes','total')}    value={stats.total}    icon={Server}        variant="default" />
          <StatCard title={t('nodes','healthy')}  value={stats.normal}   icon={CheckCircle}   variant="success" />
          <StatCard title={t('nodes','warnings')} value={stats.warning}  icon={AlertTriangle} variant="warning" />
          <StatCard title={t('nodes','critical')} value={stats.critical} icon={AlertCircle}   variant="critical" />
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4">
            {nodes.map(([name, node]) => <NodeCard key={name} name={name} node={node} />)}
          </div>
        ) : (
          <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: c.panelBg, borderBottom: `1px solid ${c.borderSubtle}` }}>
                  {[t('nodes','node'), t('nodes','role'), 'HW', 'OS', 'APP', t('nodes','status'), t('nodes','csvIssues'), t('nodes','action')].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map(([name, node]) => <NodeRow key={name} name={name} node={node} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function NodeCard({ name, node }: { name: string; node: NodeStatus }) {
  const c = useThemeColors()
  const { t } = useLang()
  const borderColors: Record<string, string> = { CRITICAL: '#ef4444', WARNING: '#f59e0b', NORMAL: '#10b981', UNKNOWN: '#6b7280' }
  const getStatusPercent = (s: string) => s === 'CRITICAL' ? 100 : s === 'WARNING' ? 60 : 30
  const allIssues = [...node.hw.issues, ...node.os.issues, ...node.app.issues]
  const displayName = (node as any).display_name || name

  return (
    <Link href={`/noeuds/${name}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderTop: `4px solid ${borderColors[node.global_status] ?? '#6b7280'}`, borderRadius: '14px', padding: '20px', transition: 'all 0.25s ease', cursor: 'pointer', boxShadow: c.shadow }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadowHover }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, marginBottom: '2px' }}>{displayName}</h3>
            <div style={{ marginTop: '6px' }}><RoleBadge role={node.role} size="sm" /></div>
          </div>
          <StatusBadge status={node.global_status} size="sm" pulse={node.global_status === 'CRITICAL'} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[{ label: t('nodes','hardware'), status: node.hw.status }, { label: t('nodes','os'), status: node.os.status }, { label: t('nodes','application'), status: node.app.status }].map(({ label, status }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: c.textSecondary }}>{label}</span>
                <StatusBadge status={status} size="sm" showGlow={false} />
              </div>
              <ProgressBar value={getStatusPercent(status)} variant={status === 'CRITICAL' ? 'critical' : status === 'WARNING' ? 'warning' : 'success'} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${c.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: c.textSecondary }}>{allIssues.length} {t('nodes','issues')}</span>
          <span style={{ fontSize: '12px', color: '#0082f0', display: 'flex', alignItems: 'center', gap: '4px' }}>{t('nodes','seeDetails')} <ExternalLink size={12} /></span>
        </div>
      </div>
    </Link>
  )
}

function NodeRow({ name, node }: { name: string; node: NodeStatus }) {
  const c = useThemeColors()
  const { t } = useLang()
  const allIssues = [...node.hw.issues, ...node.os.issues, ...node.app.issues]
  const displayName = (node as any).display_name || name

  return (
    <tr style={{ borderBottom: `1px solid ${c.borderSubtle}` }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = c.panelBg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      <td style={{ padding: '14px 16px' }}>
        <Link href={`/noeuds/${name}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 700, color: '#0082f0' }}>{displayName}</div>
        </Link>
      </td>
      <td style={{ padding: '14px 16px' }}><RoleBadge role={node.role} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.hw.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.os.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.app.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.global_status} size="sm" pulse={node.global_status === 'CRITICAL'} /></td>
      <td style={{ padding: '14px 16px' }}>
        {allIssues.length > 0
          ? <p style={{ fontSize: '12px', color: c.textSecondary, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{allIssues.slice(0, 2).join(', ')}{allIssues.length > 2 && ` +${allIssues.length - 2}`}</p>
          : <span style={{ fontSize: '12px', color: '#10b981' }}>{t('nodes','noIssues')}</span>}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <Link href={`/noeuds/${name}`} style={{ color: '#0082f0', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          {t('nodes','details')} <ExternalLink size={12} />
        </Link>
      </td>
    </tr>
  )
}