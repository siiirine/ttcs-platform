'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { adminApi, User, NodeAdmin } from '@/lib/api'
import {
  Users, Server, Plus, Trash2, KeyRound, RefreshCw,
  ShieldCheck, Eye, EyeOff, Pencil, Clock, X, Lock,
  LayoutDashboard, Activity, AlertCircle, AlertTriangle,
  Info, CheckCircle, Crown, User as UserIcon, ServerCrash,
} from 'lucide-react'

const BASE_URL = 'http://192.168.147.129:8000'
const ROLES = ['CCN', 'AIR', 'SDP', 'VS', 'OCC', 'AF']

const roleColor: Record<string, string> = {
  CCN: '#185FA5', AIR: '#0F6E56', SDP: '#534AB7',
  VS:  '#5F5E5A', OCC: '#854F0B', AF:  '#993556',
}

function useIsDark() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === 'dark'
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

function getExpiryStatus(expires_at: string | null, translate: (s: string, k: string) => string) {
  if (!expires_at) return { label: translate('admin', 'unlimited'), color: '#3B6D11', bg: 'rgba(59,109,17,0.12)' }
  const exp  = new Date(expires_at)
  const diff = exp.getTime() - Date.now()
  if (diff <= 0) return { label: translate('admin', 'expired'), color: '#A32D2D', bg: 'rgba(163,45,45,0.12)' }
  const days = Math.ceil(diff / 86400000)
  if (days <= 7) return { label: `${days}j restant${days > 1 ? 's' : ''}`, color: '#854F0B', bg: 'rgba(133,79,11,0.12)' }
  return { label: exp.toLocaleDateString('fr-FR'), color: '#185FA5', bg: 'rgba(24,95,165,0.1)' }
}

function RoleBadge({ role, translate }: { role: string; translate: (s: string, k: string) => string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: isAdmin ? 'rgba(163,45,45,0.12)' : 'rgba(24,95,165,0.12)',
      color: isAdmin ? '#A32D2D' : '#185FA5',
      border: `1px solid ${isAdmin ? 'rgba(163,45,45,0.35)' : 'rgba(24,95,165,0.35)'}`,
      borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
    }}>
      {isAdmin ? <Crown size={10} style={{ flexShrink: 0 }} /> : <UserIcon size={10} style={{ flexShrink: 0 }} />}
      {isAdmin ? translate('admin', 'admin') : translate('admin', 'operator')}
    </span>
  )
}

function NodeTypeBadge({ role }: { role: string }) {
  const c = roleColor[role] || '#5F5E5A'
  return (
    <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}44`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{role}</span>
  )
}

function KpiCard({ label, value, color, icon: Icon, isDark }: {
  label: string; value: string | number; color?: string; icon?: React.ElementType; isDark: boolean
}) {
  return (
    <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)', borderRadius: '10px', padding: '14px 16px', border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
      <div style={{ fontSize: '11px', color: isDark ? '#7a9bc5' : '#5F5E5A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {Icon && <Icon size={12} aria-hidden />}{label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 500, color: color || (isDark ? '#e8f4ff' : '#0a1628'), lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function Modal({ title, children, onClose, isDark }: { title: string; children: React.ReactNode; onClose: () => void; isDark: boolean }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: isDark ? '#1a1d2e' : 'white', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '460px', border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: `0.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, color: isDark ? '#e8f4ff' : '#0a1628', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex', padding: 4 }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: error ? '#A32D2D' : '#7a9bc5', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{label}</label>
      {children}
      {hint  && !error && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7a9bc5' }}>{hint}</p>}
      {error && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#A32D2D' }}>⚠ {error}</p>}
    </div>
  )
}

function ActionBtn({ onClick, color, title, children }: { onClick: () => void; color: string; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{ background: `${color}18`, border: `0.5px solid ${color}55`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color }}>{children}</span>
    </button>
  )
}

type AdminView = 'dashboard' | 'users' | 'nodes' | 'monitoring'

