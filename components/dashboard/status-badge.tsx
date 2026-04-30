'use client'

import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL' | 'UNKNOWN'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  showGlow?: boolean
}

export function StatusBadge({ status, size = 'md', pulse = false, showGlow = true }: StatusBadgeProps) {
  const statusConfig = {
    CRITICAL: {
      bg: 'bg-[#ff3b5c]/20',
      text: 'text-[#ff3b5c]',
      border: 'border-[#ff3b5c]/50',
      glow: 'badge-glow-critical',
      dot: 'bg-[#ff3b5c]',
      label: 'CRITIQUE',
    },
    WARNING: {
      bg: 'bg-[#ffb020]/20',
      text: 'text-[#ffb020]',
      border: 'border-[#ffb020]/50',
      glow: 'badge-glow-warning',
      dot: 'bg-[#ffb020]',
      label: 'ATTENTION',
    },
    NORMAL: {
      bg: 'bg-[#00d4aa]/20',
      text: 'text-[#00d4aa]',
      border: 'border-[#00d4aa]/50',
      glow: 'badge-glow-normal',
      dot: 'bg-[#00d4aa]',
      label: 'NORMAL',
    },
    // ✅ Nouveau — noeud ajouté manuellement, pas encore surveillé
    UNKNOWN: {
      bg: 'bg-[#6b7280]/15',
      text: 'text-[#9ca3af]',
      border: 'border-[#6b7280]/40',
      glow: '',
      dot: 'bg-[#6b7280]',
      label: 'NON SURVEILLÉ',
    },
  }

  const sizeConfig = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const dotSizeConfig = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  }

  const config = statusConfig[status] ?? statusConfig.UNKNOWN

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold tracking-wide',
        config.bg,
        config.text,
        config.border,
        sizeConfig[size],
        showGlow && config.glow,
        pulse && status === 'CRITICAL' && 'animate-pulse'
      )}
    >
      <span className={cn(
        'rounded-full',
        config.dot,
        dotSizeConfig[size],
        status === 'CRITICAL' && 'animate-pulse'
      )} />
      {config.label}
    </span>
  )
}