'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { adminApi, User, NodeAdmin } from '@/lib/api'
import {
  Users, Server, Plus, Trash2, KeyRound, RefreshCw,
  ShieldCheck, Eye, EyeOff, Pencil, Clock, X, Lock,
  AlertCircle, Crown, User as UserIcon, Info,
} from 'lucide-react'

const BASE_URL = 'http://192.168.147.129:8000'
const ROLES    = ['CCN', 'AIR', 'SDP', 'VS', 'OCC', 'AF']

const ROLE_COLOR: Record<string, string> = {
  CCN: '#185FA5', AIR: '#0F6E56', SDP: '#534AB7',
  VS:  '#5F5E5A', OCC: '#854F0B', AF:  '#993556',
}

const ROLE_DESC: Record<string, string> = {
  CCN: 'Charging Control',
  AIR: 'Account Info & Res.',
  SDP: 'Service Data Point',
  VS:  'Voucher Server',
  OCC: 'Online Charging',
  AF:  'Account Filter',
}

type AdminView = 'users' | 'nodes'

function useIsDark() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === 'dark'
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[1]) : ''
}

function getExpiryStatus(expires_at: string | null, tr: (s: string, k: string) => string) {
  if (!expires_at) return { label: tr('admin', 'unlimited'), color: '#3B6D11', bg: 'rgba(59,109,17,0.12)' }
  const diff = new Date(expires_at).getTime() - Date.now()
  if (diff <= 0) return { label: tr('admin', 'expired'), color: '#A32D2D', bg: 'rgba(163,45,45,0.12)' }
  const days = Math.ceil(diff / 86400000)
  if (days <= 7) return { label: `${days}j restant${days > 1 ? 's' : ''}`, color: '#854F0B', bg: 'rgba(133,79,11,0.12)' }
  return { label: new Date(expires_at).toLocaleDateString('fr-FR'), color: '#185FA5', bg: 'rgba(24,95,165,0.1)' }
}

/* ── KPI Utilisateurs ── */
function UserKpiCard({ label, value, sub, Icon, accent, isDark }: {
  label: string; value: number; sub: string
  Icon: React.ElementType; accent: string; isDark: boolean
}) {
  return (
    <div style={{
      background: isDark ? `${accent}14` : `${accent}09`,
      border: `0.5px solid ${accent}35`,
      borderRadius: 12, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -12, top: -12,
        width: 72, height: 72, borderRadius: '50%',
        background: `${accent}10`, pointerEvents: 'none',
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${accent}20`, border: `0.5px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color: accent }} aria-hidden />
      </div>
      <div>
        <div style={{ fontSize: 11, color: isDark ? `${accent}bb` : `${accent}99`, fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: isDark ? '#e8f4ff' : '#0a1628', lineHeight: 1, letterSpacing: '-.5px' }}>
          {value}
        </div>
        <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', marginTop: 3 }}>
          {sub}
        </div>
      </div>
    </div>
  )
}

