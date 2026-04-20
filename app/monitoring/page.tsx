'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { ExternalLink, AlertCircle, RefreshCw, BarChart3, Activity, Cpu } from 'lucide-react'

const GRAFANA_URL = 'http://192.168.147.129:3000'

export default function MonitoringPage() {
  const [iframeError, setIframeError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setIframeError(true)
  }

  const openGrafana = () => {
    window.open(GRAFANA_URL, '_blank')
  }

  const retryLoad = () => {
    setIsLoading(true)
    setIframeError(false)
  }

  return (
    <DashboardLayout>
      <Topbar />
      
      <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Monitoring Grafana</h2>
            <p className="text-muted-foreground mt-1">
              Tableaux de bord Prometheus et métriques système en temps réel
            </p>
          </div>
          <button
            onClick={openGrafana}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvrir Grafana
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="glass-card gradient-border rounded-xl p-4 mb-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-semibold text-foreground">Prometheus</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/20">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Métriques</p>
                <p className="font-semibold text-foreground">Temps réel</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#a855f7]/20">
                <Cpu className="h-5 w-5 text-[#a855f7]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Endpoint</p>
                <code className="font-mono text-sm text-foreground">{GRAFANA_URL}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="flex-1 rounded-xl glass-card gradient-border overflow-hidden relative">
          {isLoading && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center glass-card z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground">Chargement de Grafana...</p>
              </div>
            </div>
          )}

          {iframeError ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <div className="p-4 rounded-full bg-[#ffb020]/20">
                  <AlertCircle className="h-8 w-8 text-[#ffb020]" />
                </div>
                <h3 className="text-xl font-heading font-bold text-foreground">Grafana non accessible</h3>
                <p className="text-muted-foreground">
                  Le serveur Grafana n&apos;est pas accessible à l&apos;adresse
                </p>
                <code className="px-4 py-2 rounded-xl glass-card border border-primary/30 text-primary font-mono text-sm">{GRAFANA_URL}</code>
                <p className="text-sm text-muted-foreground">
                  Vérifiez que Grafana est démarré et accessible sur le réseau local.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={retryLoad}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card border border-border/50 text-foreground font-medium hover:border-primary/50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Réessayer
                  </button>
                  <button
                    onClick={openGrafana}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              key={isLoading ? 'loading' : 'loaded'}
              src={GRAFANA_URL}
              className="w-full h-full border-0"
              title="Grafana Dashboard"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-4 p-5 rounded-xl glass-card border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-primary">Note:</strong> L&apos;intégration Grafana nécessite que le serveur soit accessible sur le même réseau. 
            Les métriques Prometheus sont collectées depuis les exporters configurés sur chaque noeud du système Ericsson.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
