'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/language-context'
import { useTheme } from 'next-themes'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { adminApi, User, NodeAdmin } from '@/lib/api'
import {
  Users, Server, Plus, Trash2,
  KeyRound, RefreshCw, ShieldCheck, Eye, EyeOff, Pencil, Clock, X, Lock,
} from 'lucide-react'

const BASE_URL = 'http://192.168.147.129:8000'
const ROLES = ['CCN', 'AIR', 'SDP', 'VS', 'OCC', 'AF']

const roleColor: Record<string, string> = {
  CCN: '#0082f0', AIR: '#00d4aa', SDP: '#a855f7',
  VS: '#6b7280',  OCC: '#f97316', AF: '#ec4899',
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

// ✅ t passé en paramètre — évite le problème de scope
function getExpiryStatus(expires_at: string | null, translate: (s: string, k: string) => string): { label: string; color: string; bg: string } {
  if (!expires_at) return { label: translate('admin', 'unlimited'), color: '#00d4aa', bg: 'rgba(0,212,170,0.12)' }
  const exp = new Date(expires_at)
  const now = new Date()
  const diff = exp.getTime() - now.getTime()
  if (diff <= 0) return { label: translate('admin', 'expired'), color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  const days = Math.ceil(diff / 86400000)
  if (days <= 7) return { label: `${days}j restant${days > 1 ? 's' : ''}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { label: exp.toLocaleDateString('fr-FR'), color: '#0082f0', bg: 'rgba(0,130,240,0.1)' }
}

function Badge({ role }: { role: string }) {
  const c = roleColor[role] || '#6b7280'
  return <span style={{ background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{role}</span>
}

// ✅ RoleBadge reçoit translate en prop — plus de dépendance externe à t
function RoleBadge({ role, translate }: { role: string; translate: (s: string, k: string) => string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{ background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(0,130,240,0.15)', color: isAdmin ? '#ef4444' : '#0082f0', border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.4)' : 'rgba(0,130,240,0.4)'}`, borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>
      {isAdmin ? translate('admin', 'admin') : translate('admin', 'operator')}
    </span>
  )
}

function StyledSelect({ value, onChange, children, style }: { value: string; onChange: (v: string) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={style}>{children}</select>
}
function Opt({ value, label }: { value: string; label: string }) {
  return <option value={value} style={{ background: '#ffffff', color: '#0a1628', fontWeight: 500 }}>{label}</option>
}

function Modal({ title, children, onClose, isDark }: { title: string; children: React.ReactNode; onClose: () => void; isDark: boolean }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: isDark ? '#1a1d2e' : 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,130,240,0.15)'}`, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#e8f4ff' : '#0a1628', margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: error ? '#ef4444' : '#7a9bc5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</label>
      {children}
      {hint && !error && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7a9bc5' }}>{hint}</p>}
      {error && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444' }}>⚠ {error}</p>}
    </div>
  )
}

function btnStyle(color: string, outline = false): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: outline ? 'transparent' : color, color: outline ? color : 'white', border: outline ? `1px solid ${color}` : '1px solid transparent', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }
}

export default function AdminPage() {
  const isDark = useIsDark()
  const { t } = useLang()

  const cardBg     = isDark ? 'rgba(26,29,46,0.97)'    : 'rgba(255,255,255,0.9)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.15)'
  const titleCol   = isDark ? '#e8f4ff'                : '#0a1628'
  const subCol     = isDark ? '#7a9bc5'                : '#7a9bc5'
  const headCol    = isDark ? '#5a7a99'                : '#7a9bc5'
  const textCol    = isDark ? '#cdd6e0'                : '#0a1628'
  const text2Col   = isDark ? '#8899aa'                : '#4a6a8a'
  const rowHover   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,130,240,0.03)'
  const rowBorder  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,130,240,0.06)'
  const nodeBg     = isDark ? 'rgba(255,255,255,0.04)' : 'white'
  const nodeBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.15)'
  const monoTag    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,130,240,0.06)'
  const monoText   = isDark ? '#a0b4c8'                : '#4a6a8a'
  const inputBg    = isDark ? '#2a2d42' : 'white'
  const inputBdr   = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,130,240,0.25)'
  const inputCol   = isDark ? '#e8f4ff' : '#0a1628'

  const inputS: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', outline: 'none', background: inputBg, color: inputCol, boxSizing: 'border-box', border: `1px solid ${inputBdr}` }
  const inputErr: React.CSSProperties = { ...inputS, border: '1px solid rgba(239,68,68,0.6)', background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)' }
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' }
  const card: React.CSSProperties = { background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '14px', padding: '24px', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,130,240,0.08)' }

  const [tab, setTab] = useState<'users' | 'nodes'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loadingU, setLoadingU] = useState(true)
  const [nodes, setNodes] = useState<NodeAdmin[]>([])
  const [loadingN, setLoadingN] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'operator' })
  const [roleTouched, setRoleTouched] = useState(false)
  const [savingCreate, setSavingCreate] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editUserForm, setEditUserForm] = useState({ full_name: '', email: '', role: '' })
  const [savingEditUser, setSavingEditUser] = useState(false)
  const [editUserErr, setEditUserErr] = useState('')

  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  const [showChangePwd, setShowChangePwd] = useState(false)
  const [changePwdForm, setChangePwdForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewUserPwd, setShowNewUserPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [savingChangePwd, setSavingChangePwd] = useState(false)
  const [changePwdErr, setChangePwdErr] = useState('')

  const [expiryTarget, setExpiryTarget] = useState<User | null>(null)
  const [expiryDate, setExpiryDate]     = useState('')
  const [savingExpiry, setSavingExpiry] = useState(false)
  const [expiryErr, setExpiryErr]       = useState('')

  const [showCreateNode, setShowCreateNode] = useState(false)
  const [newNode, setNewNode] = useState({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
  const [ipTouched, setIpTouched] = useState(false)
  const [stTouched, setStTouched] = useState(false)
  const [savingNode, setSavingNode] = useState(false)
  const [nodeErr, setNodeErr] = useState('')

  const [editNode, setEditNode] = useState<NodeAdmin | null>(null)
  const [editNodeForm, setEditNodeForm] = useState({ role: '', description: '', ip_address: '', server_type: '', port: '' })
  const [savingEditNode, setSavingEditNode] = useState(false)
  const [editNodeErr, setEditNodeErr] = useState('')

  const createRoleErr = roleTouched && !newUser.role ? t('admin', 'roleRequired') : ''
  const ipErr = ipTouched && !newNode.ip_address.trim() ? t('admin', 'ipRequired') : ''
  const stErr = stTouched && !newNode.server_type.trim() ? t('admin', 'serverTypeRequired') : ''

  const fetchUsers = async () => {
    setLoadingU(true)
    try { const r = await adminApi.getUsers(); setUsers(r.users) }
    catch { showToast('Erreur chargement utilisateurs', false) }
    finally { setLoadingU(false) }
  }
  const fetchNodes = async () => {
    setLoadingN(true)
    try { const r = await adminApi.getNodes(); setNodes(r.nodes) }
    catch { showToast('Erreur chargement noeuds', false) }
    finally { setLoadingN(false) }
  }
  useEffect(() => { fetchUsers(); fetchNodes() }, [])

  const handleCreate = async () => {
    setCreateErr('')
    if (!newUser.full_name.trim()) { setCreateErr(t('admin', 'fullNameRequired')); return }
    if (!newUser.email.trim()) { setCreateErr(t('admin', 'emailRequired')); return }
    if (!newUser.email.includes('@') || newUser.email.indexOf('@') === 0) { setCreateErr(t('admin', 'emailInvalid')); return }
    if (!newUser.role) { setCreateErr(t('admin', 'roleRequired')); setRoleTouched(true); return }
    setSavingCreate(true)
    try {
      const result = await fetch(`${BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCookie('ttcs_token')}` },
        body: JSON.stringify({ full_name: newUser.full_name.trim(), email: newUser.email.trim().toLowerCase(), role: newUser.role }),
      })
      const data = await result.json()
      if (!result.ok) throw new Error(data.detail || 'Erreur lors de la création')
      const emailMsg = data.email_sent ? ' — Email envoyé ✉️' : ' — Email non envoyé'
      showToast(`Utilisateur "${data.user.username}" créé${emailMsg}`)
      setShowCreate(false); setNewUser({ full_name: '', email: '', role: 'operator' }); setRoleTouched(false); fetchUsers()
    } catch (e) { setCreateErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingCreate(false) }
  }

  const openEditUser = (u: User) => { setEditUser(u); setEditUserForm({ full_name: u.full_name || '', email: u.email || '', role: u.role }); setEditUserErr('') }

  const handleEditUser = async () => {
    if (!editUser) return; setEditUserErr('')
    if (editUserForm.email && !editUserForm.email.includes('@')) { setEditUserErr(t('admin', 'emailInvalid')); return }
    if (!editUserForm.role) { setEditUserErr(t('admin', 'roleRequired')); return }
    setSavingEditUser(true)
    try {
      await adminApi.updateUser(editUser.id, { full_name: editUserForm.full_name || undefined, email: editUserForm.email ? editUserForm.email.trim().toLowerCase() : undefined, role: editUserForm.role })
      showToast(`"${editUser.username}" modifié`); setEditUser(null); fetchUsers()
    } catch (e) { setEditUserErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingEditUser(false) }
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

  const handleChangePwd = async () => {
    setChangePwdErr('')
    if (!changePwdForm.old_password) { setChangePwdErr(t('admin', 'oldPwdRequired')); return }
    if (!changePwdForm.new_password) { setChangePwdErr(t('admin', 'newPwdRequired')); return }
    if (changePwdForm.new_password.length < 6) { setChangePwdErr(t('admin', 'min6')); return }
    if (changePwdForm.new_password !== changePwdForm.confirm) { setChangePwdErr(t('admin', 'passwordsNoMatch')); return }
    setSavingChangePwd(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCookie('ttcs_token')}` },
        body: JSON.stringify({ old_password: changePwdForm.old_password, new_password: changePwdForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      showToast('✅ Mot de passe modifié avec succès'); setShowChangePwd(false); setChangePwdForm({ old_password: '', new_password: '', confirm: '' })
    } catch (e) { setChangePwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingChangePwd(false) }
  }

  const openExpiry = (u: User) => {
    setExpiryTarget(u); setExpiryErr('')
    if (u.expires_at) {
      const d = new Date(u.expires_at); const pad = (n: number) => String(n).padStart(2, '0')
      setExpiryDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
    } else { setExpiryDate('') }
  }

  const handleSetExpiry = async () => {
    if (!expiryTarget) return
    setSavingExpiry(true); setExpiryErr('')
    try {
      await adminApi.setExpiry(expiryTarget.id, expiryDate ? new Date(expiryDate).toISOString() : null)
      showToast(expiryDate ? `Expiration définie pour "${expiryTarget.username}"` : `Expiration supprimée pour "${expiryTarget.username}"`)
      setExpiryTarget(null); fetchUsers()
    } catch (e) { setExpiryErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingExpiry(false) }
  }

  const handleCreateNode = async () => {
    setNodeErr('')
    if (!newNode.name || !newNode.description || !newNode.port) { setNodeErr(t('admin', 'nodeFieldsRequired')); return }
    if (!newNode.ip_address.trim()) { setNodeErr(t('admin', 'ipRequired')); setIpTouched(true); return }
    if (!newNode.server_type.trim()) { setNodeErr(t('admin', 'serverTypeRequired')); setStTouched(true); return }
    setSavingNode(true)
    try {
      await adminApi.createNode({ ...newNode, port: parseInt(newNode.port) })
      showToast(`Noeud "${newNode.name}" ajouté`); setShowCreateNode(false)
      setNewNode({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
      setIpTouched(false); setStTouched(false); fetchNodes()
    } catch (e) { setNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingNode(false) }
  }

  const openEditNode = (n: NodeAdmin) => {
    setEditNode(n); setEditNodeForm({ role: n.role, description: n.description, ip_address: n.ip_address || '', server_type: n.server_type || '', port: String(n.port) }); setEditNodeErr('')
  }

  const handleEditNode = async () => {
    if (!editNode) return; setEditNodeErr('')
    if (!editNodeForm.ip_address.trim()) { setEditNodeErr(t('admin', 'ipRequired')); return }
    if (!editNodeForm.server_type.trim()) { setEditNodeErr(t('admin', 'serverTypeRequired')); return }
    if (!editNodeForm.port) { setEditNodeErr(t('admin', 'portRequired')); return }
    setSavingEditNode(true)
    try {
      await adminApi.updateNode(editNode.name, { role: editNodeForm.role, description: editNodeForm.description, ip_address: editNodeForm.ip_address.trim(), server_type: editNodeForm.server_type.trim(), port: parseInt(editNodeForm.port) })
      showToast(`Noeud "${editNode.name}" modifié`); setEditNode(null); fetchNodes()
    } catch (e) { setEditNodeErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingEditNode(false) }
  }

  const handleDeleteNode = async (name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try { await adminApi.deleteNode(name); showToast(`Noeud "${name}" supprimé`); fetchNodes() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  const minDate = new Date(Date.now() + 60000).toISOString().slice(0, 16)

  // ✅ Onglets définis comme tableau normal — pas de conflit avec t
  const tabs = [
    { key: 'users' as const, label: t('admin', 'users'), Icon: Users,  count: users.length },
    { key: 'nodes' as const, label: t('admin', 'nodes'), Icon: Server, count: nodes.length },
  ]

  return (
    <DashboardLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} style={{ color: '#ef4444' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: titleCol, margin: 0 }}>{t('admin', 'title')}</h1>
          </div>
          <button onClick={() => { setShowChangePwd(true); setChangePwdErr(''); setChangePwdForm({ old_password: '', new_password: '', confirm: '' }) }}
            style={{ ...btnStyle('rgba(168,85,247,0.15)', true), color: '#a855f7', border: '1px solid rgba(168,85,247,0.4)' }}>
            <Lock size={13} style={{ color: '#a855f7' }} />
            <span style={{ color: '#a855f7' }}>{t('admin', 'changeMyPassword')}</span>
          </button>
        </div>
        <p style={{ color: subCol, fontSize: '13px', margin: 0 }}>{t('admin', 'subtitle')}</p>
      </div>

      {/* ✅ Onglets — variable tab2 pour éviter conflit avec t */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(tab2 => (
          <button key={tab2.key} onClick={() => setTab(tab2.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
            border: tab === tab2.key ? '1px solid rgba(0,130,240,0.5)' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,130,240,0.15)'}`,
            background: tab === tab2.key ? 'rgba(0,130,240,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
            color: tab === tab2.key ? '#0082f0' : subCol, fontWeight: tab === tab2.key ? 700 : 400, fontSize: '13px', transition: 'all 0.2s',
          }}>
            <tab2.Icon size={15} />{tab2.label}
            <span style={{ background: tab === tab2.key ? '#0082f0' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,130,240,0.1)', color: tab === tab2.key ? 'white' : subCol, borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>{tab2.count}</span>
          </button>
        ))}
      </div>

      {/* ══ UTILISATEURS ══ */}
      {tab === 'users' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: titleCol, margin: 0 }}>{t('admin', 'users')} ({users.length})</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchUsers} style={btnStyle(isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.08)', true)}>
                <RefreshCw size={13} style={{ color: '#0082f0' }} /><span style={{ color: '#0082f0' }}>{t('admin', 'refresh')}</span>
              </button>
              <button onClick={() => { setShowCreate(true); setCreateErr('') }} style={btnStyle('#0082f0')}>
                <Plus size={14} /> {t('admin', 'newUser')}
              </button>
            </div>
          </div>
          {loadingU ? <div style={{ textAlign: 'center', padding: '40px', color: subCol }}>{t('admin', 'loading')}</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${rowBorder}` }}>
                    {[t('admin','username'), t('admin','fullName'), t('admin','email'), t('admin','role'), t('admin','expiration'), t('admin','lastLogin'), t('admin','actions')].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: headCol, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const expiry = getExpiryStatus(u.expires_at || null, t)
                    return (
                      <tr key={u.id} style={{ borderBottom: `1px solid ${rowBorder}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,130,240,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0082f0' }}>{u.username[0].toUpperCase()}</div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: textCol }}>{u.username}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: text2Col }}>{u.full_name || '—'}</td>
                        <td style={{ padding: '12px', fontSize: '12px', color: text2Col, fontFamily: 'monospace' }}>{u.email || '—'}</td>
                        <td style={{ padding: '12px' }}><RoleBadge role={u.role} translate={t} /></td>
                        <td style={{ padding: '12px' }}>
                          {u.role === 'admin' ? (
                            <span style={{ fontSize: '11px', color: subCol }}>—</span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: expiry.color, background: expiry.bg, padding: '3px 8px', borderRadius: '6px' }}>{expiry.label}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: subCol }}>{u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : t('admin', 'never')}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEditUser(u)} title={t('admin','modify')} style={{ background: 'rgba(0,130,240,0.12)', border: '1px solid rgba(0,130,240,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Pencil size={13} style={{ color: '#0082f0' }} /></button>
                            {u.role === 'operator' && (
                              <button onClick={() => openExpiry(u)} title={t('admin','expiration')} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Clock size={13} style={{ color: '#a855f7' }} />
                              </button>
                            )}
                            <button onClick={() => { setResetTarget(u); setNewPwd('') }} title={t('admin','resetPassword')} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><KeyRound size={13} style={{ color: '#f59e0b' }} /></button>
                            {u.username !== 'admin' && <button onClick={() => handleDelete(u)} title={t('admin','delete')} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={13} style={{ color: '#ef4444' }} /></button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ NOEUDS ══ */}
      {tab === 'nodes' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: titleCol, margin: 0 }}>{t('admin', 'nodes')} ({nodes.length})</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchNodes} style={btnStyle(isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.08)', true)}>
                <RefreshCw size={13} style={{ color: '#0082f0' }} /><span style={{ color: '#0082f0' }}>{t('admin', 'refresh')}</span>
              </button>
              <button onClick={() => setShowCreateNode(true)} style={btnStyle('#0082f0')}><Plus size={14} /> {t('admin', 'newNode')}</button>
            </div>
          </div>
          {loadingN ? <div style={{ color: subCol, padding: '20px' }}>{t('admin', 'loading')}</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {nodes.map(n => (
                <div key={n.id} style={{ border: `1px solid ${nodeBorder}`, borderRadius: '12px', padding: '18px', background: nodeBg, borderLeft: `4px solid ${roleColor[n.role] || '#6b7280'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div><div style={{ fontSize: '14px', fontWeight: 700, color: titleCol, marginBottom: '4px' }}>{n.name}</div><Badge role={n.role} /></div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEditNode(n)} style={{ background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={13} style={{ color: '#0082f0' }} /></button>
                      <button onClick={() => handleDeleteNode(n.name)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} style={{ color: '#ef4444' }} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: subCol, marginBottom: '10px' }}>{n.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[{ label: `Port : ${n.port}`, show: true }, { label: `IP : ${n.ip_address}`, show: !!n.ip_address }, { label: n.server_type || '', show: !!n.server_type }].filter(x => x.show).map(x => (
                      <span key={x.label} style={{ fontSize: '11px', color: monoText, fontFamily: 'monospace', background: monoTag, padding: '3px 8px', borderRadius: '6px' }}>{x.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL Créer user ══ */}
      {showCreate && (
        <Modal title={t('admin', 'createUser')} onClose={() => { setShowCreate(false); setCreateErr(''); setRoleTouched(false) }} isDark={isDark}>
          <div style={{ background: isDark ? 'rgba(0,130,240,0.1)' : '#f0f7ff', border: '1px solid rgba(0,130,240,0.25)', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: subCol, lineHeight: 1.6 }}>
            <strong style={{ color: '#0082f0' }}>{t('admin', 'autoCreation')}</strong> — {t('admin', 'autoCreationDesc')}
          </div>
          <Field label={t('admin', 'fullNameLabel')}>
            <input style={inputS} placeholder="Ex : Ghassen Chelly" value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} />
          </Field>
          <Field label={t('admin', 'emailLabel')} hint={t('admin', 'emailHint')}>
            <input style={inputS} type="email" placeholder="Ex : ghassen@gmail.com" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label={t('admin', 'roleLabel')} error={createRoleErr}>
            <StyledSelect value={newUser.role} onChange={v => { setNewUser(p => ({ ...p, role: v })); setRoleTouched(true) }} style={createRoleErr ? { ...selectS, border: '1px solid rgba(239,68,68,0.6)' } : selectS}>
              <Opt value="operator" label={t('admin', 'operator')} />
              <Opt value="admin"    label={t('admin', 'admin')} />
            </StyledSelect>
          </Field>
          {createErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{createErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowCreate(false); setCreateErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleCreate} disabled={savingCreate} style={btnStyle('#0082f0')}>
              {savingCreate ? t('admin', 'creating') : t('admin', 'createAndSend')}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Modifier user ══ */}
      {editUser && (
        <Modal title={`${t('admin','editUser')} "${editUser.username}"`} onClose={() => { setEditUser(null); setEditUserErr('') }} isDark={isDark}>
          <Field label={t('admin', 'fullName')}>
            <input style={inputS} value={editUserForm.full_name} onChange={e => setEditUserForm(p => ({ ...p, full_name: e.target.value }))} />
          </Field>
          <Field label={t('admin', 'email')}>
            <input style={inputS} type="email" value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label={t('admin', 'roleLabel')}>
            <StyledSelect value={editUserForm.role} onChange={v => setEditUserForm(p => ({ ...p, role: v }))} style={selectS}>
              <Opt value="operator" label={t('admin', 'operator')} />
              <Opt value="admin"    label={t('admin', 'admin')} />
            </StyledSelect>
          </Field>
          {editUserErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{editUserErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setEditUser(null); setEditUserErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleEditUser} disabled={savingEditUser} style={btnStyle('#0082f0')}>{savingEditUser ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Expiration ══ */}
      {expiryTarget && (
        <Modal title={`${t('admin','expirationModal')} — ${expiryTarget.username}`} onClose={() => { setExpiryTarget(null); setExpiryErr('') }} isDark={isDark}>
          <div style={{ padding: '12px', borderRadius: '10px', background: isDark ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', fontSize: '12px', color: subCol, lineHeight: 1.6 }}>
            <strong style={{ color: '#a855f7' }}>{t('admin','expiration')}</strong> — {t('admin','expirationDesc')}
          </div>
          {expiryTarget.expires_at && (() => {
            const s = getExpiryStatus(expiryTarget.expires_at!, t)
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: subCol }}>{t('admin','currentStatus')}</span>
                <span style={{ fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '6px' }}>{s.label}</span>
                <span style={{ color: subCol }}>— {new Date(expiryTarget.expires_at!).toLocaleString('fr-FR')}</span>
              </div>
            )
          })()}
          <Field label={t('admin', 'newExpiry')} hint={t('admin', 'expiryHint')}>
            <input style={inputS} type="datetime-local" min={minDate} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </Field>
          {expiryErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{expiryErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setExpiryTarget(null); setExpiryErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            {expiryDate && <button type="button" onClick={() => setExpiryDate('')} style={{ ...btnStyle('#6b7280', true), gap: '4px' }}><X size={12} /> {t('admin', 'removeLimit')}</button>}
            <button type="button" onClick={handleSetExpiry} disabled={savingExpiry} style={btnStyle('#a855f7')}>
              <Clock size={13} />{savingExpiry ? t('admin', 'saving') : t('admin', 'save')}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Reset password ══ */}
      {resetTarget && (
        <Modal title={t('admin', 'resetPassword')} onClose={() => { setResetTarget(null); setNewPwd('') }} isDark={isDark}>
          <p style={{ color: subCol, fontSize: '13px', margin: 0 }}>Utilisateur : <strong style={{ color: titleCol }}>{resetTarget.username}</strong></p>
          <Field label={t('admin', 'newPassword')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showNewPwd ? 'text' : 'password'} placeholder="••••••••" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button type="button" onClick={() => setShowNewPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>{showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </Field>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setResetTarget(null); setNewPwd('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleResetPwd} disabled={savingPwd || !newPwd} style={btnStyle('#f59e0b')}>{savingPwd ? t('admin', 'saving') : t('admin', 'reset')}</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Changer mot de passe ══ */}
      {showChangePwd && (
        <Modal title={t('admin', 'changePassword')} onClose={() => { setShowChangePwd(false); setChangePwdErr('') }} isDark={isDark}>
          <div style={{ padding: '12px', borderRadius: '10px', background: isDark ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', fontSize: '12px', color: subCol, lineHeight: 1.6 }}>
            <strong style={{ color: '#a855f7' }}>🔐 {t('admin', 'changePassword')}</strong> — {t('admin', 'min6')}
          </div>
          <Field label={t('admin', 'oldPassword')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showOldPwd ? 'text' : 'password'} placeholder="••••••••" value={changePwdForm.old_password} onChange={e => setChangePwdForm(p => ({ ...p, old_password: e.target.value }))} />
              <button type="button" onClick={() => setShowOldPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>{showOldPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </Field>
          <Field label={t('admin', 'newPassword')} hint={t('admin', 'min6')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showNewUserPwd ? 'text' : 'password'} placeholder="••••••••" value={changePwdForm.new_password} onChange={e => setChangePwdForm(p => ({ ...p, new_password: e.target.value }))} />
              <button type="button" onClick={() => setShowNewUserPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>{showNewUserPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </Field>
          <Field label={t('admin', 'confirmPassword')}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px', ...(changePwdForm.confirm && changePwdForm.new_password !== changePwdForm.confirm ? { border: '1px solid rgba(239,68,68,0.6)' } : {}) }}
                type={showConfirmPwd ? 'text' : 'password'} placeholder="••••••••" value={changePwdForm.confirm} onChange={e => setChangePwdForm(p => ({ ...p, confirm: e.target.value }))} />
              <button type="button" onClick={() => setShowConfirmPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>{showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
            {changePwdForm.confirm && changePwdForm.new_password !== changePwdForm.confirm && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444' }}>⚠ {t('admin', 'passwordsNoMatch')}</p>
            )}
          </Field>
          {changePwdErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{changePwdErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowChangePwd(false); setChangePwdErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleChangePwd} disabled={savingChangePwd} style={btnStyle('#a855f7')}>
              <Lock size={13} />{savingChangePwd ? t('admin', 'changing') : t('admin', 'changePassword')}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Créer noeud ══ */}
      {showCreateNode && (
        <Modal title={t('admin', 'addNode')} onClose={() => { setShowCreateNode(false); setNodeErr(''); setIpTouched(false); setStTouched(false) }} isDark={isDark}>
          <Field label={t('admin', 'nodeName')}><input style={inputS} placeholder="ex: ttsdp18a" value={newNode.name} onChange={e => setNewNode(p => ({ ...p, name: e.target.value }))} /></Field>
          <Field label={t('admin', 'role')}><StyledSelect value={newNode.role} onChange={v => setNewNode(p => ({ ...p, role: v }))} style={selectS}>{ROLES.map(r => <Opt key={r} value={r} label={r} />)}</StyledSelect></Field>
          <Field label={t('admin', 'description')}><input style={inputS} placeholder="ex: Service Data Point secondaire" value={newNode.description} onChange={e => setNewNode(p => ({ ...p, description: e.target.value }))} /></Field>
          <Field label={t('admin', 'ipAddress')} error={ipErr}><input style={ipErr ? inputErr : inputS} placeholder="ex: 192.168.147.130" value={newNode.ip_address} onChange={e => setNewNode(p => ({ ...p, ip_address: e.target.value }))} onBlur={() => setIpTouched(true)} /></Field>
          <Field label={t('admin', 'serverType')} error={stErr}><input style={stErr ? inputErr : inputS} placeholder="ex: HPE ProLiant DL360p Gen8" value={newNode.server_type} onChange={e => setNewNode(p => ({ ...p, server_type: e.target.value }))} onBlur={() => setStTouched(true)} /></Field>
          <Field label={t('admin', 'port')}><input style={inputS} type="number" placeholder="ex: 9107" value={newNode.port} onChange={e => setNewNode(p => ({ ...p, port: e.target.value }))} /></Field>
          {nodeErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{nodeErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowCreateNode(false); setNodeErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleCreateNode} disabled={savingNode} style={btnStyle('#0082f0')}>{savingNode ? t('admin', 'adding') : t('admin', 'add')}</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL Modifier noeud ══ */}
      {editNode && (
        <Modal title={`${t('admin','modify')} "${editNode.name}"`} onClose={() => { setEditNode(null); setEditNodeErr('') }} isDark={isDark}>
          <Field label={t('admin', 'role')}><StyledSelect value={editNodeForm.role} onChange={v => setEditNodeForm(p => ({ ...p, role: v }))} style={selectS}>{ROLES.map(r => <Opt key={r} value={r} label={r} />)}</StyledSelect></Field>
          <Field label={t('admin', 'description')}><input style={inputS} value={editNodeForm.description} onChange={e => setEditNodeForm(p => ({ ...p, description: e.target.value }))} /></Field>
          <Field label={t('admin', 'ipAddress')}><input style={inputS} placeholder="ex: 192.168.147.128" value={editNodeForm.ip_address} onChange={e => setEditNodeForm(p => ({ ...p, ip_address: e.target.value }))} /></Field>
          <Field label={t('admin', 'serverType')}><input style={inputS} placeholder="ex: HPE ProLiant DL360p Gen8" value={editNodeForm.server_type} onChange={e => setEditNodeForm(p => ({ ...p, server_type: e.target.value }))} /></Field>
          <Field label={t('admin', 'port')}><input style={inputS} type="number" value={editNodeForm.port} onChange={e => setEditNodeForm(p => ({ ...p, port: e.target.value }))} /></Field>
          {editNodeErr && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{editNodeErr}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setEditNode(null); setEditNodeErr('') }} style={btnStyle('#7a9bc5', true)}>{t('admin', 'cancel')}</button>
            <button type="button" onClick={handleEditNode} disabled={savingEditNode} style={btnStyle('#0082f0')}>{savingEditNode ? t('admin', 'saving') : t('admin', 'save')}</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        select option { background: #ffffff !important; color: #0a1628 !important; }
        input[type="datetime-local"] { color-scheme: ${isDark ? 'dark' : 'light'}; }
      `}</style>
    </DashboardLayout>
  )
}