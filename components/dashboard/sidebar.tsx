'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Server,
  Database,
  Activity,
  TrendingUp,
  MessageSquare,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, color: '#0082f0' },
  { name: 'Noeuds', href: '/noeuds', icon: Server, color: '#0099cc' },
  { name: 'Inventaire', href: '/inventaire', icon: Database, color: '#a855f7' },
  { name: 'Monitoring', href: '/monitoring', icon: Activity, color: '#f97316' },
  { name: 'Prédiction', href: '/prediction', icon: TrendingUp, color: '#ec4899' },
  { name: 'Assistant', href: '/assistant', icon: MessageSquare, color: '#eab308' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  // ── couleurs selon le thème ──
  const bg       = isDark
    ? 'linear-gradient(180deg, #020d1a 0%, #041225 50%, #061830 100%)'
    : 'linear-gradient(180deg, #e8f4ff 0%, #dbeeff 50%, #cce4ff 100%)'
  const border   = isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.2)'
  const titleCol = isDark ? 'white'   : '#0a2540'
  const textCol  = isDark ? 'rgba(255,255,255,0.5)' : '#2c5282'
  const iconCol  = isDark ? 'rgba(255,255,255,0.5)' : '#4a7aaa'
  const hoverBg  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,100,200,0.08)'
  const userBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,100,200,0.08)'
  const userBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.2)'
  const userNameCol = isDark ? 'white' : '#0a2540'
  const userSubCol  = isDark ? '#5a7a99' : '#4a7aaa'

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[260px]" style={{
      background: bg,
      borderRight: `1px solid ${border}`,
      transition: 'background 0.3s ease',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${isDark ? 'rgba(0,130,240,0.15)' : 'rgba(0,130,240,0.15)'}`,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '40px', height: '40px',
          background: '#0055aa',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px',
        }}>
          <img src="/ericsson.jpg" alt="Ericsson" style={{
            width: '32px', height: '32px',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
          }} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: titleCol, letterSpacing: '0.05em', transition: 'color 0.3s' }}>
            ERICSSON
          </div>
          <div style={{ fontSize: '10px', color: '#0082f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            TTCS PLATFORM
          </div>
        </div>
      </div>

      {/* Barre dégradée TT */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #0066cc, #00cc88, #ffaa00, #ff3366, #aa00ff)',
      }} />

      {/* Navigation */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '10px',
                marginBottom: '4px',
                background: isActive ? `${item.color}20` : 'transparent',
                borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = hoverBg
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <Icon size={18} style={{ color: isActive ? item.color : iconCol, flexShrink: 0, transition: 'color 0.3s' }} />
                <span style={{
                  fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  color: isActive ? (isDark ? 'white' : '#0a2540') : textCol,
                  transition: 'color 0.3s',
                }}>
                  {item.name}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 20px',
        borderTop: `1px solid ${isDark ? 'rgba(0,130,240,0.15)' : 'rgba(0,130,240,0.15)'}`,
      }}>
        {/* Statut système */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#10b981', boxShadow: '0 0 6px #10b981',
          }} />
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>Système actif</span>
        </div>

        {/* Logo TT */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px',
          background: userBg,
          border: `1px solid ${userBorder}`,
          marginBottom: '10px',
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          <img src="/tt.jpg" alt="Tunisie Telecom" style={{
            width: '40px', height: '40px',
            objectFit: 'contain', borderRadius: '8px',
          }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: userNameCol, transition: 'color 0.3s' }}>Tunisie Telecom</div>
            <div style={{ fontSize: '10px', color: userSubCol, transition: 'color 0.3s' }}>Version 2.0.0</div>
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
            width: '100%', padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)',
            color: '#ef4444', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}