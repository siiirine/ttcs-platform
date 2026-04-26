'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'critical' | 'warning' | 'success'
  className?: string
}

const variantConfig = {
  default:  { borderColor: '#0082f0', valueColor: '#0082f0', iconBg: 'rgba(0,130,240,0.12)',  iconColor: '#0082f0' },
  critical: { borderColor: '#ef4444', valueColor: '#ef4444', iconBg: 'rgba(239,68,68,0.12)',  iconColor: '#ef4444' },
  warning:  { borderColor: '#f59e0b', valueColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b' },
  success:  { borderColor: '#10b981', valueColor: '#10b981', iconBg: 'rgba(16,185,129,0.12)', iconColor: '#10b981' },
}

const TT_GRADIENTS = {
  default:  'linear-gradient(135deg, #0055cc, #00aaff, #00dd99, #aa00ff)',
  critical: 'linear-gradient(135deg, #ff0044, #ff6600, #ffcc00, #ff3399)',
  warning:  'linear-gradient(135deg, #ffcc00, #ff6600, #ff0044, #cc00ff)',
  success:  'linear-gradient(135deg, #00dd99, #00aaff, #aa00ff, #ff3399)',
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', className }: StatCardProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const cfg        = variantConfig[variant]
  const cardBg     = isDark ? 'rgba(15,25,45,0.9)'          : 'rgba(255,255,255,0.85)'
  const borderCol  = isDark ? 'rgba(0,130,240,0.15)'         : 'rgba(0,130,240,0.15)'
  const labelColor = isDark ? '#64748b'                       : '#4a6a8a'
  const subColor   = isDark ? '#475569'                       : '#7a9bc5'
  const shadow     = isDark ? '0 2px 12px rgba(0,0,0,0.3)'  : '0 2px 12px rgba(0,130,240,0.08)'

  return (
    <div
      className={className}
      style={{
        borderRadius: '14px',
        padding: '20px 24px',
        background: cardBg,
        borderTop:    `1px solid ${borderCol}`,
        borderRight:  `1px solid ${borderCol}`,
        borderBottom: `1px solid ${borderCol}`,
        borderLeft:   `4px solid ${cfg.borderColor}`,
        transition: 'all 0.35s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: shadow,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform         = 'translateY(-5px)'
        el.style.borderTopColor    = 'transparent'
        el.style.borderRightColor  = 'transparent'
        el.style.borderBottomColor = 'transparent'
        el.style.borderLeftColor   = 'transparent'
        el.style.background        = TT_GRADIENTS[variant]
        el.style.boxShadow         = '0 16px 40px rgba(0,0,0,0.25)'
        const val = el.querySelector('.stat-value') as HTMLElement
        const lbl = el.querySelector('.stat-label') as HTMLElement
        const sub = el.querySelector('.stat-sub')   as HTMLElement
        const ico = el.querySelector('.stat-icon')  as HTMLElement
        if (val) val.style.color = 'white'
        if (lbl) lbl.style.color = 'rgba(255,255,255,0.85)'
        if (sub) sub.style.color = 'rgba(255,255,255,0.7)'
        if (ico) ico.style.background = 'rgba(255,255,255,0.2)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform         = 'translateY(0)'
        el.style.borderTopColor    = borderCol
        el.style.borderRightColor  = borderCol
        el.style.borderBottomColor = borderCol
        el.style.borderLeftColor   = cfg.borderColor
        el.style.background        = cardBg
        el.style.boxShadow         = shadow
        const val = el.querySelector('.stat-value') as HTMLElement
        const lbl = el.querySelector('.stat-label') as HTMLElement
        const sub = el.querySelector('.stat-sub')   as HTMLElement
        const ico = el.querySelector('.stat-icon')  as HTMLElement
        if (val) val.style.color = cfg.valueColor
        if (lbl) lbl.style.color = labelColor
        if (sub) sub.style.color = subColor
        if (ico) ico.style.background = cfg.iconBg
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p className="stat-label" style={{
            fontSize: '11px', color: labelColor,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontWeight: 600, marginBottom: '8px', transition: 'color 0.3s',
          }}>
            {title}
          </p>
          <p className="stat-value" style={{
            fontSize: '3rem', fontWeight: 800, lineHeight: 1,
            color: cfg.valueColor, marginBottom: '6px', transition: 'color 0.3s',
          }}>
            {value}
          </p>
          {subtitle && (
            <p className="stat-sub" style={{
              fontSize: '12px', color: subColor, marginTop: '4px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              transition: 'color 0.3s',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className="stat-icon" style={{
            padding: '10px', borderRadius: '12px',
            background: cfg.iconBg, flexShrink: 0, transition: 'background 0.3s',
          }}>
            <Icon size={22} style={{ color: cfg.iconColor }} />
          </div>
        )}
      </div>
    </div>
  )
}