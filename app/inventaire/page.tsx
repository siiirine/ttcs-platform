'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { useThemeColors } from '@/lib/use-theme-colors'
import { useLang } from '@/lib/language-context'
import { Server, AlertCircle, Network, ExternalLink, Cpu, Database, Layers } from 'lucide-react'
import type { InventoryResponse } from '@/lib/api'
import { api, ROLE_DESCRIPTIONS } from '@/lib/api'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const c = useThemeColors()
  const { t } = useLang()

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getInventory()
      setInventory(data); setError(null)
    } catch (err) {
      setError(t('inventory','loadErrorMsg'))
      console.error('API Error:', err)
    } finally { setIsLoading(false) }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])

  if (isLoading) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p style={{ color: c.textSecondary }}>{t('inventory','loading')}</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
          <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">{t('inventory','loadError')}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity">
            {t('inventory','retry')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  const nodes = inventory ? Object.entries(inventory.nodes) : []

  return (
    <DashboardLayout><Topbar />
      <div className="p-6 space-y-6">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: c.textPrimary }}>{t('inventory','title')}</h2>
          <p style={{ color: c.textSecondary, marginTop: '4px' }}>{t('inventory','subtitle')}</p>
        </div>

        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px', boxShadow: c.shadow }}>
          <div className="flex items-center gap-8">
            {[
              { icon: Server, color: '#0082f0', bg: 'rgba(0,130,240,0.15)', label: t('inventory','totalServers'), value: nodes.length },
              { icon: Layers, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', label: t('inventory','uniqueRoles'), value: new Set(nodes.map(([, n]) => n.role)).size },
              { icon: Cpu,    color: '#00d4aa', bg: 'rgba(0,212,170,0.15)', label: t('inventory','system'),       value: 'Ericsson ECS' },
            ].map(({ icon: Icon, color, bg, label, value }, i) => (
              <div key={label} className="flex items-center gap-3" style={{ borderLeft: i > 0 ? `1px solid ${c.borderSubtle}` : 'none', paddingLeft: i > 0 ? '32px' : 0 }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: bg }}><Icon size={20} style={{ color }} /></div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: c.textPrimary, lineHeight: 1.2 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {nodes.map(([name, node]) => {
            const displayName = (node as any).display_name || name
            return (
              <Link key={name} href={`/noeuds/${name}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '24px', boxShadow: c.shadow, transition: 'all 0.25s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadowHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,130,240,0.12)' }}><Server size={22} style={{ color: '#0082f0' }} /></div>
                    <RoleBadge role={node.role} size="md" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, marginBottom: '2px' }}>{displayName}</h3>
                  <p style={{ fontSize: '13px', color: c.textSecondary, marginBottom: '16px', lineHeight: 1.5 }}>
                    {node.description || ROLE_DESCRIPTIONS[node.role] || t('inventory','billingComponent')}
                  </p>
                  <div style={{ paddingTop: '12px', borderTop: `1px solid ${c.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: c.textSecondary }}>
                      <Network size={14} style={{ color: '#0082f0' }} />
                      <span>{t('inventory','port')}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: c.textPrimary }}>{node.port}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#0082f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {t('inventory','details')} <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.panelBg, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)' }}><Database size={16} style={{ color: '#a855f7' }} /></div>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('inventory','architecture')}</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {nodes.map(([name, node]) => {
                const displayName = (node as any).display_name || name
                return (
                  <div key={name} style={{ textAlign: 'center', background: c.panelBg, borderRadius: '10px', padding: '16px', border: `1px solid ${c.border}` }}>
                    <div style={{ marginBottom: '10px' }}><RoleBadge role={node.role} size="sm" /></div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: c.textPrimary }}>{displayName}</p>
                    <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '4px' }}>{t('inventory','port')} {node.port}</p>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: c.panelBg, border: `1px solid rgba(0,130,240,0.2)` }}>
              <p style={{ fontSize: '13px', color: c.textSecondary, lineHeight: 1.7 }}>{t('inventory','archDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}