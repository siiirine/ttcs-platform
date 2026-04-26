'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useThemeColors() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return {
    isDark,
    // Backgrounds cartes
    cardBg:        isDark ? 'rgba(15,25,45,0.92)'      : 'rgba(255,255,255,0.88)',
    cardBgSolid:   isDark ? 'rgba(10,18,35,0.95)'      : 'rgba(255,255,255,0.95)',
    panelBg:       isDark ? 'rgba(255,255,255,0.03)'   : 'rgba(0,130,240,0.04)',
    inputBg:       isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(255,255,255,0.9)',
    sidebarRightBg:isDark ? 'rgba(10,18,35,0.8)'       : 'rgba(255,255,255,0.7)',
    headerBg:      isDark ? 'rgba(10,18,35,0.9)'       : 'rgba(255,255,255,0.8)',
    toggleBg:      isDark ? 'rgba(255,255,255,0.06)'   : 'rgba(255,255,255,0.8)',
    // Borders
    border:        'rgba(0,130,240,0.15)',
    borderSubtle:  isDark ? 'rgba(255,255,255,0.06)'   : 'rgba(0,130,240,0.1)',
    borderInput:   isDark ? 'rgba(0,130,240,0.3)'      : 'rgba(0,130,240,0.2)',
    // Textes
    textPrimary:   isDark ? '#e2e8f0'  : '#0a1628',
    textSecondary: isDark ? '#94a3b8'  : '#4a6a8a',
    textMuted:     isDark ? '#64748b'  : '#7a9bc5',
    textBlue:      '#0082f0',
    // Shadows
    shadow:        isDark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,130,240,0.08)',
    shadowHover:   isDark ? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(0,130,240,0.15)',
  }
}