/* ── KPI Nœuds par type ── */
function NodeKpiCard({ role, count, isDark }: { role: string; count: number; isDark: boolean }) {
  const c = ROLE_COLOR[role] || '#5F5E5A'
  return (
    <div style={{
      background: isDark ? `${c}14` : `${c}09`,
      border: `0.5px solid ${c}35`,
      borderRadius: 12, padding: '14px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -8, bottom: -8,
        width: 52, height: 52, borderRadius: '50%',
        background: `${c}12`, pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          background: `${c}22`, color: c, border: `0.5px solid ${c}55`, letterSpacing: '.04em',
        }}>{role}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: `${c}18`, border: `0.5px solid ${c}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Server size={13} style={{ color: c }} aria-hidden />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: isDark ? '#e8f4ff' : '#0a1628', lineHeight: 1, letterSpacing: '-.5px' }}>
        {count}
      </div>
      <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)', marginTop: 5 }}>
        {ROLE_DESC[role] || role}
      </div>
    </div>
  )
}

function RoleBadge({ role, tr }: { role: string; tr: (s: string, k: string) => string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: isAdmin ? 'rgba(163,45,45,0.12)' : 'rgba(24,95,165,0.12)',
      color:      isAdmin ? '#A32D2D' : '#185FA5',
      border:    `0.5px solid ${isAdmin ? 'rgba(163,45,45,0.4)' : 'rgba(24,95,165,0.4)'}`,
      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
    }}>
      {isAdmin ? <Crown size={10} aria-hidden /> : <UserIcon size={10} aria-hidden />}
      {isAdmin ? tr('admin', 'admin') : tr('admin', 'operator')}
    </span>
  )
}

function TypeBadge({ role }: { role: string }) {
  const c = ROLE_COLOR[role] || '#5F5E5A'
  return (
    <span style={{
      background: `${c}18`, color: c, border: `0.5px solid ${c}55`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>{role}</span>
  )
}

function ActionBtn({ onClick, color, title, children }: {
  onClick: () => void; color: string; title: string; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} title={title} style={{
      background: `${color}18`, border: `0.5px solid ${color}55`,
      borderRadius: 6, padding: '5px 8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', color,
    }}>{children}</button>
  )
}

function Modal({ title, children, onClose, isDark }: {
  title: string; children: React.ReactNode; onClose: () => void; isDark: boolean
}) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: isDark ? '#1a1d2e' : 'white', borderRadius: 14, padding: 24,
        width: '100%', maxWidth: 460,
        border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, paddingBottom: 14,
          borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#e8f4ff' : '#0a1628', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, hint, error }: {
  label: string; children: React.ReactNode; hint?: string; error?: string
}) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 500, marginBottom: 6,
        color: error ? '#A32D2D' : '#7a9bc5',
        textTransform: 'uppercase', letterSpacing: '.07em',
      }}>{label}</label>
      {children}
      {hint  && !error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#7a9bc5' }}>{hint}</p>}
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#A32D2D' }}>⚠ {error}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════ PAGE ══ */

export default function AdminPage() {
  const isDark = useIsDark()
  const { t }  = useLang()
  const searchParams = useSearchParams()

  const textPri   = isDark ? '#e8f4ff'                : '#0a1628'
  const textSec   = isDark ? '#7a9bc5'                : '#5F5E5A'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const cardBg    = isDark ? 'rgba(26,29,46,0.97)'    : 'white'
  const rowHover  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const inputBg   = isDark ? '#2a2d42'                : 'white'
  const inputCol  = isDark ? '#e8f4ff'                : '#0a1628'
  const inputBdr  = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
  const thBg      = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'

  const card: React.CSSProperties = {
    background: cardBg, border: `0.5px solid ${borderCol}`,
    borderRadius: 12, padding: 20,
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
  }
  const inputS: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    outline: 'none', background: inputBg, color: inputCol,
    boxSizing: 'border-box', border: `0.5px solid ${inputBdr}`,
  }
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' }
  const btnPrimary = (c = '#185FA5'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 7, background: c,
    color: 'white', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  })
  const btnOutline = (c = '#185FA5'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 7, background: 'transparent',
    color: c, border: `0.5px solid ${c}`, fontSize: 12, fontWeight: 500, cursor: 'pointer',
  })

  const [view, setView] = useState<AdminView>('users')
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab === 'nodes') setView('nodes')
    else setView('users')
  }, [searchParams])

  const [users,    setUsers]    = useState<User[]>([])
  const [nodes,    setNodes]    = useState<NodeAdmin[]>([])
  const [loadingU, setLoadingU] = useState(true)
  const [loadingN, setLoadingN] = useState(true)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
  }

  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'operator' | 'inactive'>('all')

  const [showCreate,    setShowCreate]    = useState(false)
  const [newUser,       setNewUser]       = useState({ full_name: '', email: '', role: 'operator' })
  const [savingCreate,  setSavingCreate]  = useState(false)
  const [createErr,     setCreateErr]     = useState('')
  const [editUser,      setEditUser]      = useState<User | null>(null)
  const [editUserForm,  setEditUserForm]  = useState({ full_name: '', email: '', role: '' })
  const [savingEditU,   setSavingEditU]   = useState(false)
  const [editUserErr,   setEditUserErr]   = useState('')
  const [resetTarget,   setResetTarget]   = useState<User | null>(null)
  const [newPwd,        setNewPwd]        = useState('')
  const [showNewPwd,    setShowNewPwd]    = useState(false)
  const [savingPwd,     setSavingPwd]     = useState(false)
  const [expiryTarget,  setExpiryTarget]  = useState<User | null>(null)
  const [expiryDate,    setExpiryDate]    = useState('')
  const [savingExpiry,  setSavingExpiry]  = useState(false)
  const [expiryErr,     setExpiryErr]     = useState('')
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [changePwdForm, setChangePwdForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [showOldPwd,    setShowOldPwd]    = useState(false)
  const [showNewP,      setShowNewP]      = useState(false)
  const [showConfP,     setShowConfP]     = useState(false)
  const [savingChgPwd,  setSavingChgPwd]  = useState(false)
  const [changePwdErr,  setChangePwdErr]  = useState('')
  const [showCreateNode, setShowCreateNode] = useState(false)
  const [newNode,        setNewNode]        = useState({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
  const [savingNode,     setSavingNode]     = useState(false)
  const [nodeErr,        setNodeErr]        = useState('')
  const [editNode,       setEditNode]       = useState<NodeAdmin | null>(null)
  const [editNodeForm,   setEditNodeForm]   = useState({ role: '', description: '', ip_address: '', server_type: '', port: '' })
  const [savingEditNode, setSavingEditNode] = useState(false)
  const [editNodeErr,    setEditNodeErr]    = useState('')

  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  const fetchUsers = async () => {
    setLoadingU(true)
    try { const r = await adminApi.getUsers(); setUsers(r.users) }
    catch { showToast('Erreur chargement utilisateurs', false) }
    finally { setLoadingU(false) }
  }
  const fetchNodes = async () => {
    setLoadingN(true)
    try { const r = await adminApi.getNodes(); setNodes(r.nodes) }
    catch { showToast('Erreur chargement nœuds', false) }
    finally { setLoadingN(false) }
  }
  useEffect(() => { fetchUsers(); fetchNodes() }, [])

  const filteredUsers = users.filter(u => {
    if (userFilter === 'admin')    return u.role === 'admin'
    if (userFilter === 'operator') return u.role === 'operator'
    if (userFilter === 'inactive') return !u.last_login
    return true
  })

  const adminCount = users.filter(u => u.role === 'admin').length
  const opCount    = users.filter(u => u.role === 'operator').length
  const neverCount = users.filter(u => !u.last_login).length

  const handleCreate = async () => {
    setCreateErr('')
    if (!newUser.full_name.trim()) { setCreateErr(t('admin', 'fullNameRequired')); return }
    if (!newUser.email.trim())     { setCreateErr(t('admin', 'emailRequired'));     return }
    if (!newUser.email.includes('@') || newUser.email.indexOf('@') === 0) { setCreateErr(t('admin', 'emailInvalid')); return }
    setSavingCreate(true)
    try {
      const res  = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getCookie('ttcs_token')}` },
        body: JSON.stringify({ full_name: newUser.full_name.trim(), email: newUser.email.trim().toLowerCase(), role: newUser.role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      showToast(`"${data.user.username}" créé${data.email_sent ? ' — Email envoyé ✉️' : ''}`)
      setShowCreate(false); setNewUser({ full_name: '', email: '', role: 'operator' }); fetchUsers()
    } catch (e) { setCreateErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingCreate(false) }
  }

  const openEditUser = (u: User) => {
    setEditUser(u); setEditUserErr('')
    setEditUserForm({ full_name: u.full_name || '', email: u.email || '', role: u.role })
  }
  const handleEditUser = async () => {
    if (!editUser) return; setEditUserErr('')
    if (editUserForm.email && !editUserForm.email.includes('@')) { setEditUserErr(t('admin', 'emailInvalid')); return }
    setSavingEditU(true)
    try {
      await adminApi.updateUser(editUser.id, {
        full_name: editUserForm.full_name || undefined,
        email:     editUserForm.email?.trim().toLowerCase(),
        role:      editUserForm.role,
      })
      showToast(`"${editUser.username}" modifié`); setEditUser(null); fetchUsers()
    } catch (e) { setEditUserErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingEditU(false) }
  }

  const handleDelete = async (u: User) => {
    if (!confirm(`Supprimer "${u.username}" ?`)) return
    try { await adminApi.deleteUser(u.id); showToast(`"${u.username}" supprimé`); fetchUsers() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  const handleResetPwd = async () => {
    if (!resetTarget || !newPwd) return; setSavingPwd(true)
    try {
      await adminApi.resetPassword(resetTarget.id, newPwd)
      showToast(`Mot de passe de "${resetTarget.username}" réinitialisé`)
      setResetTarget(null); setNewPwd('')
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setSavingPwd(false) }
  }

  const openExpiry = (u: User) => {
    setExpiryTarget(u); setExpiryErr('')
    if (u.expires_at) {
      const d = new Date(u.expires_at), pad = (n: number) => String(n).padStart(2, '0')
      setExpiryDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    } else setExpiryDate('')
  }
  const handleSetExpiry = async () => {
    if (!expiryTarget) return; setSavingExpiry(true); setExpiryErr('')
    try {
      await adminApi.setExpiry(expiryTarget.id, expiryDate ? new Date(expiryDate).toISOString() : null)
      showToast(expiryDate ? 'Expiration définie' : 'Expiration supprimée')
      setExpiryTarget(null); fetchUsers()
    } catch (e) { setExpiryErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingExpiry(false) }
  }

  const handleChangePwd = async () => {
    setChangePwdErr('')
    if (!changePwdForm.old_password)           { setChangePwdErr(t('admin', 'oldPwdRequired')); return }
    if (changePwdForm.new_password.length < 6) { setChangePwdErr(t('admin', 'min6'));           return }
    if (changePwdForm.new_password !== changePwdForm.confirm) { setChangePwdErr(t('admin', 'passwordsNoMatch')); return }
    setSavingChgPwd(true)
    try {
      const res  = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getCookie('ttcs_token')}` },
        body: JSON.stringify({ old_password: changePwdForm.old_password, new_password: changePwdForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      showToast('Mot de passe modifié'); setShowChangePwd(false)
      setChangePwdForm({ old_password: '', new_password: '', confirm: '' })
    } catch (e) { setChangePwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingChgPwd(false) }
  }

  const handleCreateNode = async () => {
    setNodeErr('')
    if (!newNode.name || !newNode.description || !newNode.port || !newNode.ip_address.trim() || !newNode.server_type.trim()) {
      setNodeErr(t('admin', 'nodeFieldsRequired')); return
    }
    setSavingNode(true)
    try {
      await adminApi.createNode({ ...newNode, port: parseInt(newNode.port) })
      showToast(`Nœud "${newNode.name}" ajouté`)
      setShowCreateNode(false)
      setNewNode({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
      fetchNodes()
    } catch (e) { setNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingNode(false) }
  }

  const openEditNode = (n: NodeAdmin) => {
    setEditNode(n); setEditNodeErr('')
    setEditNodeForm({ role: n.role, description: n.description, ip_address: n.ip_address || '', server_type: n.server_type || '', port: String(n.port) })
  }
  const handleEditNode = async () => {
    if (!editNode) return; setEditNodeErr('')
    if (!editNodeForm.ip_address.trim() || !editNodeForm.server_type.trim() || !editNodeForm.port) { setEditNodeErr(t('admin', 'nodeFieldsRequired')); return }
    setSavingEditNode(true)
    try {
      await adminApi.updateNode(editNode.name, {
        role: editNodeForm.role, description: editNodeForm.description,
        ip_address: editNodeForm.ip_address.trim(), server_type: editNodeForm.server_type.trim(),
        port: parseInt(editNodeForm.port),
      })
      showToast(`Nœud "${editNode.name}" modifié`); setEditNode(null); fetchNodes()
    } catch (e) { setEditNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingEditNode(false) }
  }
  const handleDeleteNode = async (name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try { await adminApi.deleteNode(name); showToast(`Nœud "${name}" supprimé`); fetchNodes() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  return (
    <DashboardLayout>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 76, right: 24, zIndex: 9999,
          padding: '10px 18px', borderRadius: 8,
          background: toast.ok ? '#3B6D11' : '#A32D2D', color: 'white',
          fontSize: 12, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideIn .25s ease',
        }}>{toast.msg}</div>
      )}

      {/* ── En-tête Option B ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `0.5px solid ${borderCol}`, paddingBottom: 16, marginBottom: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: textSec }}>Administration</span>
            <span style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>/</span>
            <span style={{ fontSize: 12, color: '#185FA5', fontWeight: 500 }}>
              {view === 'users' ? 'Utilisateurs' : 'Nœuds réseau'}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: textPri, margin: 0, lineHeight: 1 }}>
            {view === 'users' ? 'Gestion des utilisateurs' : 'Gestion des nœuds réseau'}
          </h1>
          <p style={{ fontSize: 13, color: textSec, margin: '5px 0 0' }}>
            {view === 'users'
              ? 'Comptes, rôles et accès à la plateforme TTCS'
              : 'Infrastructure Ericsson Charging System'}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: '5px 13px', borderRadius: 20,
          background: isDark ? 'rgba(24,95,165,0.2)' : '#E6F1FB',
          color: isDark ? '#85B7EB' : '#0C447C',
          border: `0.5px solid ${isDark ? 'rgba(133,183,235,0.4)' : '#85B7EB'}`,
          display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' as const,
        }}>
          <ShieldCheck size={13} aria-hidden />
          Espace admin
        </span>
      </div>

      {/* ══════════ VUE UTILISATEURS ══════════ */}
      {view === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
            <UserKpiCard label="Total comptes"   value={users.length} sub={`${users.length} compte${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`} Icon={Users}       accent="#185FA5" isDark={isDark} />
            <UserKpiCard label="Administrateurs" value={adminCount}   sub="Accès complet à la plateforme"                                                                    Icon={Crown}       accent="#A32D2D" isDark={isDark} />
            <UserKpiCard label="Opérateurs"      value={opCount}      sub="Accès supervision uniquement"                                                                     Icon={UserIcon}    accent="#3B6D11" isDark={isDark} />
            <UserKpiCard label="Jamais connecté" value={neverCount}   sub={neverCount > 0 ? 'Comptes à vérifier' : 'Tous les comptes sont actifs'}                          Icon={AlertCircle} accent={neverCount > 0 ? '#A32D2D' : '#3B6D11'} isDark={isDark} />
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: textPri }}>
                {filteredUsers.length} compte{filteredUsers.length > 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                {([
                  { key: 'all',      label: 'Tous'            },
                  { key: 'admin',    label: 'Admin'           },
                  { key: 'operator', label: 'Opérateur'       },
                  { key: 'inactive', label: 'Jamais connecté' },
                ] as const).map(f => (
                  <button key={f.key} onClick={() => setUserFilter(f.key)} style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: 11, cursor: 'pointer',
                    background: userFilter === f.key ? '#185FA5' : 'transparent',
                    color:      userFilter === f.key ? 'white'   : textSec,
                    border:    `0.5px solid ${userFilter === f.key ? '#185FA5' : borderCol}`,
                    fontWeight: userFilter === f.key ? 500 : 400, transition: 'all .15s',
                  }}>{f.label}</button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={fetchUsers} style={btnOutline('#185FA5')}>
                  <RefreshCw size={12} aria-hidden />{t('admin', 'refresh')}
                </button>
                <button onClick={() => { setShowCreate(true); setCreateErr('') }} style={btnPrimary()}>
                  <Plus size={13} aria-hidden />{t('admin', 'newUser')}
                </button>
              </div>
            </div>

            {loadingU
              ? <div style={{ textAlign: 'center', padding: 40, color: textSec, fontSize: 12 }}>{t('admin', 'loading')}</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `0.5px solid ${borderCol}` }}>
                        {[t('admin','username'), t('admin','fullName'), t('admin','email'), t('admin','role'), t('admin','expiration'), t('admin','lastLogin'), t('admin','actions')].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.6px', background: thBg }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const expiry = getExpiryStatus(u.expires_at || null, t)
                        return (
                          <tr key={u.id}
                            style={{ borderBottom: `0.5px solid ${borderCol}`, transition: 'background .1s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                  background: u.role === 'admin' ? 'rgba(163,45,45,0.12)' : 'rgba(24,95,165,0.12)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 500,
                                  color: u.role === 'admin' ? '#A32D2D' : '#185FA5',
                                }}>
                                  {u.username[0].toUpperCase()}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 500, color: textPri }}>{u.username}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: textSec }}>{u.full_name || '—'}</td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: textSec, fontFamily: 'monospace' }}>{u.email || '—'}</td>
                            <td style={{ padding: '10px 12px' }}><RoleBadge role={u.role} tr={t} /></td>
                            <td style={{ padding: '10px 12px' }}>
                              {u.role === 'admin'
                                ? <span style={{ fontSize: 11, color: textSec }}>—</span>
                                : <span style={{ fontSize: 11, fontWeight: 500, color: expiry.color, background: expiry.bg, padding: '2px 8px', borderRadius: 10 }}>{expiry.label}</span>
                              }
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: 11, color: textSec }}>
                              {u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : t('admin', 'never')}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <ActionBtn onClick={() => openEditUser(u)} color="#185FA5" title="Modifier"><Pencil size={12} /></ActionBtn>
                                {u.role === 'operator' && (
                                  <ActionBtn onClick={() => openExpiry(u)} color="#534AB7" title="Expiration"><Clock size={12} /></ActionBtn>
                                )}
                                <ActionBtn onClick={() => { setResetTarget(u); setNewPwd('') }} color="#854F0B" title="Réinitialiser MDP"><KeyRound size={12} /></ActionBtn>
                                {u.username !== 'admin' && (
                                  <ActionBtn onClick={() => handleDelete(u)} color="#A32D2D" title="Supprimer"><Trash2 size={12} /></ActionBtn>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: textSec, fontSize: 12 }}>
                      <Info size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: .4 }} aria-hidden />
                      Aucun utilisateur dans ce filtre
                    </div>
                  )}
                </div>
              )
            }
          </div>
        </div>
      )}

      {/* ══════════ VUE NŒUDS ══════════ */}
      {view === 'nodes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
            {ROLES.map(r => (
              <NodeKpiCard key={r} role={r} count={nodes.filter(n => n.role === r).length} isDark={isDark} />
            ))}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: textPri }}>
                {nodes.length} nœud{nodes.length > 1 ? 's' : ''} déployé{nodes.length > 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchNodes} style={btnOutline('#185FA5')}>
                  <RefreshCw size={12} aria-hidden />{t('admin', 'refresh')}
                </button>
                <button onClick={() => setShowCreateNode(true)} style={btnPrimary()}>
                  <Plus size={13} aria-hidden />{t('admin', 'newNode')}
                </button>
              </div>
            </div>

            {loadingN
              ? <div style={{ color: textSec, fontSize: 12, padding: 20 }}>Chargement…</div>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `0.5px solid ${borderCol}` }}>
                      {['Nœud', 'Type', 'Description', 'Adresse IP', 'Port', 'Serveur', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.6px', background: thBg }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map(n => (
                      <tr key={n.id}
                        style={{ borderBottom: `0.5px solid ${borderCol}`, transition: 'background .1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                              background: `${ROLE_COLOR[n.role] || '#5F5E5A'}18`,
                              borderLeft: `2px solid ${ROLE_COLOR[n.role] || '#5F5E5A'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Server size={13} style={{ color: ROLE_COLOR[n.role] || '#5F5E5A' }} aria-hidden />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: textPri }}>{n.display_name || n.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}><TypeBadge role={n.role} /></td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: textSec, fontFamily: 'monospace' }}>{n.ip_address || '—'}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: textSec, fontFamily: 'monospace' }}>{n.port}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, color: textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.server_type || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <ActionBtn onClick={() => openEditNode(n)} color="#185FA5" title="Modifier"><Pencil size={12} /></ActionBtn>
                            <ActionBtn onClick={() => handleDeleteNode(n.name)} color="#A32D2D" title="Supprimer"><Trash2 size={12} /></ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      )}

      {/* ══════════════════ MODALS ══════════════════ */}

      {showCreate && (
        <Modal title={t('admin', 'createUser')} onClose={() => { setShowCreate(false); setCreateErr('') }} isDark={isDark}>
          <div style={{ background: isDark ? 'rgba(24,95,165,0.1)' : '#f0f7ff', border: '0.5px solid rgba(24,95,165,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: textSec, lineHeight: 1.6 }}>
            Le login et le mot de passe sont générés automatiquement et envoyés par email.
          </div>
          <Field label={t('admin', 'fullNameLabel')}><input style={inputS} placeholder="Ex : Ghassen Chelly" value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} /></Field>
          <Field label={t('admin', 'emailLabel')}><input style={inputS} type="email" placeholder="Ex : ghassen@tunisietelecom.tn" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label={t('admin', 'roleLabel')}>
            <select style={selectS} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
              <option value="operator">{t('admin', 'operator')}</option>
              <option value="admin">{t('admin', 'admin')}</option>
            </select>
          </Field>
          {createErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{createErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowCreate(false); setCreateErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleCreate} disabled={savingCreate} style={btnPrimary()}>{savingCreate ? t('admin', 'creating') : t('admin', 'createAndSend')}</button>
          </div>
        </Modal>
      )}

      {editUser && (
        <Modal title={`Modifier — ${editUser.username}`} onClose={() => { setEditUser(null); setEditUserErr('') }} isDark={isDark}>
          <Field label={t('admin', 'fullName')}><input style={inputS} value={editUserForm.full_name} onChange={e => setEditUserForm(p => ({ ...p, full_name: e.target.value }))} /></Field>
          <Field label={t('admin', 'email')}><input style={inputS} type="email" value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label={t('admin', 'roleLabel')}>
            <select style={selectS} value={editUserForm.role} onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}>
              <option value="operator">{t('admin', 'operator')}</option>
              <option value="admin">{t('admin', 'admin')}</option>
            </select>
          </Field>
          {editUserErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{editUserErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditUser(null); setEditUserErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleEditUser} disabled={savingEditU} style={btnPrimary()}>{savingEditU ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      {expiryTarget && (
        <Modal title={`Expiration — ${expiryTarget.username}`} onClose={() => { setExpiryTarget(null); setExpiryErr('') }} isDark={isDark}>
          <Field label={t('admin', 'newExpiry')} hint={t('admin', 'expiryHint')}>
            <input style={inputS} type="datetime-local" min={minDate} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </Field>
          {expiryErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{expiryErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setExpiryTarget(null); setExpiryErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            {expiryDate && <button onClick={() => setExpiryDate('')} style={btnOutline('#5F5E5A')}><X size={12} aria-hidden /> {t('admin', 'removeLimit')}</button>}
            <button onClick={handleSetExpiry} disabled={savingExpiry} style={btnPrimary('#534AB7')}>
              <Clock size={13} aria-hidden />{savingExpiry ? t('admin', 'saving') : t('admin', 'save')}
            </button>
          </div>
        </Modal>
      )}

      {resetTarget && (
        <Modal title={t('admin', 'resetPassword')} onClose={() => { setResetTarget(null); setNewPwd('') }} isDark={isDark}>
          <p style={{ color: textSec, fontSize: 12, margin: 0 }}>Utilisateur : <strong style={{ color: textPri }}>{resetTarget.username}</strong></p>
          <Field label={t('admin', 'newPassword')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: 40 }} type={showNewPwd ? 'text' : 'password'} placeholder="••••••••" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button onClick={() => setShowNewPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex' }}>
                {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setResetTarget(null); setNewPwd('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleResetPwd} disabled={savingPwd || !newPwd} style={btnPrimary('#854F0B')}>{savingPwd ? t('admin', 'saving') : t('admin', 'reset')}</button>
          </div>
        </Modal>
      )}

      {showChangePwd && (
        <Modal title={t('admin', 'changePassword')} onClose={() => { setShowChangePwd(false); setChangePwdErr('') }} isDark={isDark}>
          {([
            { label: t('admin', 'oldPassword'),     key: 'old_password' as const, val: changePwdForm.old_password, show: showOldPwd, toggle: () => setShowOldPwd(p => !p) },
            { label: t('admin', 'newPassword'),     key: 'new_password' as const, val: changePwdForm.new_password, show: showNewP,   toggle: () => setShowNewP(p => !p)   },
            { label: t('admin', 'confirmPassword'), key: 'confirm'      as const, val: changePwdForm.confirm,      show: showConfP,  toggle: () => setShowConfP(p => !p)  },
          ]).map(f => (
            <Field key={f.key} label={f.label}>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputS, paddingRight: 40 }} type={f.show ? 'text' : 'password'} placeholder="••••••••" value={f.val} onChange={e => setChangePwdForm(p => ({ ...p, [f.key]: e.target.value }))} />
                <button onClick={f.toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex' }}>
                  {f.show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
          ))}
          {changePwdErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{changePwdErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowChangePwd(false); setChangePwdErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleChangePwd} disabled={savingChgPwd} style={btnPrimary('#534AB7')}>
              <Lock size={13} aria-hidden />{savingChgPwd ? t('admin', 'changing') : t('admin', 'changePassword')}
            </button>
          </div>
        </Modal>
      )}

      {showCreateNode && (
        <Modal title={t('admin', 'addNode')} onClose={() => { setShowCreateNode(false); setNodeErr('') }} isDark={isDark}>
          {([
            { label: t('admin', 'nodeName'),    key: 'name',        placeholder: 'ex: ttsdp18a',                type: 'text'   },
            { label: t('admin', 'description'), key: 'description', placeholder: 'ex: Service Data Point sec.', type: 'text'   },
            { label: t('admin', 'ipAddress'),   key: 'ip_address',  placeholder: '192.168.147.130',             type: 'text'   },
            { label: t('admin', 'serverType'),  key: 'server_type', placeholder: 'HPE ProLiant DL360p Gen8',    type: 'text'   },
            { label: t('admin', 'port'),        key: 'port',        placeholder: '9107',                        type: 'number' },
          ] as const).map(f => (
            <Field key={f.key} label={f.label}>
              <input style={inputS} type={f.type} placeholder={f.placeholder} value={(newNode as Record<string, string>)[f.key]} onChange={e => setNewNode(p => ({ ...p, [f.key]: e.target.value }))} />
            </Field>
          ))}
          <Field label={t('admin', 'role')}>
            <select style={selectS} value={newNode.role} onChange={e => setNewNode(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {nodeErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{nodeErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowCreateNode(false); setNodeErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleCreateNode} disabled={savingNode} style={btnPrimary()}>{savingNode ? t('admin', 'adding') : t('admin', 'add')}</button>
          </div>
        </Modal>
      )}

      {editNode && (
        <Modal title={`Modifier — ${editNode.display_name || editNode.name}`} onClose={() => { setEditNode(null); setEditNodeErr('') }} isDark={isDark}>
          <Field label={t('admin', 'role')}>
            <select style={selectS} value={editNodeForm.role} onChange={e => setEditNodeForm(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {([
            { label: t('admin', 'description'), key: 'description', placeholder: '',                         type: 'text'   },
            { label: t('admin', 'ipAddress'),   key: 'ip_address',  placeholder: '192.168.147.128',          type: 'text'   },
            { label: t('admin', 'serverType'),  key: 'server_type', placeholder: 'HPE ProLiant DL360p Gen8', type: 'text'   },
            { label: t('admin', 'port'),        key: 'port',        placeholder: '9101',                     type: 'number' },
          ] as const).map(f => (
            <Field key={f.key} label={f.label}>
              <input style={inputS} type={f.type} placeholder={f.placeholder} value={(editNodeForm as Record<string, string>)[f.key]} onChange={e => setEditNodeForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </Field>
          ))}
          {editNodeErr && <p style={{ color: '#A32D2D', fontSize: 12, background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: 7, margin: 0 }}>{editNodeErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditNode(null); setEditNodeErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleEditNode} disabled={savingEditNode} style={btnPrimary()}>{savingEditNode ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0;transform:translateX(16px) } to { opacity:1;transform:translateX(0) } }
        input[type="datetime-local"] { color-scheme: ${isDark ? 'dark' : 'light'} }
        select option { background:${isDark ? '#1a1d2e' : '#ffffff'} !important; color:${isDark ? '#e8f4ff' : '#0a1628'} !important }
      `}</style>
    </DashboardLayout>
  )
}