'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { RoleBadge } from '@/components/dashboard/role-badge'
import {
  Server,
  AlertCircle,
  Network,
  ExternalLink,
  Cpu,
  Database,
  Layers,
} from 'lucide-react'
import type { InventoryResponse } from '@/lib/api'
import { api, ROLE_DESCRIPTIONS } from '@/lib/api'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getInventory()
      setInventory(data)
      setError(null)
    } catch (err) {
      setError('Impossible de charger l\'inventaire')
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <DashboardLayout>
        <Topbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-muted-foreground">Chargement de l&apos;inventaire...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Topbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
            <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Réessayer
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const nodes = inventory ? Object.entries(inventory.nodes) : []

  return (
    <DashboardLayout>
      <Topbar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Inventaire des serveurs</h2>
          <p className="text-muted-foreground mt-1">
            Configuration et informations de l&apos;infrastructure Ericsson Charging System
          </p>
        </div>

        {/* Stats Bar */}
        <div className="glass-card gradient-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/20">
                  <Server className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="section-title">Total serveurs</p>
                  <p className="text-2xl font-heading font-bold text-foreground">{nodes.length}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#a855f7]/20">
                  <Layers className="h-5 w-5 text-[#a855f7]" />
                </div>
                <div>
                  <p className="section-title">Rôles uniques</p>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {new Set(nodes.map(([, n]) => n.role)).size}
                  </p>
                </div>
              </div>
              <div className="h-10 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-accent/20">
                  <Cpu className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="section-title">Système</p>
                  <p className="text-lg font-heading font-bold text-foreground">Ericsson ECS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-3 gap-4">
          {nodes.map(([name, node]) => (
            <Link
              key={name}
              href={`/noeuds/${name}`}
              className="group glass-card gradient-border rounded-xl p-6 hover-scale"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 group-hover:from-primary/30 group-hover:to-accent/20 transition-all">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <RoleBadge role={node.role} size="md" />
              </div>
              
              <h3 className="text-xl font-heading font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {name}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {node.description || ROLE_DESCRIPTIONS[node.role] || 'Composant du système de facturation'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Network className="h-4 w-4 text-primary" />
                  <span>Port: </span>
                  <span className="font-mono font-semibold text-foreground">{node.port}</span>
                </div>
                
                <span className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  Détails
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Architecture Overview */}
        <div className="glass-card gradient-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 bg-secondary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#a855f7]/20">
                <Database className="h-4 w-4 text-[#a855f7]" />
              </div>
              <h3 className="section-title">Architecture du système</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-6 gap-4 mb-6">
              {nodes.map(([name, node]) => (
                <div key={name} className="text-center glass-card rounded-lg p-4 hover-scale">
                  <div className="mb-3">
                    <RoleBadge role={node.role} size="sm" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Port {node.port}</p>
                </div>
              ))}
            </div>
            <div className="p-5 rounded-xl glass-card border border-primary/20">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-primary">CCN</strong> (Charging Control Node) orchestre les opérations de facturation. 
                <strong className="text-[#a855f7]"> SDP</strong> (Service Data Point) stocke les données en TimesTen. 
                <strong className="text-orange-500"> OCC</strong> (Online Charging Center) gère les sessions de facturation en ligne. 
                <strong className="text-teal-500"> AIR</strong> (Account Information & Reservation) gère les comptes et réservations. 
                <strong className="text-gray-400"> VS</strong> (Voucher Server) traite les recharges. 
                <strong className="text-pink-500"> AF</strong> (Account Filter) filtre et route les requêtes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
