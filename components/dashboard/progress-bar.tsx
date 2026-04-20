'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'gradient' | 'critical' | 'warning' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const variantConfig = {
    default: {
      bg: percentage >= 90 ? 'bg-[#ff3b5c]' : percentage >= 70 ? 'bg-[#ffb020]' : 'bg-[#00d4aa]',
      glow: percentage >= 90 ? 'shadow-[0_0_8px_rgba(255,59,92,0.5)]' : percentage >= 70 ? 'shadow-[0_0_8px_rgba(255,176,32,0.4)]' : 'shadow-[0_0_8px_rgba(0,212,170,0.3)]',
    },
    gradient: {
      bg: 'bg-gradient-to-r from-primary to-accent',
      glow: 'shadow-[0_0_8px_rgba(0,163,255,0.4)]',
    },
    critical: {
      bg: 'bg-gradient-to-r from-[#ff3b5c] to-[#ff6b7d]',
      glow: 'shadow-[0_0_8px_rgba(255,59,92,0.5)]',
    },
    warning: {
      bg: 'bg-gradient-to-r from-[#ffb020] to-[#ffc94d]',
      glow: 'shadow-[0_0_8px_rgba(255,176,32,0.4)]',
    },
    success: {
      bg: 'bg-gradient-to-r from-[#00d4aa] to-[#00f5c8]',
      glow: 'shadow-[0_0_8px_rgba(0,212,170,0.3)]',
    },
  }

  const sizeConfig = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const config = variantConfig[variant]

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs font-semibold text-foreground">
              {value.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-secondary/50 overflow-hidden', sizeConfig[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            config.bg,
            config.glow
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
