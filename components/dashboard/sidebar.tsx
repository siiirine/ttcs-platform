'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Server,
  Database,
  Activity,
  TrendingUp,
  MessageSquare,
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, color: '#0082f0' },
  { name: 'Noeuds', href: '/noeuds', icon: Server, color: '#00d4aa' },
  { name: 'Inventaire', href: '/inventaire', icon: Database, color: '#a855f7' },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, color: '#f97316' },
  { name: 'Prédiction', href: '/prediction', icon: TrendingUp, color: '#ec4899' },
  { name: 'Assistant', href: '/assistant', icon: MessageSquare, color: '#eab308' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px]" style={{
      background: 'linear-gradient(180deg, #020d1a 0%, #041225 50%, #061830 100%)',
      borderRight: '1px solid rgba(0,130,240,0.2)',
    }}>
      {/* Barre verticale dégradée TT */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: 'linear-gradient(180deg, #0066cc, #00cc88, #ffaa00, #ff3366, #aa00ff)',
      }} />

      <div className="flex h-full flex-col">

        {/* Header — Logo Ericsson */}
        <div style={{
          padding: '20px 20px 16px 20px',
          borderBottom: '1px solid rgba(0,130,240,0.15)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#0055aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '4px',
            }}>
              <img
                src="/ericsson.jpg"
                alt="Ericsson"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </div>
            <div>
              <div style={{
                fontSize: '17px',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '0.08em',
              }}>ERICSSON</div>
              <div style={{
                fontSize: '10px',
                color: '#0082f0',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}>TTCS Platform</div>
            </div>
          </div>

          {/* Séparateur dégradé TT */}
          <div style={{
            marginTop: '14px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #0066cc, #00cc88, #ffaa00, #ff3366, #aa00ff)',
          }} />
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'white' : '#7a9bc5',
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color}22, ${item.color}11)`
                    : 'transparent',
                  borderLeft: isActive
                    ? `3px solid ${item.color}`
                    : '3px solid transparent',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    ;(e.currentTarget as HTMLElement).style.color = 'white'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = '#7a9bc5'
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isActive ? `${item.color}22` : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={16} style={{ color: isActive ? item.color : '#7a9bc5' }} />
                </div>
                {item.name}
              </Link>
            )
          })}
        </nav>
{/* Footer — Logo Tunisie Telecom + Logout */}
<div style={{
  padding: '16px 20px',
  borderTop: '1px solid rgba(0,130,240,0.15)',
}}>
  {/* Statut système */}
  <div style={{
    display: 'flex', alignItems: 'center',
    gap: '6px', marginBottom: '12px',
  }}>
    <div style={{
      width: '7px', height: '7px', borderRadius: '50%',
      background: '#10b981', boxShadow: '0 0 6px #10b981',
    }} />
    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>
      Système actif
    </span>
  </div>

  {/* Logo Tunisie Telecom */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 12px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '10px',
  }}>
    <img src="/tt.jpg" alt="Tunisie Telecom" style={{
      width: '40px', height: '40px',
      objectFit: 'contain', borderRadius: '8px',
    }} />
    <div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
        Tunisie Telecom
      </div>
      <div style={{ fontSize: '10px', color: '#5a7a99' }}>Version 2.0.0</div>
    </div>
  </div>

  {/* Bouton Déconnexion */}
  <button
    onClick={() => {
      document.cookie = 'ttcs_token=; path=/; max-age=0'
      document.cookie = 'ttcs_user=; path=/; max-age=0'
      window.location.href = '/login'
    }}
    style={{
      width: '100%',
      padding: '10px',
      borderRadius: '10px',
      border: '1px solid rgba(239,68,68,0.25)',
      background: 'rgba(239,68,68,0.08)',
      color: '#ef4444',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.5)'
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'
      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.25)'
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
    Déconnexion
  </button>

</div>
    

      </div>
    </aside>
  )
}