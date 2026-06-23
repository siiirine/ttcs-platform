'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { RoleBadge } from '@/components/dashboard/role-badge'
import { useThemeColors } from '@/lib/use-theme-colors'
import { useLang } from '@/lib/language-context'
import { Server, AlertCircle, Network, ExternalLink, Cpu, Database, Layers } from 'lucide-react'
import type { InventoryResponse } from '@/lib/api'
import { api, ROLE_DESCRIPTIONS } from '@/lib/api'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface NodeStatus {
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNKNOWN'
  display_name?: string
  role?: string
  [key: string]: unknown
}

// ─────────────────────────────────────────────────────────────
// Helpers couleurs statut
// ─────────────────────────────────────────────────────────────
function statusColor(s?: string) {
  if (s === 'CRITICAL') return '#ef4444'
  if (s === 'WARNING')  return '#f59e0b'
  if (s === 'NORMAL')   return '#22c55e'
  return '#6b7280'
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : ''
}

// ─────────────────────────────────────────────────────────────
// Charging Map SVG — section Architecture
// ─────────────────────────────────────────────────────────────
function ChargingMapSVG({ statuses, isDark }: { statuses: Record<string, NodeStatus>, isDark: boolean }) {

  const txt    = isDark ? '#cbd5e1' : '#1e293b'
  const txtSec = isDark ? '#64748b' : '#94a3b8'
  const bg     = isDark ? '#0f172a' : '#f8fafc'
  const card   = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? '#334155' : '#e2e8f0'
  const grid   = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)'
  const scopeBorder = isDark ? '#1d4ed8' : '#3b82f6'
  const futureAlpha = isDark ? 0.35 : 0.45

  // ── Nœuds SUPERVISÉS ──────────────────────────────────────
  // Positionnés au centre de la carte, layout inspiré de l'archi Ericsson
  const MONITORED: Array<{
    id: string; label: string; sub: string; proto: string
    x: number; y: number; w: number; h: number
    color: string; hdr: string; txtC: string; subC: string
  }> = [
    // CCN — colonne gauche-centre
    {
      id: 'jambala', label: 'CCN', sub: 'CCN-Node-01', proto: 'CAP · Diameter · SS7',
      x: 220, y: 170, w: 128, h: 72,
      color: '#185FA5', hdr: '#185FA5', txtC: '#bfdbfe', subC: '#93c5fd'
    },
    // SDP — centre
    {
      id: 'ttsdp17a', label: 'SDP', sub: 'SDP-Node-01', proto: 'TimesTen · INAP · CIP',
      x: 400, y: 220, w: 128, h: 72,
      color: '#854F0B', hdr: '#854F0B', txtC: '#fef3c7', subC: '#fcd34d'
    },
    // AIR — droite
    {
      id: 'ttair6', label: 'AIR', sub: 'AIR-Node-01', proto: 'UCIP · ACIP · RPC',
      x: 580, y: 130, w: 128, h: 72,
      color: '#0F6E56', hdr: '#0F6E56', txtC: '#d1fae5', subC: '#6ee7b7'
    },
    // OCC — bas gauche
    {
      id: 'ttocc1', label: 'OCC', sub: 'OCC-Node-01', proto: 'CDR · Health Monitor',
      x: 290, y: 360, w: 128, h: 72,
      color: '#A32D2D', hdr: '#A32D2D', txtC: '#fee2e2', subC: '#fca5a5'
    },
    // AF — bas droite
    {
      id: 'ttaf1', label: 'AF', sub: 'AF-Node-01', proto: 'DNS · HTTP · Export',
      x: 560, y: 330, w: 128, h: 72,
      color: '#993556', hdr: '#993556', txtC: '#fce7f3', subC: '#f9a8d4'
    },
    // VS — droite basse
    {
      id: 'ttvs3a', label: 'VS', sub: 'VS-Node-01', proto: 'FTP · Batch · VSIP',
      x: 700, y: 230, w: 112, h: 72,
      color: '#5F5E5A', hdr: '#5F5E5A', txtC: '#f3f4f6', subC: '#d1d5db'
    },
  ]

  // ── Nœuds NON SUPERVISÉS (Future Scope / Externes) ────────
  const UNMONITORED: Array<{
    label: string; sub: string; x: number; y: number; w: number; h: number; type: 'future' | 'external'
  }> = [
    // Externes réseau cœur (gauche)
    { label: 'IMS / EPC',      sub: 'VoLTE · Data · IMS',   x: 30,  y: 175, w: 110, h: 56, type: 'external' },
    { label: 'CS Voice / SMS', sub: 'MSC · SMSC · HLR',     x: 30,  y: 255, w: 110, h: 56, type: 'external' },
    // Haut (administration & gestion)
    { label: 'ADM',            sub: 'Administration',        x: 390, y: 48,  w: 100, h: 52, type: 'future'  },
    { label: 'VXML IVR',       sub: 'Self-Care IVR',         x: 210, y: 48,  w: 100, h: 52, type: 'future'  },
    { label: 'HP IVR',         sub: 'IVR Server',            x: 115, y: 48,  w: 88,  h: 52, type: 'future'  },
    // Droite (vouchers, CRM)
    { label: 'NGVS',           sub: 'NG Voucher Service',    x: 840, y: 100, w: 110, h: 52, type: 'future'  },
    { label: 'NG-CRS',         sub: 'Charging Data Ref.',    x: 840, y: 175, w: 110, h: 52, type: 'future'  },
    { label: 'O&M / EC-NMT',   sub: 'Install · Upgrade',    x: 840, y: 250, w: 110, h: 52, type: 'future'  },
    // Bas (médiation, facturation)
    { label: 'DWS',            sub: 'Data Warehouse',        x: 400, y: 468, w: 100, h: 52, type: 'future'  },
    { label: 'EMA',            sub: 'Event Management',      x: 515, y: 468, w: 100, h: 52, type: 'future'  },
    { label: 'FNR',            sub: 'FNR Number Query',      x: 285, y: 468, w: 100, h: 52, type: 'future'  },
    { label: 'Billing / Med.', sub: 'CDR Archive',           x: 680, y: 468, w: 110, h: 52, type: 'future'  },
  ]

  // ── Connexions ─────────────────────────────────────────────
  type Link = { x1:number; y1:number; x2:number; y2:number; color:string; dashes:string; label?:string }
  function cx(n: typeof MONITORED[0]) { return n.x + n.w / 2 }
  function cy(n: typeof MONITORED[0]) { return n.y + n.h / 2 }
  function nodeById(id: string) { return MONITORED.find(n => n.id === id)! }

  const ccn  = nodeById('jambala')
  const sdp  = nodeById('ttsdp17a')
  const air  = nodeById('ttair6')
  const occ  = nodeById('ttocc1')
  const af   = nodeById('ttaf1')
  const vs   = nodeById('ttvs3a')

  const LINKS: Link[] = [
    // CCN ↔ SDP (Diameter/CIP)
    { x1: cx(ccn)+ccn.w/2, y1: cy(ccn)+8,  x2: sdp.x, y2: cy(sdp)-8,  color: '#3b82f6', dashes: '6 3', label: 'CIP/IP' },
    { x1: sdp.x,           y1: cy(sdp)+8,  x2: cx(ccn)+ccn.w/2-10, y2: cy(ccn)+20, color: '#3b82f6', dashes: '4 4' },
    // CCN → AIR (CAP/SS7)
    { x1: cx(ccn)+30, y1: ccn.y, x2: air.x+20, y2: air.y+air.h, color: '#a855f7', dashes: '6 3', label: 'CAP/SS7' },
    // SDP ↔ AIR (DCIP)
    { x1: sdp.x+sdp.w, y1: cy(sdp)-10, x2: air.x+air.w/2, y2: air.y+air.h, color: '#3b82f6', dashes: '5 4', label: 'DCIP' },
    // SDP → OCC
    { x1: cx(sdp)-20, y1: sdp.y+sdp.h, x2: cx(occ)+20, y2: occ.y, color: '#10b981', dashes: '5 3', label: 'CDR' },
    // CCN → OCC
    { x1: cx(ccn)-10, y1: ccn.y+ccn.h, x2: cx(occ)-20, y2: occ.y, color: '#a855f7', dashes: '4 4' },
    // AF → SDP (DNS)
    { x1: af.x, y1: cy(af)-8, x2: sdp.x+sdp.w, y2: cy(sdp)+10, color: '#10b981', dashes: '5 4', label: 'DNS' },
    // AIR → AF
    { x1: cx(air)+10, y1: air.y+air.h, x2: cx(af)+20, y2: af.y, color: '#10b981', dashes: '4 4' },
    // VS → AIR
    { x1: vs.x, y1: cy(vs)-8, x2: cx(air)+30, y2: air.y+air.h-10, color: '#10b981', dashes: '5 4', label: 'VSIP' },
  ]

  // Connexions des externes
  const EXT_LINKS: Array<{ x1:number;y1:number;x2:number;y2:number;color:string }> = [
    // IMS → CCN
    { x1: 140, y1: 203, x2: ccn.x, y2: cy(ccn)-10, color: '#64748b' },
    // CS Voice → CCN
    { x1: 140, y1: 283, x2: ccn.x, y2: cy(ccn)+10, color: '#64748b' },
    // ADM → SDP
    { x1: 440, y1: 100, x2: cx(sdp), y2: sdp.y, color: '#64748b' },
    // ADM → VS
    { x1: 490, y1: 74,  x2: cx(vs), y2: vs.y, color: '#64748b' },
    // DWS ← SDP
    { x1: cx(sdp), y1: sdp.y+sdp.h, x2: 450, y2: 468, color: '#64748b' },
    // OCC → Billing
    { x1: cx(occ)+40, y1: occ.y+occ.h, x2: 735, y2: 468, color: '#64748b' },
    // FNR ← AF
    { x1: cx(af)-30, y1: af.y+af.h, x2: 335, y2: 468, color: '#64748b' },
    // NGVS ← VS
    { x1: vs.x+vs.w, y1: cy(vs)-10, x2: 840, y2: 126, color: '#64748b' },
    // O&M
    { x1: vs.x+vs.w, y1: cy(vs)+10, x2: 840, y2: 276, color: '#64748b' },
  ]

  const W = 970
  const H = 550

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id="cm-arr" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <marker id="cm-arr-g" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M1 1L9 5L1 9" fill="none" stroke="#64748b"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <style>{`
          @keyframes cm-flow { to { stroke-dashoffset: -24; } }
          @keyframes cm-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
          .cm-link { animation: cm-flow 2s linear infinite; }
          .cm-link-slow { animation: cm-flow 3.5s linear infinite; }
          .cm-dot { animation: cm-pulse 2s ease-in-out infinite; }
          .cm-dot-warn { animation: cm-pulse 1.1s ease-in-out infinite; }
          .cm-dot-crit { animation: cm-pulse 0.7s ease-in-out infinite; }
          .cm-node:hover .cm-card { filter: brightness(1.12); }
          .cm-node { cursor: pointer; }
        `}</style>
      </defs>

      {/* Fond */}
      <rect width={W} height={H} fill={bg} rx="0"/>

      {/* Grille */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`gv${i}`} x1={i*52} y1={0} x2={i*52} y2={H} stroke={grid} strokeWidth="1"/>
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`gh${i}`} x1={0} y1={i*50} x2={W} y2={i*50} stroke={grid} strokeWidth="1"/>
      ))}

      {/* Zone supervisée */}
      <rect x="190" y="108" width="670" height="310" rx="12"
        fill="none" stroke={scopeBorder} strokeWidth="1" strokeDasharray="8 4" opacity="0.5"/>
      <rect x="195" y="102" width="190" height="16" rx="4"
        fill={isDark ? '#1e3a5f' : '#dbeafe'}/>
      <text x="200" y="113" fill={isDark ? '#93c5fd' : '#1d4ed8'}
        style={{ fontFamily:'inherit', fontSize:'9px', fontWeight:700, letterSpacing:'0.09em' }}>
        PÉRIMÈTRE SUPERVISÉ — VM1 · 192.168.147.128
      </text>

      {/* ── Connexions externes (grises, derrière) ── */}
      {EXT_LINKS.map((lk, i) => (
        <line key={`el${i}`}
          x1={lk.x1} y1={lk.y1} x2={lk.x2} y2={lk.y2}
          stroke={lk.color} strokeWidth="0.8"
          strokeDasharray="4 4" opacity="0.4"
          markerEnd="url(#cm-arr-g)"
        />
      ))}

      {/* ── Connexions supervisées (animées) ── */}
      {LINKS.map((lk, i) => {
        const mx = (lk.x1 + lk.x2) / 2 + (i % 2 === 0 ? 0 : (i % 3 - 1) * 15)
        const my = (lk.y1 + lk.y2) / 2 - 10
        return (
          <g key={`ml${i}`}>
            <path
              d={`M ${lk.x1} ${lk.y1} Q ${mx} ${my} ${lk.x2} ${lk.y2}`}
              fill="none"
              stroke={lk.color}
              strokeWidth="1.3"
              strokeDasharray={lk.dashes}
              opacity="0.7"
              className="cm-link"
              markerEnd="url(#cm-arr)"
            />
            {lk.label && (
              <text
                x={mx} y={my - 4}
                textAnchor="middle"
                fill={lk.color}
                style={{ fontFamily:'inherit', fontSize:'8px', fontWeight:600 }}
                opacity="0.85"
              >
                {lk.label}
              </text>
            )}
          </g>
        )
      })}

      {/* ── Nœuds NON SUPERVISÉS ── */}
      {UNMONITORED.map((n, i) => {
        const isExt = n.type === 'external'
        const fillBg   = isExt
          ? (isDark ? '#1a2230' : '#f1f5f9')
          : (isDark ? '#161e2e' : '#f8fafc')
        const strokeC  = isDark ? '#374151' : '#d1d5db'
        const lblColor = isDark ? '#64748b' : '#9ca3af'
        const subColor = isDark ? '#475569' : '#cbd5e1'
        return (
          <g key={`un${i}`} opacity={futureAlpha}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8"
              fill={fillBg} stroke={strokeC} strokeWidth="0.8" strokeDasharray={isExt ? '0' : '4 3'}/>
            <text x={n.x + n.w/2} y={n.y + 20}
              textAnchor="middle" fill={lblColor}
              style={{ fontFamily:'inherit', fontSize:'11px', fontWeight:700 }}>
              {n.label}
            </text>
            <text x={n.x + n.w/2} y={n.y + 34}
              textAnchor="middle" fill={subColor}
              style={{ fontFamily:'inherit', fontSize:'9px' }}>
              {n.sub}
            </text>
            {!isExt && (
              <>
                <rect x={n.x + n.w - 46} y={n.y + n.h - 14} width={42} height={11} rx="3"
                  fill={isDark ? '#1e293b' : '#e5e7eb'}/>
                <text x={n.x + n.w - 25} y={n.y + n.h - 6}
                  textAnchor="middle" fill={isDark ? '#475569' : '#9ca3af'}
                  style={{ fontFamily:'inherit', fontSize:'7px', fontWeight:700, letterSpacing:'0.05em' }}>
                  FUTURE SCOPE
                </text>
              </>
            )}
            {isExt && (
              <>
                <rect x={n.x + n.w - 40} y={n.y + n.h - 14} width={36} height={11} rx="3"
                  fill={isDark ? '#1e293b' : '#e5e7eb'}/>
                <text x={n.x + n.w - 22} y={n.y + n.h - 6}
                  textAnchor="middle" fill={isDark ? '#475569' : '#9ca3af'}
                  style={{ fontFamily:'inherit', fontSize:'7px', fontWeight:700, letterSpacing:'0.05em' }}>
                  EXTERNAL
                </text>
              </>
            )}
          </g>
        )
      })}

      {/* ── Nœuds SUPERVISÉS ── */}
      {MONITORED.map((n) => {
        const status = statuses[n.id]
        const s   = status?.status ?? 'UNKNOWN'
        const sc  = statusColor(s)
        const dotCls =
          s === 'CRITICAL' ? 'cm-dot-crit' :
          s === 'WARNING'  ? 'cm-dot-warn' : 'cm-dot'
        const sbgAlpha =
          s === 'CRITICAL' ? 'rgba(239,68,68,0.15)' :
          s === 'WARNING'  ? 'rgba(245,158,11,0.15)' :
          s === 'NORMAL'   ? 'rgba(34,197,94,0.1)'  : 'rgba(107,114,128,0.1)'
        return (
          <g key={n.id} className="cm-node">
            {/* Glow autour si anomalie */}
            {(s === 'CRITICAL' || s === 'WARNING') && (
              <rect x={n.x-4} y={n.y-4} width={n.w+8} height={n.h+8} rx="14"
                fill={sbgAlpha} className={dotCls}/>
            )}
            {/* Card */}
            <rect className="cm-card" x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
              fill={card} stroke={n.color} strokeWidth="1.5"
              style={{ transition:'filter 0.2s' }}/>
            {/* Header */}
            <rect x={n.x} y={n.y} width={n.w} height={22} rx="10" fill={n.hdr}/>
            <rect x={n.x} y={n.y+12} width={n.w} height={10} fill={n.hdr}/>
            {/* Rôle */}
            <text x={n.x + n.w/2} y={n.y + 14} textAnchor="middle"
              fill={n.txtC} style={{ fontFamily:'inherit', fontSize:'12px', fontWeight:700 }}>
              {n.label}
            </text>
            {/* Display name */}
            <text x={n.x + n.w/2} y={n.y + 32} textAnchor="middle"
              fill={n.subC} style={{ fontFamily:'inherit', fontSize:'9.5px', fontWeight:600 }}>
              {n.sub}
            </text>
            {/* Protocole */}
            <text x={n.x + n.w/2} y={n.y + 47} textAnchor="middle"
              fill={txtSec} style={{ fontFamily:'inherit', fontSize:'8px' }}>
              {n.proto}
            </text>
            {/* Statut texte */}
            <text x={n.x + n.w/2} y={n.y + 62} textAnchor="middle"
              fill={sc} style={{ fontFamily:'inherit', fontSize:'8.5px', fontWeight:700 }}>
              {s}
            </text>
            {/* Dot statut */}
            <circle cx={n.x + n.w - 10} cy={n.y + 10} r={5} fill={sc} className={dotCls}/>
          </g>
        )
      })}

      {/* ── Légende ── */}
      <g transform="translate(20, 512)">
        {/* Supervisé */}
        <rect x="0" y="0" width="12" height="12" rx="2" fill="none" stroke="#3b82f6" strokeWidth="1.5"/>
        <text x="16" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Supervisé (live)</text>
        {/* Future scope */}
        <rect x="110" y="0" width="12" height="12" rx="2" fill="none" stroke={border} strokeWidth="0.8" strokeDasharray="3 2"/>
        <text x="126" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Future scope</text>
        {/* External */}
        <rect x="225" y="0" width="12" height="12" rx="2" fill="none" stroke={border} strokeWidth="0.8"/>
        <text x="241" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Externe</text>
        {/* Protocoles */}
        <line x1="310" y1="6" x2="330" y2="6" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5 2"/>
        <text x="334" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Diameter/CIP</text>
        <line x1="420" y1="6" x2="440" y2="6" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 2"/>
        <text x="444" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>CAP/SS7</text>
        <line x1="510" y1="6" x2="530" y2="6" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 2"/>
        <text x="534" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>DNS/HTTP</text>
        {/* Statuts */}
        <circle cx="612" cy="6" r="5" fill="#22c55e"/>
        <text x="622" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Normal</text>
        <circle cx="670" cy="6" r="5" fill="#f59e0b"/>
        <text x="680" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Warning</text>
        <circle cx="730" cy="6" r="5" fill="#ef4444"/>
        <text x="740" y="10" fill={txtSec} style={{ fontFamily:'inherit', fontSize:'10px' }}>Critical</text>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
// Page principale (identique à l'original sauf section arch.)
// ─────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryResponse | null>(null)
  const [statuses,  setStatuses]  = useState<Record<string, NodeStatus>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const c = useThemeColors()
  const { t } = useLang()

  // Détection dark mode via couleur texte
  const isDark = typeof c.textPrimary === 'string' &&
    (c.textPrimary.startsWith('#e') || c.textPrimary.startsWith('#f') || c.textPrimary === '#ffffff')

  const fetchData = useCallback(async () => {
    try {
      const [invData, statusData] = await Promise.all([
        api.getInventory(),
        fetch('http://192.168.147.129:8000/status', {
          headers: { Authorization: `Bearer ${getCookie('ttcs_token')}` }
        }).then(r => r.ok ? r.json() : {}).catch(() => ({})),
      ])
      setInventory(invData)
      setStatuses(statusData ?? {})
      setError(null)
    } catch (err) {
      setError(t('inventory', 'loadErrorMsg'))
      console.error('API Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [fetchData])

  if (isLoading) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p style={{ color: c.textSecondary }}>{t('inventory', 'loading')}</p>
        </div>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout><Topbar />
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="glass-card gradient-border rounded-2xl p-8 max-w-md text-center">
          <div className="p-4 rounded-full bg-[#ff3b5c]/20 w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-[#ff3b5c]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground mb-2">{t('inventory', 'loadError')}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-opacity">
            {t('inventory', 'retry')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )

  const nodes = inventory ? Object.entries(inventory.nodes) : []

  return (
    <DashboardLayout><Topbar />
      <div className="p-6 space-y-6">

        {/* ── En-tête ── IDENTIQUE À L'ORIGINAL */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: c.textPrimary }}>{t('inventory', 'title')}</h2>
          <p style={{ color: c.textSecondary, marginTop: '4px' }}>{t('inventory', 'subtitle')}</p>
        </div>

        {/* ── KPI bar ── IDENTIQUE À L'ORIGINAL */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px', boxShadow: c.shadow }}>
          <div className="flex items-center gap-8">
            {[
              { icon: Server, color: '#0082f0', bg: 'rgba(0,130,240,0.15)', label: t('inventory', 'totalServers'), value: nodes.length },
              { icon: Layers, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', label: t('inventory', 'uniqueRoles'), value: new Set(nodes.map(([, n]) => n.role)).size },
              { icon: Cpu,    color: '#00d4aa', bg: 'rgba(0,212,170,0.15)', label: t('inventory', 'system'),       value: 'Ericsson ECS' },
            ].map(({ icon: Icon, color, bg, label, value }, i) => (
              <div key={label} className="flex items-center gap-3" style={{ borderLeft: i > 0 ? `1px solid ${c.borderSubtle}` : 'none', paddingLeft: i > 0 ? '32px' : 0 }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: bg }}><Icon size={20} style={{ color }} /></div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: c.textPrimary, lineHeight: 1.2 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cards grille ── IDENTIQUE À L'ORIGINAL */}
        <div className="grid grid-cols-3 gap-4">
          {nodes.map(([name, node]) => {
            const displayName = (node as any).display_name || name
            return (
              <Link key={name} href={`/noeuds/${name}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '24px', boxShadow: c.shadow, transition: 'all 0.25s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadowHover }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = c.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,130,240,0.12)' }}><Server size={22} style={{ color: '#0082f0' }} /></div>
                    <RoleBadge role={node.role} size="md" />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: c.textPrimary, marginBottom: '2px' }}>{displayName}</h3>
                  <p style={{ fontSize: '13px', color: c.textSecondary, marginBottom: '16px', lineHeight: 1.5 }}>
                    {node.description || ROLE_DESCRIPTIONS[node.role] || t('inventory', 'billingComponent')}
                  </p>
                  <div style={{ paddingTop: '12px', borderTop: `1px solid ${c.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: c.textSecondary }}>
                      <Network size={14} style={{ color: '#0082f0' }} />
                      <span>{t('inventory', 'port')}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: c.textPrimary }}>{node.port}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#0082f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {t('inventory', 'details')} <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Section Architecture ── REMPLACÉE PAR CHARGING MAP */}
        <div style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: c.shadow }}>
          {/* Header section — identique au style original */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(168,85,247,0.15)' }}>
                <Database size={16} style={{ color: '#a855f7' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '11px', fontWeight: 700, color: c.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {t('inventory', 'architecture')}
                </h3>
                <p style={{ fontSize: '11px', color: c.textSecondary, marginTop: '1px' }}>
                  Charging System Ericsson — Vue complète du périmètre réseau
                </p>
              </div>
            </div>
            {/* Badge LIVE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#22c55e', display: 'inline-block',
                boxShadow: '0 0 6px rgba(34,197,94,0.6)'
              }}/>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e' }}>LIVE</span>
            </div>
          </div>

          {/* Charging Map SVG */}
          <div style={{ padding: '20px' }}>
            <ChargingMapSVG statuses={statuses} isDark={isDark} />
          </div>

          {/* Description — comme dans l'original */}
          <div style={{ padding: '0 24px 20px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: c.panelBg, border: `1px solid rgba(0,130,240,0.2)` }}>
              <p style={{ fontSize: '12px', color: c.textSecondary, lineHeight: 1.7 }}>
                {t('inventory', 'archDesc')}
                {' '}Les nœuds dans le <strong style={{ color: '#3b82f6' }}>périmètre supervisé</strong> (CCN, SDP, AIR, OCC, AF, VS) exposent leurs métriques en temps réel via Prometheus.
                Les nœuds en <em>Future Scope</em> (ADM, DWS, IVR, EMA, FNR, Billing) représentent l'architecture complète du Charging System Ericsson mais ne sont pas encore intégrés à la supervision.
              </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}