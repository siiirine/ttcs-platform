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

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', className }: StatCardProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  const cfg        = variantConfig[variant]
  const cardBg     = isDark ? 'rgba(15,25,45,0.9)'         : 'rgba(255,255,255,0.85)'
  const borderCol  = isDark ? 'rgba(0,130,240,0.15)'        : 'rgba(0,130,240,0.15)'
  const labelColor = isDark ? '#64748b'                      : '#4a6a8a'
  const subColor   = isDark ? '#475569'                      : '#7a9bc5'
  const shadow     = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,130,240,0.08)'
  const shadowHov  = isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,130,240,0.15)'

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
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: shadow,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-5px)'
        el.style.boxShadow = shadowHov
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = shadow
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '11px', color: labelColor,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontWeight: 600, marginBottom: '8px',
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '3rem', fontWeight: 800, lineHeight: 1,
            color: cfg.valueColor, marginBottom: '6px',
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{
              fontSize: '12px', color: subColor, marginTop: '4px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div style={{
            padding: '10px', borderRadius: '12px',
            background: cfg.iconBg, flexShrink: 0,
          }}>
            <Icon size={22} style={{ color: cfg.iconColor }} />
          </div>
        )}
      </div>
    </div>
  )
}