'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { RefreshCw, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

const pageTitles: Record<string, string> = {
  '/':           'Tableau de bord',
  '/noeuds':     'Noeuds',
  '/inventaire': 'Inventaire',
  '/monitoring': 'Monitoring',
  '/prediction': 'Prédiction',
  '/assistant':  'Assistant',
  '/admin':      'Administration',
  '/profil':     'Mon Profil',
}

interface TopbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdate?: string
}

// ── Helper cookie ─────────────────────────────────────────────────────────────
function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : ''
}

export function Topbar({ onRefresh, isRefreshing, lastUpdate }: TopbarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [mounted, setMounted]         = useState(false)
  const { resolvedTheme, setTheme }   = useTheme()

  // ✅ Nouveau : infos user + avatar + dropdown
  const [user, setUser]         = useState<{ username: string; full_name: string; role: string } | null>(null)
  const [avatar, setAvatar]     = useState<string | null>(null)
  const [dropOpen, setDropOpen] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Horloge — identique à l'original
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)

    // ✅ Charger infos utilisateur
    const raw = getCookie('ttcs_user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUser(u)
        const saved = localStorage.getItem(`avatar_${u.username}`)
        if (saved) setAvatar(saved)
      } catch { /* ignore */ }
    }

    return () => clearInterval(interval)
  }, [])

  // ✅ Rafraîchir l'avatar si modifié depuis la page profil
  useEffect(() => {
    if (!user) return
    const onStorage = (e: StorageEvent) => {
      if (e.key === `avatar_${user.username}`) setAvatar(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user])

  // Ferme dropdown si clic extérieur
  useEffect(() => {
    if (!dropOpen) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-profile-dropdown]')) setDropOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [dropOpen])

  const handleLogout = () => {
    document.cookie = 'ttcs_token=; path=/; max-age=0'
    document.cookie = 'ttcs_user=; path=/; max-age=0'
    document.cookie = 'ttcs_role=; path=/; max-age=0'
    router.push('/login')
  }

  const getTitle = () => {
    if (pathname.startsWith('/noeuds/')) return 'Détail du noeud'
    if (pathname.startsWith('/admin')) return 'Administration'
    return pageTitles[pathname] || 'TTCS Platform'
  }

  // ✅ FIX hydration — identique à l'original
  const isDark = mounted ? resolvedTheme === 'dark' : false

  // Initiales pour avatar de secours
  const initials = (name: string) =>
    name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  const dropBg    = isDark ? '#0f1e30'                  : '#ffffff'
  const dropBdr   = isDark ? 'rgba(0,130,240,0.25)'     : 'rgba(0,130,240,0.18)'
  const dropText  = isDark ? '#e2e8f0'                  : '#0a1628'
  const dropSub   = isDark ? '#5a7a99'                  : '#7a9bc5'
  const dropHover = isDark ? 'rgba(0,130,240,0.1)'      : 'rgba(0,130,240,0.07)'

  return (
    <header suppressHydrationWarning style={{
      position: 'sticky', top: 0, zIndex: 30,
      height: '64px',
      background: isDark ? 'rgba(10,18,32,0.95)' : 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: isDark
        ? '1px solid rgba(0,130,240,0.15)'
        : '1px solid rgba(0,130,240,0.1)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        display: 'flex', height: '100%',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>

        {/* Left — identique à l'original */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 suppressHydrationWarning style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700, fontSize: '20px',
            color: isDark ? '#e2e8f0' : '#0a1628',
          }}>
            {getTitle()}
          </h1>
          
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Last Update — identique à l'original */}
          {lastUpdate && (
            <div suppressHydrationWarning style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              background: isDark ? 'rgba(0,130,240,0.08)' : 'rgba(0,130,240,0.05)',
              border: '1px solid rgba(0,130,240,0.12)',
              fontSize: '12px',
            }}>
              <span style={{ color: '#7a9bc5' }}>Mise à jour:</span>
              <span style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#0a1628' }}>
                {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          )}


          {/* Toggle Dark/Light — identique à l'original */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px',
                borderRadius: '8px', border: 'none',
                background: isDark ? 'rgba(255,200,0,0.12)' : 'rgba(0,30,80,0.07)',
                color: isDark ? '#fbbf24' : '#1e3a5f',
                cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? 'rgba(255,200,0,0.22)' : 'rgba(0,30,80,0.14)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = isDark
                  ? 'rgba(255,200,0,0.12)' : 'rgba(0,30,80,0.07)'
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          )}

          {/* Refresh — identique à l'original */}
          {onRefresh && (
            <button onClick={onRefresh} disabled={isRefreshing} style={{
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: '8px', border: 'none',
  background: 'linear-gradient(135deg,#0055cc,#0082f0)',
  color: 'white', cursor: isRefreshing ? 'not-allowed' : 'pointer',
  opacity: isRefreshing ? 0.6 : 1, transition: 'all 0.2s',
}} title="Actualiser">
  <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
</button>
          )}

          {/* ✅ NOUVEAU : Avatar + dropdown profil */}
          {mounted && (
            <div data-profile-dropdown style={{ position: 'relative' }}>
              <button
                onClick={() => setDropOpen(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '4px 10px 4px 4px', borderRadius: '10px',
                  background: dropOpen
                    ? (isDark ? 'rgba(0,130,240,0.18)' : 'rgba(0,130,240,0.1)')
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,130,240,0.06)'),
                  border: `1px solid ${dropOpen ? 'rgba(0,130,240,0.45)' : 'rgba(0,130,240,0.2)'}`,
                  cursor: 'pointer', transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  if (!dropOpen) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(0,130,240,0.12)' : 'rgba(0,130,240,0.09)'
                }}
                onMouseLeave={e => {
                  if (!dropOpen) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,130,240,0.06)'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: avatar ? 'transparent' : 'linear-gradient(135deg,#0055cc,#0082f0)',
                  border: '2px solid rgba(0,130,240,0.45)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,130,240,0.25)',
                }}>
                  {avatar
                    ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>
                        {initials(user?.full_name || user?.username || 'U')}
                      </span>
                  }
                </div>

                {/* Nom */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700,
                    color: isDark ? '#e2e8f0' : '#0a1628',
                    maxWidth: '100px', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2,
                  }}>
                    {user?.full_name || user?.username || 'Profil'}
                  </div>
                  <div style={{
                    fontSize: '10px', fontWeight: 600,
                    color: user?.role === 'admin' ? '#ef4444' : '#0082f0',
                  }}>
                    {user?.role === 'admin' ? 'Admin' : 'Opérateur'}
                  </div>
                </div>

                <ChevronDown
                  size={13}
                  style={{
                    color: dropSub, flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: dropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Dropdown menu */}
              {dropOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: dropBg,
                  border: `1px solid ${dropBdr}`,
                  borderRadius: '13px', padding: '6px',
                  boxShadow: isDark
                    ? '0 16px 48px rgba(0,0,0,0.5)'
                    : '0 12px 40px rgba(0,130,240,0.15)',
                  minWidth: '210px', zIndex: 200,
                  animation: 'dropDown 0.18s ease',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '10px 12px 12px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,130,240,0.1)'}`,
                    marginBottom: '6px',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: dropText }}>
                      {user?.full_name || user?.username}
                    </div>
                    <div style={{ fontSize: '11px', color: dropSub, fontFamily: 'monospace' }}>
                      @{user?.username}
                    </div>
                  </div>

                  {/* Mon profil */}
                  <Link href="/profil" onClick={() => setDropOpen(false)} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px',
                        color: dropSub, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = dropHover
                        ;(e.currentTarget as HTMLElement).style.color = dropText
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = dropSub
                      }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,130,240,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={13} color="#0082f0" />
                      </div>
                      Mon profil
                    </div>
                  </Link>


                  {/* Séparateur */}
                  <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,130,240,0.1)', margin: '6px 0' }} />

                  {/* Déconnexion */}
                  <div
                    onClick={() => { setDropOpen(false); handleLogout() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px',
                      color: '#ef4444', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogOut size={13} color="#ef4444" />
                    </div>
                    Déconnexion
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </header>
  )
}