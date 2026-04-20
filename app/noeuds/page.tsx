'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { ProgressBar } from '@/components/dashboard/progress-bar'
import {
  Server, AlertCircle, AlertTriangle, CheckCircle,
  Download, ExternalLink, LayoutGrid, List,
} from 'lucide-react'
import type { StatusResponse, NodeStatus } from '@/lib/api'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function NodesPage() {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getStatus()
      setStatusData(data)
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

  const nodes = statusData ? Object.entries(statusData.nodes) : []
  const stats = {
    total: nodes.length,
    critical: nodes.filter(([, n]) => n.global_status === 'CRITICAL').length,
    warning: nodes.filter(([, n]) => n.global_status === 'WARNING').length,
    normal: nodes.filter(([, n]) => n.global_status === 'NORMAL').length,
  }

  const exportCSV = () => {
    if (!statusData) return
    const headers = ['Noeud', 'Rôle', 'HW', 'OS', 'APP', 'Statut Global', 'Problèmes']
    const rows = Object.entries(statusData.nodes).map(([name, node]) => [
      name, node.role, node.hw.status, node.os.status, node.app.status,
      node.global_status,
      [...node.hw.issues, ...node.os.issues, ...node.app.issues].join('; '),
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `noeuds-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
            <p style={{ color: '#4a6a8a' }}>Chargement des données...</p>
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
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <AlertCircle size={32} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ color: '#0a1628', fontWeight: 700, marginBottom: '8px' }}>Erreur de connexion</h2>
            <p style={{ color: '#4a6a8a', marginBottom: '24px' }}>{error}</p>
            <button onClick={fetchData} style={{
              background: 'linear-gradient(135deg, #0082f0, #00d4aa)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '10px 24px', fontWeight: 600, cursor: 'pointer',
            }}>Réessayer</button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} lastUpdate={statusData?.timestamp} />

      <div className="p-6 space-y-6">
        {/* Hero */}
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0a1628' }}>
              Serveurs Ericsson
            </h2>
            <p style={{ color: '#4a6a8a', marginTop: '4px' }}>
              Supervision en temps réel de l&apos;infrastructure de facturation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,130,240,0.2)', borderRadius: '10px', padding: '4px',
            }}>
              <button onClick={() => setViewMode('grid')} style={{
                padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? '#0082f0' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#4a6a8a',
                transition: 'all 0.2s',
              }}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setViewMode('table')} style={{
                padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: viewMode === 'table' ? '#0082f0' : 'transparent',
                color: viewMode === 'table' ? 'white' : '#4a6a8a',
                transition: 'all 0.2s',
              }}>
                <List size={16} />
              </button>
            </div>
            <button onClick={exportCSV} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,130,240,0.2)',
              color: '#0a1628', fontWeight: 500, cursor: 'pointer',
            }}>
              <Download size={16} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Total"          value={stats.total}    icon={Server}        variant="default" />
          <StatCard title="Sains"          value={stats.normal}   icon={CheckCircle}   variant="success" />
          <StatCard title="Avertissements" value={stats.warning}  icon={AlertTriangle} variant="warning" />
          <StatCard title="Critiques"      value={stats.critical} icon={AlertCircle}   variant="critical" />
        </div>

        {/* Nodes Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-4">
            {nodes.map(([name, node]) => (
              <NodeCard key={name} name={name} node={node} />
            ))}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(0,130,240,0.15)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,130,240,0.06)', borderBottom: '1px solid rgba(0,130,240,0.1)' }}>
                  {['Noeud','Rôle','HW','OS','APP','Statut','Problèmes','Action'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700,
                      color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map(([name, node]) => (
                  <NodeRow key={name} name={name} node={node} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function NodeCard({ name, node }: { name: string; node: NodeStatus }) {
  const borderColors = {
    CRITICAL: '#ef4444',
    WARNING: '#f59e0b',
    NORMAL: '#10b981',
  }

  const getStatusPercent = (status: 'CRITICAL' | 'WARNING' | 'NORMAL') => {
    if (status === 'CRITICAL') return 100
    if (status === 'WARNING') return 60
    return 30
  }

  const allIssues = [...node.hw.issues, ...node.os.issues, ...node.app.issues]

  return (
    <Link href={`/noeuds/${name}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255,255,255,0.88)',
        border: `1px solid rgba(0,130,240,0.15)`,
        borderTop: `4px solid ${borderColors[node.global_status]}`,
        borderRadius: '14px',
        padding: '20px',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        boxShadow: node.global_status === 'CRITICAL'
          ? '0 4px 20px rgba(239,68,68,0.15)'
          : node.global_status === 'WARNING'
          ? '0 4px 20px rgba(245,158,11,0.1)'
          : '0 2px 12px rgba(0,130,240,0.06)',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,130,240,0.15)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = node.global_status === 'CRITICAL'
            ? '0 4px 20px rgba(239,68,68,0.15)'
            : '0 2px 12px rgba(0,130,240,0.06)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0a1628', marginBottom: '6px' }}>
              {name}
            </h3>
            <RoleBadge role={node.role} size="sm" />
          </div>
          <StatusBadge status={node.global_status} size="sm" pulse={node.global_status === 'CRITICAL'} />
        </div>

        {/* Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Hardware', status: node.hw.status },
            { label: 'OS', status: node.os.status },
            { label: 'Application', status: node.app.status },
          ].map(({ label, status }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#4a6a8a' }}>{label}</span>
                <StatusBadge status={status} size="sm" showGlow={false} />
              </div>
              <ProgressBar
                value={getStatusPercent(status)}
                variant={status === 'CRITICAL' ? 'critical' : status === 'WARNING' ? 'warning' : 'success'}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '16px', paddingTop: '12px',
          borderTop: '1px solid rgba(0,130,240,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '12px', color: '#4a6a8a' }}>
            {allIssues.length} problème(s)
          </span>
          <span style={{ fontSize: '12px', color: '#0082f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir détails <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function NodeRow({ name, node }: { name: string; node: NodeStatus }) {
  const allIssues = [...node.hw.issues, ...node.os.issues, ...node.app.issues]

  return (
    <tr style={{ borderBottom: '1px solid rgba(0,130,240,0.08)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,130,240,0.04)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <td style={{ padding: '14px 16px' }}>
        <Link href={`/noeuds/${name}`} style={{ color: '#0082f0', fontWeight: 700, textDecoration: 'none' }}>
          {name}
        </Link>
      </td>
      <td style={{ padding: '14px 16px' }}><RoleBadge role={node.role} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.hw.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.os.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}><StatusBadge status={node.app.status} size="sm" /></td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <StatusBadge status={node.global_status} size="sm" pulse={node.global_status === 'CRITICAL'} />
      </td>
      <td style={{ padding: '14px 16px' }}>
        {allIssues.length > 0 ? (
          <p style={{ fontSize: '12px', color: '#4a6a8a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {allIssues.slice(0, 2).join(', ')}{allIssues.length > 2 && ` +${allIssues.length - 2}`}
          </p>
        ) : (
          <span style={{ fontSize: '12px', color: '#10b981' }}>Aucun problème</span>
        )}
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <Link href={`/noeuds/${name}`} style={{
          color: '#0082f0', fontSize: '12px', fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
        }}>
          Détails <ExternalLink size={12} />
        </Link>
      </td>
    </tr>
  )
}