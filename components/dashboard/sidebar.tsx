'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/language-context'
import {
  LayoutDashboard, Server, Database, Activity,
  TrendingUp, MessageSquare, ShieldCheck, Users,
  ServerCog,
} from 'lucide-react'

export function Sidebar() {
  const pathname   = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted]   = useState(false)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [userName, setUserName] = useState('Tunisie Telecom')
  const [userRole, setUserRole] = useState('')
  const { t } = useLang()

  useEffect(() => {
    setMounted(true)
    const getCookie = (name: string) => {
      const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'))
      return m ? decodeURIComponent(m[1]) : ''
    }
    const role = getCookie('ttcs_role')
    const name = getCookie('ttcs_username') || getCookie('ttcs_name')
    setIsAdmin(role === 'admin')
    if (name) setUserName(name)
    setUserRole(role)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  /* ── tokens ── */
  const bg         = isDark
    ? 'linear-gradient(180deg,#020d1a 0%,#041225 50%,#061830 100%)'
    : 'linear-gradient(180deg,#e8f4ff 0%,#dbeeff 50%,#cce4ff 100%)'
  const borderCol  = 'rgba(0,130,240,0.2)'
  const titleCol   = isDark ? '#ffffff'              : '#0a2540'
  const secLabel   = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,40,100,0.38)'
  const textMuted  = isDark ? 'rgba(255,255,255,0.48)' : '#3a6080'
  const iconMuted  = isDark ? 'rgba(255,255,255,0.38)' : '#4a7aaa'
  const hoverBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,100,200,0.07)'
  const userBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,100,200,0.07)'
  const userBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.18)'
  const divider    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,100,200,0.12)'

  /* ── items nav principale ── */
  const mainNav = [
    { key: 'dashboard',  href: '/',           Icon: LayoutDashboard, color: '#185FA5' },
    { key: 'nodes',      href: '/noeuds',     Icon: Server,          color: '#0F6E56' },
    { key: 'inventory',  href: '/inventaire', Icon: Database,        color: '#534AB7' },
    { key: 'monitoring', href: '/monitoring', Icon: Activity,        color: '#854F0B' },
    { key: 'prediction', href: '/prediction', Icon: TrendingUp,      color: '#993556' },
    { key: 'assistant',  href: '/assistant',  Icon: MessageSquare,   color: '#185FA5' },
  ]

  /* ── items admin ── */
  const adminNav = [
    { key: 'adminUsers', href: '/admin?tab=users', Icon: Users,     color: '#A32D2D', label: t('nav', 'users') || 'Utilisateurs' },
    { key: 'adminNodes', href: '/admin?tab=nodes', Icon: ServerCog, color: '#185FA5', label: t('nav', 'adminNodes') || 'Nœuds réseau' },
  ]

  /* ── NavItem ── */
  function NavItem({
    href, Icon, color, label, exact = false,
  }: {
    href: string; Icon: React.ElementType; color: string; label: string; exact?: boolean
  }) {
    const isActive = exact
      ? pathname === href
      : pathname === href || (href !== '/' && pathname.startsWith(href.split('?')[0]))

    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
            background: isActive ? `${color}1a` : 'transparent',
            borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
            transition: 'background 0.15s, border-color 0.15s',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = hoverBg
          }}
          onMouseLeave={e => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <Icon
            size={15}
            style={{
              color: isActive ? color : iconMuted,
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
            aria-hidden
          />
          <span style={{
            fontSize: '13px',
            fontWeight: isActive ? 500 : 400,
            color: isActive ? (isDark ? '#ffffff' : '#0a2540') : textMuted,
            transition: 'color 0.15s',
            lineHeight: 1,
          }}>
            {label}
          </span>
          {isActive && (
            <div style={{
              marginLeft: 'auto',
              width: 5, height: 5, borderRadius: '50%',
              background: color, opacity: .7, flexShrink: 0,
            }} />
          )}
        </div>
      </Link>
    )
  }

  /* ── Section label ── */
  function SectionLabel({ label }: { label: string }) {
    return (
      <div style={{
        padding: '16px 12px 6px',
        fontSize: '10px',
        fontWeight: 500,
        color: secLabel,
        textTransform: 'uppercase',
        letterSpacing: '.8px',
      }}>
        {label}
      </div>
    )
  }

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-[240px]"
      style={{ background: bg, borderRight: `1px solid ${borderCol}`, transition: 'background 0.3s' }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding: '18px 20px',
        borderBottom: `1px solid ${divider}`,
        display: 'flex', alignItems: 'center', gap: '11px',
      }}>
        <div style={{
          width: 34, height: 34, background: '#0055aa', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <img
            src="/ericsson.jpg" alt="Ericsson"
            style={{ width: 26, height: 26, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: titleCol, letterSpacing: '.04em' }}>
            ERICSSON
          </div>
          <div style={{ fontSize: '10px', color: '#185FA5', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            TTCS Platform
          </div>
        </div>
      </div>

      {/* ── Barre dégradée ── */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg,#185FA5,#0F6E56,#854F0B,#A32D2D,#534AB7)' }} />

      {/* ── Navigation ── */}
      <nav style={{ padding: '8px 10px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>

        <SectionLabel label={t('nav', 'overview') || 'Vue d\'ensemble'} />

        {mainNav.map(item => (
          <NavItem
            key={item.href}
            href={item.href}
            Icon={item.Icon}
            color={item.color}
            label={t('nav', item.key)}
            exact={item.href === '/'}
          />
        ))}

        {/* ── Section Administration — admin uniquement ── */}
        {isAdmin && (
          <>
            <div style={{ margin: '14px 2px 0', height: '0.5px', background: divider }} />
            <SectionLabel label={t('nav', 'administration') || 'Administration'} />

            {adminNav.map(item => (
              <NavItem
                key={item.key}
                href={item.href}
                Icon={item.Icon}
                color={item.color}
                label={item.label}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 16px',
        borderTop: `1px solid ${divider}`,
        background: isDark ? 'rgba(2,13,26,0.6)' : 'rgba(220,237,255,0.6)',
      }}>
        {/* indicateur système */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#3B6D11', boxShadow: '0 0 5px #3B6D11', display: 'inline-block',
          }} />
          <span style={{ fontSize: '10px', color: '#3B6D11', fontWeight: 500 }}>
            {t('nav', 'systemActive') || 'Système opérationnel'}
          </span>
          {/* badge rôle */}
          {mounted && userRole && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '9px', fontWeight: 600,
              padding: '2px 7px', borderRadius: '10px',
              background: isAdmin ? 'rgba(163,45,45,0.14)' : 'rgba(24,95,165,0.14)',
              color: isAdmin ? '#A32D2D' : '#185FA5',
              border: `0.5px solid ${isAdmin ? 'rgba(163,45,45,0.35)' : 'rgba(24,95,165,0.35)'}`,
              textTransform: 'uppercase', letterSpacing: '.04em',
            }}>
              {isAdmin ? 'Admin' : 'Opérateur'}
            </span>
          )}
        </div>

        {/* carte utilisateur */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 11px', borderRadius: '9px',
          background: userBg, border: `0.5px solid ${userBorder}`,
        }}>
          <img
            src="/tt.jpg" alt="Tunisie Telecom"
            style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: '7px', flexShrink: 0 }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '12px', fontWeight: 500, color: titleCol,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              Tunisie Telecom
            </div>
            <div style={{ fontSize: '10px', color: textMuted }}>Version 2.0.0</div>
          </div>
        </div>
      </div>
    </aside>
  )
}