'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PanelProps {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'warning' | 'gradient'
  action?: React.ReactNode
}

export function Panel({ title, icon: Icon, children, className, variant = 'default', action }: PanelProps) {
  const variantClasses = {
    default: 'gradient-border',
    warning: 'border-l-4 border-l-[#ffb020] border-t border-r border-b border-border/50',
    gradient: 'gradient-border gradient-border-active',
  }

  return (
    <div className={cn(
      'rounded-xl glass-card overflow-hidden hover-scale',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn(
              'p-2 rounded-lg',
              variant === 'warning' ? 'bg-[#ffb020]/20' : 'bg-primary/20'
            )}>
              <Icon className={cn(
                'h-4 w-4',
                variant === 'warning' ? 'text-[#ffb020]' : 'text-primary'
              )} />
            </div>
          )}
          <h3 className="section-title">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}