'use client'

import { usePathname } from 'next/navigation'
import { Clock, RefreshCw, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/noeuds': 'Noeuds',
  '/inventaire': 'Inventaire',
  '/monitoring': 'Monitoring',
  '/prediction': 'Prédiction',
  '/assistant': 'Assistant',
}

interface TopbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdate?: string
}

export function Topbar({ onRefresh, isRefreshing, lastUpdate }: TopbarProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const getTitle = () => {
    if (pathname.startsWith('/noeuds/')) return 'Détail du noeud'
    return pageTitles[pathname] || 'TTCS Platform'
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: '64px',
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,130,240,0.1)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        display: 'flex', height: '100%',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700, fontSize: '20px',
            color: '#0a1628',
          }}>
            {getTitle()}
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: 'rgba(0,212,170,0.12)',
            border: '1px solid rgba(0,212,170,0.25)',
          }}>
            <Wifi size={12} style={{ color: '#00d4aa' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#00d4aa' }}>En ligne</span>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Last Update */}
          {lastUpdate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'rgba(0,130,240,0.05)',
              border: '1px solid rgba(0,130,240,0.12)',
              fontSize: '12px',
            }}>
              <span style={{ color: '#7a9bc5' }}>Mise à jour:</span>
              <span style={{ fontWeight: 600, color: '#0a1628' }}>
                {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          )}

          {/* Clock */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px',
            background: 'rgba(0,130,240,0.05)',
            border: '1px solid rgba(0,130,240,0.12)',
          }}>
            <Clock size={14} style={{ color: '#0082f0' }} />
            <span style={{
              fontFamily: 'monospace', fontWeight: 700, fontSize: '13px',
              color: '#0a1628',
            }}>{currentTime}</span>
          </div>

          {/* Refresh */}
          {onRefresh && (
            <button onClick={onRefresh} disabled={isRefreshing} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg,#0055cc,#0082f0)',
              color: 'white', fontSize: '13px', fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.6 : 1,
              transition: 'all 0.2s',
            }}>
              <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </header>
  )
}