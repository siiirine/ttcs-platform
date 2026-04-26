'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'

const GRAFANA_URL = 'http://192.168.147.129:3000'

export default function MonitoringPage() {
  const [iframeError, setIframeError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [key, setKey] = useState(0)
  const c = useThemeColors()

  return (
    <DashboardLayout>
      <Topbar />

      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

        {/* ── Barre du haut ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 24px',
          borderBottom: `1px solid ${c.borderSubtle}`,
          background: c.headerBg,
          flexShrink: 0,
          transition: 'background 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: c.textPrimary }}>Monitoring Grafana</span>
            <span style={{ fontSize: '12px', color: c.textSecondary }}>— Prometheus · Temps réel</span>
            <code style={{
              fontSize: '11px', color: '#0082f0', fontFamily: 'monospace',
              background: 'rgba(0,130,240,0.08)', padding: '2px 8px', borderRadius: '4px',
            }}>
              {GRAFANA_URL}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setIsLoading(true); setIframeError(false); setKey(k => k + 1) }} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              border: `1px solid ${c.border}`,
              background: 'rgba(0,130,240,0.06)',
              color: '#0082f0', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}>
              <RefreshCw size={13} /> Actualiser
            </button>
            <button onClick={() => window.open(GRAFANA_URL, '_blank')} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg,#0055cc,#0082f0)',
              color: 'white', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            }}>
              <ExternalLink size={13} /> Ouvrir Grafana
            </button>
          </div>
        </div>

        {/* ── Iframe ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {isLoading && !iframeError && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: c.isDark ? 'rgba(8,15,26,0.9)' : 'rgba(248,250,252,0.9)',
              gap: '16px',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,130,240,0.15)', borderTopColor: '#0082f0', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: '13px', color: c.textSecondary }}>Chargement de Grafana...</p>
            </div>
          )}

          {iframeError ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)' }}>
                <AlertCircle size={32} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: c.textPrimary, marginBottom: '8px' }}>Grafana non accessible</h3>
                <p style={{ fontSize: '13px', color: c.textSecondary, marginBottom: '4px' }}>Vérifiez que Grafana est démarré sur VM2</p>
                <code style={{ fontSize: '12px', color: '#0082f0', fontFamily: 'monospace' }}>{GRAFANA_URL}</code>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setIsLoading(true); setIframeError(false); setKey(k => k + 1) }} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
                  border: `1px solid ${c.border}`, background: 'rgba(0,130,240,0.06)',
                  color: '#0082f0', fontSize: '13px', cursor: 'pointer',
                }}>
                  <RefreshCw size={14} /> Réessayer
                </button>
                <button onClick={() => window.open(GRAFANA_URL, '_blank')} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px',
                  border: 'none', background: 'linear-gradient(135deg,#0055cc,#0082f0)',
                  color: 'white', fontSize: '13px', cursor: 'pointer',
                }}>
                  <ExternalLink size={14} /> Ouvrir dans un onglet
                </button>
              </div>
            </div>
          ) : (
            <iframe
              key={key}
              src={GRAFANA_URL}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Grafana Dashboard"
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setIframeError(true) }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}