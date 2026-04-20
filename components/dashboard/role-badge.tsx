'use client'

import { cn } from '@/lib/utils'

const ROLE_CONFIG: Record<string, { bg: string; glow: string }> = {
  CCN: { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]' },
  SDP: { bg: 'bg-gradient-to-r from-purple-500 to-purple-600', glow: 'shadow-[0_0_8px_rgba(168,85,247,0.5)]' },
  OCC: { bg: 'bg-gradient-to-r from-orange-500 to-orange-600', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]' },
  AIR: { bg: 'bg-gradient-to-r from-teal-500 to-teal-600', glow: 'shadow-[0_0_8px_rgba(20,184,166,0.5)]' },
  VS: { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', glow: 'shadow-[0_0_8px_rgba(107,114,128,0.4)]' },
  AF: { bg: 'bg-gradient-to-r from-pink-500 to-pink-600', glow: 'shadow-[0_0_8px_rgba(236,72,153,0.5)]' },
}

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
  showGlow?: boolean
}

export function RoleBadge({ role, size = 'md', showGlow = true }: RoleBadgeProps) {
  const sizeConfig = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  const config = ROLE_CONFIG[role] || { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', glow: '' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold text-white tracking-wide',
        config.bg,
        showGlow && config.glow,
        sizeConfig[size]
      )}
    >
      {role}
    </span>
  )
}