export default function AdminPage() {
  const isDark = useIsDark()
  const { t } = useLang()

  const textPri   = isDark ? '#e8f4ff' : '#0a1628'
  const textSec   = isDark ? '#7a9bc5' : '#5F5E5A'
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const cardBg    = isDark ? 'rgba(26,29,46,0.97)' : 'white'
  const rowHover  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
  const inputBg   = isDark ? '#2a2d42' : 'white'
  const inputCol  = isDark ? '#e8f4ff' : '#0a1628'

  const cardStyle: React.CSSProperties = { background: cardBg, border: `0.5px solid ${borderCol}`, borderRadius: '12px', padding: '20px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)' }
  const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none', background: inputBg, color: inputCol, boxSizing: 'border-box', border: `0.5px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)'}` }
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' }
  const btnPrimary = (c = '#185FA5'): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: c, color: 'white', border: 'none', fontSize: '12px', fontWeight: 500, cursor: 'pointer' })
  const btnOutline = (c = '#185FA5'): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '7px', background: 'transparent', color: c, border: `0.5px solid ${c}`, fontSize: '12px', fontWeight: 500, cursor: 'pointer' })

  const [view, setView] = useState<AdminView>('dashboard')
  const [users,    setUsers]    = useState<User[]>([])
  const [nodes,    setNodes]    = useState<NodeAdmin[]>([])
  const [loadingU, setLoadingU] = useState(true)
  const [loadingN, setLoadingN] = useState(true)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

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

  const [showCreateNode,  setShowCreateNode]  = useState(false)
  const [newNode,         setNewNode]         = useState({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
  const [savingNode,      setSavingNode]      = useState(false)
  const [nodeErr,         setNodeErr]         = useState('')
  const [editNode,        setEditNode]        = useState<NodeAdmin | null>(null)
  const [editNodeForm,    setEditNodeForm]    = useState({ role: '', description: '', ip_address: '', server_type: '', port: '' })
  const [savingEditNode,  setSavingEditNode]  = useState(false)
  const [editNodeErr,     setEditNodeErr]     = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'operator' | 'inactive'>('all')

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
  const minDate    = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  const handleCreate = async () => {
    setCreateErr('')
    if (!newUser.full_name.trim()) { setCreateErr(t('admin', 'fullNameRequired')); return }
    if (!newUser.email.trim())     { setCreateErr(t('admin', 'emailRequired')); return }
    if (!newUser.email.includes('@') || newUser.email.indexOf('@') === 0) { setCreateErr(t('admin', 'emailInvalid')); return }
    setSavingCreate(true)
    try {
      const res  = await fetch(`${BASE_URL}/admin/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getCookie('ttcs_token')}` }, body: JSON.stringify({ full_name: newUser.full_name.trim(), email: newUser.email.trim().toLowerCase(), role: newUser.role }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      showToast(`"${data.user.username}" créé${data.email_sent ? ' — Email envoyé ✉️' : ''}`)
      setShowCreate(false); setNewUser({ full_name: '', email: '', role: 'operator' }); fetchUsers()
    } catch (e) { setCreateErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingCreate(false) }
  }

  const openEditUser = (u: User) => { setEditUser(u); setEditUserErr(''); setEditUserForm({ full_name: u.full_name || '', email: u.email || '', role: u.role }) }
  const handleEditUser = async () => {
    if (!editUser) return; setEditUserErr('')
    if (editUserForm.email && !editUserForm.email.includes('@')) { setEditUserErr(t('admin', 'emailInvalid')); return }
    setSavingEditU(true)
    try {
      await adminApi.updateUser(editUser.id, { full_name: editUserForm.full_name || undefined, email: editUserForm.email?.trim().toLowerCase(), role: editUserForm.role })
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
    try { await adminApi.resetPassword(resetTarget.id, newPwd); showToast(`Mot de passe de "${resetTarget.username}" réinitialisé`); setResetTarget(null); setNewPwd('') }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
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
      showToast(expiryDate ? `Expiration définie` : `Expiration supprimée`); setExpiryTarget(null); fetchUsers()
    } catch (e) { setExpiryErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingExpiry(false) }
  }

  const handleChangePwd = async () => {
    setChangePwdErr('')
    if (!changePwdForm.old_password) { setChangePwdErr(t('admin', 'oldPwdRequired')); return }
    if (changePwdForm.new_password.length < 6) { setChangePwdErr(t('admin', 'min6')); return }
    if (changePwdForm.new_password !== changePwdForm.confirm) { setChangePwdErr(t('admin', 'passwordsNoMatch')); return }
    setSavingChgPwd(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getCookie('ttcs_token')}` }, body: JSON.stringify({ old_password: changePwdForm.old_password, new_password: changePwdForm.new_password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      showToast('Mot de passe modifié'); setShowChangePwd(false); setChangePwdForm({ old_password: '', new_password: '', confirm: '' })
    } catch (e) { setChangePwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingChgPwd(false) }
  }

  const handleCreateNode = async () => {
    setNodeErr('')
    if (!newNode.name || !newNode.description || !newNode.port || !newNode.ip_address.trim() || !newNode.server_type.trim()) { setNodeErr(t('admin', 'nodeFieldsRequired')); return }
    setSavingNode(true)
    try {
      await adminApi.createNode({ ...newNode, port: parseInt(newNode.port) })
      showToast(`Nœud "${newNode.name}" ajouté`); setShowCreateNode(false); setNewNode({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' }); fetchNodes()
    } catch (e) { setNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingNode(false) }
  }

  const openEditNode = (n: NodeAdmin) => { setEditNode(n); setEditNodeErr(''); setEditNodeForm({ role: n.role, description: n.description, ip_address: n.ip_address || '', server_type: n.server_type || '', port: String(n.port) }) }
  const handleEditNode = async () => {
    if (!editNode) return; setEditNodeErr('')
    if (!editNodeForm.ip_address.trim() || !editNodeForm.server_type.trim() || !editNodeForm.port) { setEditNodeErr(t('admin', 'nodeFieldsRequired')); return }
    setSavingEditNode(true)
    try {
      await adminApi.updateNode(editNode.name, { role: editNodeForm.role, description: editNodeForm.description, ip_address: editNodeForm.ip_address.trim(), server_type: editNodeForm.server_type.trim(), port: parseInt(editNodeForm.port) })
      showToast(`Nœud "${editNode.name}" modifié`); setEditNode(null); fetchNodes()
    } catch (e) { setEditNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingEditNode(false) }
  }
  const handleDeleteNode = async (name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try { await adminApi.deleteNode(name); showToast(`Nœud "${name}" supprimé`); fetchNodes() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  const navItems: { key: AdminView; label: string; Icon: React.ElementType; count?: number }[] = [
    { key: 'dashboard',  label: 'Dashboard',        Icon: LayoutDashboard },
    { key: 'monitoring', label: 'Monitoring',        Icon: Activity },
    { key: 'users',      label: t('admin', 'users'), Icon: Users,  count: users.length },
    { key: 'nodes',      label: t('admin', 'nodes'), Icon: Server, count: nodes.length },
  ]

  return (
    <DashboardLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 76, right: 24, zIndex: 9999, padding: '10px 18px', borderRadius: '8px', background: toast.ok ? '#3B6D11' : '#A32D2D', color: 'white', fontSize: '12px', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideIn .25s ease' }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', gap: '20px', minHeight: '80vh' }}>

        {/* Sidebar */}
        <aside style={{ width: '200px', flexShrink: 0, background: cardBg, border: `0.5px solid ${borderCol}`, borderRadius: '12px', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ padding: '8px 10px 14px', borderBottom: `0.5px solid ${borderCol}`, marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '7px', background: 'rgba(163,45,45,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={14} style={{ color: '#A32D2D' }} aria-hidden />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>Console admin</div>
                <div style={{ fontSize: '10px', color: textSec }}>TTCS Platform</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: '10px', fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.7px', padding: '4px 10px', marginBottom: '2px' }}>Vue d'ensemble</div>
          {navItems.slice(0, 2).map(item => (
            <NavItem key={item.key} item={item} active={view === item.key} onClick={() => setView(item.key)} textPri={textPri} textSec={textSec} isDark={isDark} />
          ))}
          <div style={{ fontSize: '10px', fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.7px', padding: '12px 10px 2px', marginBottom: '2px' }}>Administration</div>
          {navItems.slice(2).map(item => (
            <NavItem key={item.key} item={item} active={view === item.key} onClick={() => setView(item.key)} textPri={textPri} textSec={textSec} isDark={isDark} />
          ))}
          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: `0.5px solid ${borderCol}` }}>
            <button onClick={() => { setShowChangePwd(true); setChangePwdErr(''); setChangePwdForm({ old_password: '', new_password: '', confirm: '' }) }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px', borderRadius: '7px', background: 'transparent', border: 'none', color: textSec, fontSize: '12px', cursor: 'pointer' }}>
              <Lock size={13} aria-hidden /> {t('admin', 'changeMyPassword')}
            </button>
          </div>
        </aside>

        {/* Contenu */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
                <KpiCard label="Nœuds déployés"  value={nodes.length}  icon={Server}      isDark={isDark} />
                <KpiCard label="Utilisateurs"     value={users.length}  icon={Users}       isDark={isDark} />
                <KpiCard label="Admins"           value={adminCount}    icon={Crown}       isDark={isDark} color="#185FA5" />
                <KpiCard label="Jamais connecté"  value={neverCount}    icon={AlertCircle} isDark={isDark} color={neverCount > 0 ? '#A32D2D' : undefined} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* État des nœuds */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: `0.5px solid ${borderCol}` }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>État des nœuds</span>
                    <button onClick={() => setView('nodes')} style={{ fontSize: '11px', color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
                  </div>
                  {loadingN ? <div style={{ color: textSec, fontSize: '12px' }}>Chargement…</div> : nodes.slice(0, 6).map(n => (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `0.5px solid ${borderCol}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: '6px', background: `${roleColor[n.role] || '#5F5E5A'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Server size={13} style={{ color: roleColor[n.role] || '#5F5E5A' }} aria-hidden />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* ✅ Supprimé : nom technique en petit */}
                        <div style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>{(n as any).display_name || n.name}</div>
                      </div>
                      <NodeTypeBadge role={n.role} />
                    </div>
                  ))}
                </div>

                {/* Comptes récents */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: `0.5px solid ${borderCol}` }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>Comptes récents</span>
                    <button onClick={() => setView('users')} style={{ fontSize: '11px', color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
                  </div>
                  {loadingU ? <div style={{ color: textSec, fontSize: '12px' }}>Chargement…</div> : users.slice(0, 6).map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `0.5px solid ${borderCol}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.role === 'admin' ? 'rgba(163,45,45,0.12)' : 'rgba(24,95,165,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: u.role === 'admin' ? '#A32D2D' : '#185FA5', flexShrink: 0 }}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || u.username}</div>
                        <div style={{ fontSize: '10px', color: textSec }}>{u.email || '—'}</div>
                      </div>
                      <RoleBadge role={u.role} translate={t} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* MONITORING */}
          {view === 'monitoring' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
                <KpiCard label="Nœuds total"   value={nodes.length} icon={Server}        isDark={isDark} />
                <KpiCard label="Opérationnels" value={nodes.length} icon={CheckCircle}   isDark={isDark} color="#3B6D11" />
                <KpiCard label="En alerte"     value={0}            icon={AlertTriangle} isDark={isDark} color="#854F0B" />
                <KpiCard label="Critiques"     value={0}            icon={ServerCrash}   isDark={isDark} color="#A32D2D" />
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: `0.5px solid ${borderCol}` }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>Infrastructure réseau</span>
                  <button onClick={fetchNodes} style={btnOutline('#185FA5')}><RefreshCw size={12} aria-hidden />{t('admin', 'refresh')}</button>
                </div>
                {loadingN ? <div style={{ color: textSec, padding: '20px', fontSize: '12px' }}>Chargement…</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `0.5px solid ${borderCol}` }}>
                        {['Nœud', 'Type', 'Adresse IP', 'Port', 'Serveur'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(n => (
                        <tr key={n.id} style={{ borderBottom: `0.5px solid ${borderCol}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 26, height: 26, borderRadius: '6px', background: `${roleColor[n.role] || '#5F5E5A'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Server size={12} style={{ color: roleColor[n.role] || '#5F5E5A' }} aria-hidden />
                              </div>
                              {/* ✅ Supprimé : nom technique en petit */}
                              <div style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>{(n as any).display_name || n.name}</div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}><NodeTypeBadge role={n.role} /></td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: textSec, fontFamily: 'monospace' }}>{n.ip_address || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: textSec, fontFamily: 'monospace' }}>{n.port}</td>
                          <td style={{ padding: '10px 12px', fontSize: '11px', color: textSec }}>{n.server_type || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* UTILISATEURS */}
          {view === 'users' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
                <KpiCard label="Total comptes"   value={users.length} icon={Users}        isDark={isDark} />
                <KpiCard label="Admins"          value={adminCount}   icon={Crown}        isDark={isDark} color="#185FA5" />
                <KpiCard label="Opérateurs"      value={opCount}      icon={UserIcon}     isDark={isDark} color="#3B6D11" />
                <KpiCard label="Jamais connecté" value={neverCount}   icon={AlertCircle}  isDark={isDark} color={neverCount > 0 ? '#A32D2D' : undefined} />
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: textPri, marginRight: '4px' }}>{t('admin', 'users')} ({filteredUsers.length})</span>
                  {(['all', 'admin', 'operator', 'inactive'] as const).map(f => (
                    <button key={f} onClick={() => setUserFilter(f)} style={{ padding: '4px 10px', borderRadius: '14px', fontSize: '11px', cursor: 'pointer', background: userFilter === f ? '#185FA5' : 'transparent', color: userFilter === f ? 'white' : textSec, border: `0.5px solid ${userFilter === f ? '#185FA5' : borderCol}`, fontWeight: userFilter === f ? 500 : 400 }}>
                      {{ all: 'Tous', admin: 'Admin', operator: 'Opérateur', inactive: 'Jamais connecté' }[f]}
                    </button>
                  ))}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button onClick={fetchUsers} style={btnOutline('#185FA5')}><RefreshCw size={12} aria-hidden />{t('admin', 'refresh')}</button>
                    <button onClick={() => { setShowCreate(true); setCreateErr('') }} style={btnPrimary()}><Plus size={13} aria-hidden />{t('admin', 'newUser')}</button>
                  </div>
                </div>
                {loadingU ? <div style={{ textAlign: 'center', padding: '40px', color: textSec, fontSize: '12px' }}>{t('admin', 'loading')}</div> : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: `0.5px solid ${borderCol}` }}>
                          {[t('admin','username'), t('admin','fullName'), t('admin','email'), t('admin','role'), t('admin','expiration'), t('admin','lastLogin'), t('admin','actions')].map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => {
                          const expiry = getExpiryStatus(u.expires_at || null, t)
                          return (
                            <tr key={u.id} style={{ borderBottom: `0.5px solid ${borderCol}` }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: u.role === 'admin' ? 'rgba(163,45,45,0.12)' : 'rgba(24,95,165,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 500, color: u.role === 'admin' ? '#A32D2D' : '#185FA5', flexShrink: 0 }}>
                                    {u.username[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>{u.username}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', color: textSec }}>{u.full_name || '—'}</td>
                              <td style={{ padding: '10px 12px', fontSize: '11px', color: textSec, fontFamily: 'monospace' }}>{u.email || '—'}</td>
                              <td style={{ padding: '10px 12px' }}><RoleBadge role={u.role} translate={t} /></td>
                              <td style={{ padding: '10px 12px' }}>
                                {u.role === 'admin' ? <span style={{ fontSize: '11px', color: textSec }}>—</span> : <span style={{ fontSize: '11px', fontWeight: 500, color: expiry.color, background: expiry.bg, padding: '2px 8px', borderRadius: '10px' }}>{expiry.label}</span>}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '11px', color: textSec }}>{u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : t('admin', 'never')}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <ActionBtn onClick={() => openEditUser(u)} color="#185FA5" title={t('admin','modify')}><Pencil size={12} /></ActionBtn>
                                  {u.role === 'operator' && <ActionBtn onClick={() => openExpiry(u)} color="#534AB7" title={t('admin','expiration')}><Clock size={12} /></ActionBtn>}
                                  <ActionBtn onClick={() => { setResetTarget(u); setNewPwd('') }} color="#854F0B" title={t('admin','resetPassword')}><KeyRound size={12} /></ActionBtn>
                                  {u.username !== 'admin' && <ActionBtn onClick={() => handleDelete(u)} color="#A32D2D" title={t('admin','delete')}><Trash2 size={12} /></ActionBtn>}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px', color: textSec, fontSize: '12px' }}>
                        <Info size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: .4 }} aria-hidden />
                        Aucun utilisateur dans ce filtre
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* NŒUDS */}
          {view === 'nodes' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px' }}>
                {(['CCN','SDP','OCC','AF'] as const).map(r => (
                  <KpiCard key={r} label={`Nœuds ${r}`} value={nodes.filter(n => n.role === r).length} isDark={isDark} color={roleColor[r]} />
                ))}
              </div>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>{t('admin', 'nodes')} ({nodes.length})</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={fetchNodes} style={btnOutline('#185FA5')}><RefreshCw size={12} aria-hidden />{t('admin', 'refresh')}</button>
                    <button onClick={() => setShowCreateNode(true)} style={btnPrimary()}><Plus size={13} aria-hidden />{t('admin', 'newNode')}</button>
                  </div>
                </div>
                {loadingN ? <div style={{ color: textSec, fontSize: '12px', padding: '20px' }}>Chargement…</div> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `0.5px solid ${borderCol}` }}>
                        {['Nœud', 'Type', 'Description', 'IP / Port', 'Serveur', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 500, color: textSec, textTransform: 'uppercase', letterSpacing: '.6px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(n => (
                        <tr key={n.id} style={{ borderBottom: `0.5px solid ${borderCol}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: 30, height: 30, borderRadius: '7px', background: `${roleColor[n.role] || '#5F5E5A'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `2px solid ${roleColor[n.role] || '#5F5E5A'}` }}>
                                <Server size={13} style={{ color: roleColor[n.role] || '#5F5E5A' }} aria-hidden />
                              </div>
                              {/* ✅ Supprimé : nom technique en petit */}
                              <div style={{ fontSize: '12px', fontWeight: 500, color: textPri }}>{(n as any).display_name || n.name}</div>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}><NodeTypeBadge role={n.role} /></td>
                          <td style={{ padding: '10px 12px', fontSize: '11px', color: textSec, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.description}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: '11px', color: textSec, fontFamily: 'monospace' }}>{n.ip_address || '—'}</div>
                            <div style={{ fontSize: '10px', color: textSec, opacity: .7 }}>:{n.port}</div>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '11px', color: textSec, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.server_type || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <ActionBtn onClick={() => openEditNode(n)} color="#185FA5" title={t('admin','modify')}><Pencil size={12} /></ActionBtn>
                              <ActionBtn onClick={() => handleDeleteNode(n.name)} color="#A32D2D" title={t('admin','delete')}><Trash2 size={12} /></ActionBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showCreate && (
        <Modal title={t('admin', 'createUser')} onClose={() => { setShowCreate(false); setCreateErr('') }} isDark={isDark}>
          <div style={{ background: isDark ? 'rgba(24,95,165,0.1)' : '#f0f7ff', border: '0.5px solid rgba(24,95,165,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: textSec, lineHeight: 1.6 }}>
            Le login et mot de passe sont générés automatiquement et envoyés par email.
          </div>
          <Field label={t('admin', 'fullNameLabel')}><input style={inputS} placeholder="Ex : Ghassen Chelly" value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} /></Field>
          <Field label={t('admin', 'emailLabel')}><input style={inputS} type="email" placeholder="Ex : ghassen@tunisietelecom.tn" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label={t('admin', 'roleLabel')}>
            <select style={selectS} value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}>
              <option value="operator">{t('admin', 'operator')}</option>
              <option value="admin">{t('admin', 'admin')}</option>
            </select>
          </Field>
          {createErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{createErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowCreate(false); setCreateErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleCreate} disabled={savingCreate} style={btnPrimary()}>{savingCreate ? t('admin', 'creating') : t('admin', 'createAndSend')}</button>
          </div>
        </Modal>
      )}

      {editUser && (
        <Modal title={`${t('admin','editUser')} — ${editUser.username}`} onClose={() => { setEditUser(null); setEditUserErr('') }} isDark={isDark}>
          <Field label={t('admin', 'fullName')}><input style={inputS} value={editUserForm.full_name} onChange={e => setEditUserForm(p => ({ ...p, full_name: e.target.value }))} /></Field>
          <Field label={t('admin', 'email')}><input style={inputS} type="email" value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} /></Field>
          <Field label={t('admin', 'roleLabel')}>
            <select style={selectS} value={editUserForm.role} onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}>
              <option value="operator">{t('admin', 'operator')}</option>
              <option value="admin">{t('admin', 'admin')}</option>
            </select>
          </Field>
          {editUserErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{editUserErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditUser(null); setEditUserErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleEditUser} disabled={savingEditU} style={btnPrimary()}>{savingEditU ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      {expiryTarget && (
        <Modal title={`${t('admin','expirationModal')} — ${expiryTarget.username}`} onClose={() => { setExpiryTarget(null); setExpiryErr('') }} isDark={isDark}>
          <Field label={t('admin', 'newExpiry')} hint={t('admin', 'expiryHint')}>
            <input style={inputS} type="datetime-local" min={minDate} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </Field>
          {expiryErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{expiryErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setExpiryTarget(null); setExpiryErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            {expiryDate && <button onClick={() => setExpiryDate('')} style={btnOutline('#5F5E5A')}><X size={12} aria-hidden /> {t('admin', 'removeLimit')}</button>}
            <button onClick={handleSetExpiry} disabled={savingExpiry} style={btnPrimary('#534AB7')}><Clock size={13} aria-hidden />{savingExpiry ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      {resetTarget && (
        <Modal title={t('admin', 'resetPassword')} onClose={() => { setResetTarget(null); setNewPwd('') }} isDark={isDark}>
          <p style={{ color: textSec, fontSize: '12px', margin: 0 }}>Utilisateur : <strong style={{ color: textPri }}>{resetTarget.username}</strong></p>
          <Field label={t('admin', 'newPassword')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showNewPwd ? 'text' : 'password'} placeholder="••••••••" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button onClick={() => setShowNewPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex' }}>{showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </Field>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setResetTarget(null); setNewPwd('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleResetPwd} disabled={savingPwd || !newPwd} style={btnPrimary('#854F0B')}>{savingPwd ? t('admin', 'saving') : t('admin', 'reset')}</button>
          </div>
        </Modal>
      )}

      {showChangePwd && (
        <Modal title={t('admin', 'changePassword')} onClose={() => { setShowChangePwd(false); setChangePwdErr('') }} isDark={isDark}>
          {[
            { label: t('admin','oldPassword'),     val: changePwdForm.old_password, key: 'old_password', show: showOldPwd, toggle: () => setShowOldPwd(p => !p) },
            { label: t('admin','newPassword'),     val: changePwdForm.new_password, key: 'new_password', show: showNewP,   toggle: () => setShowNewP(p => !p) },
            { label: t('admin','confirmPassword'), val: changePwdForm.confirm,       key: 'confirm',      show: showConfP,  toggle: () => setShowConfP(p => !p) },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputS, paddingRight: '40px' }} type={f.show ? 'text' : 'password'} placeholder="••••••••" value={f.val} onChange={e => setChangePwdForm(p => ({ ...p, [f.key]: e.target.value }))} />
                <button onClick={f.toggle} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex' }}>{f.show ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </Field>
          ))}
          {changePwdErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{changePwdErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowChangePwd(false); setChangePwdErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleChangePwd} disabled={savingChgPwd} style={btnPrimary('#534AB7')}><Lock size={13} aria-hidden />{savingChgPwd ? t('admin', 'changing') : t('admin', 'changePassword')}</button>
          </div>
        </Modal>
      )}

      {showCreateNode && (
        <Modal title={t('admin', 'addNode')} onClose={() => { setShowCreateNode(false); setNodeErr('') }} isDark={isDark}>
          {[
            { label: t('admin','nodeName'),    key: 'name',        placeholder: 'ex: ttsdp18a',                type: 'text'   },
            { label: t('admin','description'), key: 'description', placeholder: 'ex: Service Data Point sec.', type: 'text'   },
            { label: t('admin','ipAddress'),   key: 'ip_address',  placeholder: '192.168.147.130',             type: 'text'   },
            { label: t('admin','serverType'),  key: 'server_type', placeholder: 'HPE ProLiant DL360p Gen8',    type: 'text'   },
            { label: t('admin','port'),        key: 'port',        placeholder: '9107',                        type: 'number' },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <input style={inputS} type={f.type} placeholder={f.placeholder} value={(newNode as Record<string, string>)[f.key]} onChange={e => setNewNode(p => ({ ...p, [f.key]: e.target.value }))} />
            </Field>
          ))}
          <Field label={t('admin', 'role')}>
            <select style={selectS} value={newNode.role} onChange={e => setNewNode(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {nodeErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{nodeErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowCreateNode(false); setNodeErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleCreateNode} disabled={savingNode} style={btnPrimary()}>{savingNode ? t('admin', 'adding') : t('admin', 'add')}</button>
          </div>
        </Modal>
      )}

      {editNode && (
        <Modal title={`${t('admin','modify')} — ${editNode.name}`} onClose={() => { setEditNode(null); setEditNodeErr('') }} isDark={isDark}>
          <Field label={t('admin', 'role')}>
            <select style={selectS} value={editNodeForm.role} onChange={e => setEditNodeForm(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          {[
            { label: t('admin','description'), key: 'description', placeholder: '' },
            { label: t('admin','ipAddress'),   key: 'ip_address',  placeholder: '192.168.147.128' },
            { label: t('admin','serverType'),  key: 'server_type', placeholder: 'HPE ProLiant DL360p Gen8' },
            { label: t('admin','port'),        key: 'port',        placeholder: '9101' },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <input style={inputS} placeholder={f.placeholder} type={f.key === 'port' ? 'number' : 'text'} value={(editNodeForm as Record<string, string>)[f.key]} onChange={e => setEditNodeForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </Field>
          ))}
          {editNodeErr && <p style={{ color: '#A32D2D', fontSize: '12px', background: 'rgba(163,45,45,0.08)', padding: '8px 12px', borderRadius: '7px', margin: 0 }}>{editNodeErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setEditNode(null); setEditNodeErr('') }} style={btnOutline('#5F5E5A')}>{t('admin', 'cancel')}</button>
            <button onClick={handleEditNode} disabled={savingEditNode} style={btnPrimary()}>{savingEditNode ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }
        input[type="datetime-local"] { color-scheme: ${isDark ? 'dark' : 'light'} }
        select option { background: ${isDark ? '#1a1d2e' : '#ffffff'} !important; color: ${isDark ? '#e8f4ff' : '#0a1628'} !important }
      `}</style>
    </DashboardLayout>
  )
}

function NavItem({ item, active, onClick, textPri, textSec, isDark }: {
  item: { key: string; label: string; Icon: React.ElementType; count?: number }
  active: boolean; onClick: () => void; textPri: string; textSec: string; isDark: boolean
}) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '7px', width: '100%', background: active ? 'rgba(24,95,165,0.12)' : 'transparent', color: active ? '#185FA5' : textSec, border: 'none', fontSize: '12px', cursor: 'pointer', fontWeight: active ? 500 : 400, textAlign: 'left' }}>
      <item.Icon size={14} aria-hidden />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count !== undefined && (
        <span style={{ fontSize: '10px', fontWeight: 500, padding: '1px 6px', borderRadius: '10px', background: active ? '#185FA5' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), color: active ? 'white' : textSec }}>{item.count}</span>
      )}
    </button>
  )
}