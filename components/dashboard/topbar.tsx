'use client'

import { usePathname } from 'next/navigation'
import { Clock, RefreshCw, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/noeuds': 'Noeuds',
  '/inventaire': 'Inventaire',
  '/monitoring': 'Monitoring',
  '/prediction': 'Prédiction',
  '/assistant': 'Assistant',
}

interface TopbarProps {
  onRefresh?: () => void
  isRefreshing?: boolean
  lastUpdate?: string
}

export function Topbar({ onRefresh, isRefreshing, lastUpdate }: TopbarProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const getTitle = () => {
    if (pathname.startsWith('/noeuds/')) {
      return 'Détail du noeud'
    }
    return pageTitles[pathname] || 'TTCS Platform'
  }

  return (
    <header className="sticky top-0 z-30 h-16 glass-card border-b border-border/30">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="font-heading font-bold text-xl text-foreground">
            {getTitle()}
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
            <Wifi className="h-3 w-3" />
            <span>En ligne</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Last Update */}
          {lastUpdate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-border/30 text-sm">
              <span className="text-muted-foreground">Mise à jour:</span>
              <span className="font-semibold text-foreground">
                {new Date(lastUpdate).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          )}

          {/* Current Time */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-border/30 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono font-semibold text-foreground">{currentTime}</span>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
