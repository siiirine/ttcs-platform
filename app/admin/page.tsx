'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { adminApi, User, NodeAdmin } from '@/lib/api'
import {
  Users, Server, Plus, Trash2,
  KeyRound, RefreshCw, ShieldCheck, Eye, EyeOff,
} from 'lucide-react'

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

function Badge({ role }: { role: string }) {
  const c = roleColor[role] || '#6b7280'
  return (
    <span style={{ background: `${c}22`, color: c, border: `1px solid ${c}44`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
      {role}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(0,130,240,0.15)',
      color: isAdmin ? '#ef4444' : '#0082f0',
      border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.4)' : 'rgba(0,130,240,0.4)'}`,
      borderRadius: '6px', padding: '2px 10px', fontSize: '11px', fontWeight: 700,
    }}>
      {isAdmin ? 'Admin' : 'Opérateur'}
    </span>
  )
}

// ✅ Select avec options toujours lisibles (fond blanc, texte noir forcé)
function StyledSelect({ value, onChange, children, style }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={style}
    >
      {children}
    </select>
  )
}

// Option toujours sur fond blanc avec texte noir — indépendant du thème
function Opt({ value, label }: { value: string; label: string }) {
  return (
    <option value={value} style={{ background: '#ffffff', color: '#0a1628', fontWeight: 500 }}>
      {label}
    </option>
  )
}

function Modal({ title, children, onClose, isDark }: {
  title: string; children: React.ReactNode; onClose: () => void; isDark: boolean
}) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#7a9bc5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function btnStyle(color: string, outline = false): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '8px',
    background: outline ? 'transparent' : color,
    color: outline ? color : 'white',
    border: outline ? `1px solid ${color}` : '1px solid transparent',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
  }
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const isDark = useIsDark()

  const cardBg     = isDark ? 'rgba(26,29,46,0.97)'     : 'rgba(255,255,255,0.9)'
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)'   : 'rgba(0,130,240,0.15)'
  const titleCol   = isDark ? '#e8f4ff'                  : '#0a1628'
  const subCol     = isDark ? '#7a9bc5'                  : '#7a9bc5'
  const headCol    = isDark ? '#5a7a99'                  : '#7a9bc5'
  const textCol    = isDark ? '#cdd6e0'                  : '#0a1628'
  const text2Col   = isDark ? '#8899aa'                  : '#4a6a8a'
  const rowHover   = isDark ? 'rgba(255,255,255,0.04)'   : 'rgba(0,130,240,0.03)'
  const rowBorder  = isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(0,130,240,0.06)'
  const nodeBg     = isDark ? 'rgba(255,255,255,0.04)'   : 'white'
  const nodeBorder = isDark ? 'rgba(255,255,255,0.08)'   : 'rgba(0,130,240,0.15)'
  const monoTag    = isDark ? 'rgba(255,255,255,0.07)'   : 'rgba(0,130,240,0.06)'
  const monoText   = isDark ? '#a0b4c8'                  : '#4a6a8a'

  // ✅ Input : fond légèrement clair en dark pour que le texte soit visible
  const inputBg     = isDark ? '#2a2d42' : 'white'
  const inputBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,130,240,0.25)'
  const inputColor  = isDark ? '#e8f4ff' : '#0a1628'

  const inputS: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: `1px solid ${inputBorder}`,
    borderRadius: '8px', fontSize: '13px',
    outline: 'none', background: inputBg,
    color: inputColor, boxSizing: 'border-box',
  }

  // ✅ Select : fond blanc forcé pour que les options soient lisibles
  const selectS: React.CSSProperties = {
    ...inputS,
    // On garde le fond du select lui-même thémé
    // mais les options seront toujours sur fond blanc (via <Opt>)
    cursor: 'pointer',
  }

  const card: React.CSSProperties = {
    background: cardBg, border: `1px solid ${cardBorder}`,
    borderRadius: '14px', padding: '24px',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,130,240,0.08)',
  }

  const [tab, setTab] = useState<'users' | 'nodes'>('users')
  const [users, setUsers]           = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [nodes, setNodes]           = useState<NodeAdmin[]>([])
  const [loadingNodes, setLoadingNodes] = useState(true)

  const [showUserForm, setShowUserForm] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', email: '', role: 'operator' })
  const [showPwd, setShowPwd]           = useState(false)
  const [savingUser, setSavingUser]     = useState(false)
  const [userError, setUserError]       = useState('')

  const [resetTarget, setResetTarget]   = useState<User | null>(null)
  const [newPwd, setNewPwd]             = useState('')
  const [showNewPwd, setShowNewPwd]     = useState(false)
  const [savingPwd, setSavingPwd]       = useState(false)

  const [showNodeForm, setShowNodeForm] = useState(false)
  const [newNode, setNewNode] = useState({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
  const [savingNode, setSavingNode]     = useState(false)
  const [nodeError, setNodeError]       = useState('')

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try { const r = await adminApi.getUsers(); setUsers(r.users) }
    catch { showToast('Erreur chargement utilisateurs', false) }
    finally { setLoadingUsers(false) }
  }
  const fetchNodes = async () => {
    setLoadingNodes(true)
    try { const r = await adminApi.getNodes(); setNodes(r.nodes) }
    catch { showToast('Erreur chargement noeuds', false) }
    finally { setLoadingNodes(false) }
  }
  useEffect(() => { fetchUsers(); fetchNodes() }, [])

  const handleCreateUser = async () => {
    setUserError('')
    if (!newUser.username || !newUser.password) { setUserError('Username et mot de passe requis'); return }
    setSavingUser(true)
    try {
      await adminApi.createUser(newUser)
      showToast(`Utilisateur "${newUser.username}" créé`)
      setShowUserForm(false)
      setNewUser({ username: '', password: '', full_name: '', email: '', role: 'operator' })
      fetchUsers()
    } catch (e) { setUserError(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingUser(false) }
  }

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Supprimer "${u.username}" ?`)) return
    try { await adminApi.deleteUser(u.id); showToast(`"${u.username}" supprimé`); fetchUsers() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  const handleResetPwd = async () => {
    if (!resetTarget || !newPwd) return
    setSavingPwd(true)
    try {
      await adminApi.resetPassword(resetTarget.id, newPwd)
      showToast(`Mot de passe de "${resetTarget.username}" réinitialisé`)
      setResetTarget(null); setNewPwd('')
    } catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
    finally { setSavingPwd(false) }
  }

  const handleCreateNode = async () => {
    setNodeError('')
    if (!newNode.name || !newNode.description || !newNode.port) { setNodeError('Nom, description et port requis'); return }
    setSavingNode(true)
    try {
      await adminApi.createNode({ ...newNode, port: parseInt(newNode.port) })
      showToast(`Noeud "${newNode.name}" ajouté`)
      setShowNodeForm(false)
      setNewNode({ name: '', role: 'CCN', description: '', ip_address: '', server_type: '', port: '' })
      fetchNodes()
    } catch (e) { setNodeError(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingNode(false) }
  }

  const handleDeleteNode = async (name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try { await adminApi.deleteNode(name); showToast(`Noeud "${name}" supprimé`); fetchNodes() }
    catch (e) { showToast(e instanceof Error ? e.message : 'Erreur', false) }
  }

  return (
    <DashboardLayout>
      {toast && (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, padding: '12px 20px', borderRadius: '10px', background: toast.ok ? '#16a34a' : '#dc2626', color: 'white', fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', animation: 'slideIn 0.3s ease' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} style={{ color: '#ef4444' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: titleCol, margin: 0 }}>Administration</h1>
        </div>
        <p style={{ color: subCol, fontSize: '13px', margin: 0 }}>Gestion des utilisateurs et de l&apos;infrastructure</p>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {([
          { key: 'users', label: 'Utilisateurs', Icon: Users,  count: users.length },
          { key: 'nodes', label: 'Noeuds',       Icon: Server, count: nodes.length },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
            border: tab === t.key ? '1px solid rgba(0,130,240,0.5)' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,130,240,0.15)'}`,
            background: tab === t.key ? 'rgba(0,130,240,0.15)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
            color: tab === t.key ? '#0082f0' : subCol, fontWeight: tab === t.key ? 700 : 400, fontSize: '13px', transition: 'all 0.2s',
          }}>
            <t.Icon size={15} />
            {t.label}
            <span style={{ background: tab === t.key ? '#0082f0' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,130,240,0.1)', color: tab === t.key ? 'white' : subCol, borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ══ UTILISATEURS ══ */}
      {tab === 'users' && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: titleCol, margin: 0 }}>Utilisateurs ({users.length})</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchUsers} style={btnStyle(isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.08)', true)}>
                <RefreshCw size={13} style={{ color: '#0082f0' }} /><span style={{ color: '#0082f0' }}>Actualiser</span>
              </button>
              <button onClick={() => setShowUserForm(true)} style={btnStyle('#0082f0')}>
                <Plus size={14} /> Nouvel opérateur
              </button>
            </div>
          </div>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: subCol }}>Chargement...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${rowBorder}` }}>
                    {['Utilisateur', 'Nom complet', 'Email', 'Rôle', 'Créé le', 'Dernière connexion', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: headCol, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${rowBorder}` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = rowHover}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,130,240,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#0082f0' }}>
                            {u.username[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: textCol }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: text2Col }}>{u.full_name || '—'}</td>
                      <td style={{ padding: '12px', fontSize: '12px', color: text2Col, fontFamily: 'monospace' }}>{u.email || '—'}</td>
                      <td style={{ padding: '12px' }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: '12px', fontSize: '12px', color: subCol }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td style={{ padding: '12px', fontSize: '12px', color: subCol }}>{u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : 'Jamais'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { setResetTarget(u); setNewPwd('') }} title="Réinitialiser mot de passe"
                            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <KeyRound size={13} style={{ color: '#f59e0b' }} />
                          </button>
                          {u.username !== 'admin' && (
                            <button onClick={() => handleDeleteUser(u)} title="Supprimer"
                              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={13} style={{ color: '#ef4444' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: titleCol, margin: 0 }}>Noeuds ({nodes.length})</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={fetchNodes} style={btnStyle(isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.08)', true)}>
                <RefreshCw size={13} style={{ color: '#0082f0' }} /><span style={{ color: '#0082f0' }}>Actualiser</span>
              </button>
              <button onClick={() => setShowNodeForm(true)} style={btnStyle('#0082f0')}>
                <Plus size={14} /> Nouveau noeud
              </button>
            </div>
          </div>
          {loadingNodes ? (
            <div style={{ color: subCol, padding: '20px' }}>Chargement...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {nodes.map(n => (
                <div key={n.id} style={{ border: `1px solid ${nodeBorder}`, borderRadius: '12px', padding: '18px', background: nodeBg, borderLeft: `4px solid ${roleColor[n.role] || '#6b7280'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: titleCol, marginBottom: '4px' }}>{n.name}</div>
                      <Badge role={n.role} />
                    </div>
                    <button onClick={() => handleDeleteNode(n.name)} title="Supprimer"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={13} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: subCol, marginBottom: '10px' }}>{n.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: `Port : ${n.port}`, show: true },
                      { label: `IP : ${n.ip_address}`, show: !!n.ip_address },
                      { label: n.server_type || '', show: !!n.server_type },
                    ].filter(x => x.show).map(x => (
                      <span key={x.label} style={{ fontSize: '11px', color: monoText, fontFamily: 'monospace', background: monoTag, padding: '3px 8px', borderRadius: '6px' }}>
                        {x.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL créer user ══ */}
      {showUserForm && (
        <Modal title="Créer un opérateur" onClose={() => { setShowUserForm(false); setUserError('') }} isDark={isDark}>
          <Field label="Nom d'utilisateur *">
            <input style={inputS} placeholder="ex: operateur1" value={newUser.username}
              onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} />
          </Field>
          <Field label="Nom complet">
            <input style={inputS} placeholder="ex: Ahmed Ben Ali" value={newUser.full_name}
              onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input style={inputS} type="email" placeholder="ex: ahmed@tunisietelecom.tn" value={newUser.email}
              onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Mot de passe *">
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showPwd ? 'text' : 'password'}
                placeholder="••••••••" value={newUser.password}
                onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="Rôle">
            {/* ✅ select avec fond blanc forcé pour les options */}
            <StyledSelect value={newUser.role} onChange={v => setNewUser(p => ({ ...p, role: v }))} style={selectS}>
              <Opt value="operator" label="Opérateur" />
              <Opt value="admin"    label="Administrateur" />
            </StyledSelect>
          </Field>
          {userError && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{userError}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowUserForm(false); setUserError('') }} style={btnStyle('#7a9bc5', true)}>Annuler</button>
            <button type="button" onClick={handleCreateUser} disabled={savingUser} style={btnStyle('#0082f0')}>
              {savingUser ? 'Création...' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL reset password ══ */}
      {resetTarget && (
        <Modal title="Réinitialiser le mot de passe" onClose={() => { setResetTarget(null); setNewPwd('') }} isDark={isDark}>
          <p style={{ color: subCol, fontSize: '13px', margin: 0 }}>
            Utilisateur : <strong style={{ color: titleCol }}>{resetTarget.username}</strong>
          </p>
          <Field label="Nouveau mot de passe">
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputS, paddingRight: '40px' }} type={showNewPwd ? 'text' : 'password'}
                placeholder="••••••••" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
              <button type="button" onClick={() => setShowNewPwd(p => !p)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9bc5', display: 'flex' }}>
                {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setResetTarget(null); setNewPwd('') }} style={btnStyle('#7a9bc5', true)}>Annuler</button>
            <button type="button" onClick={handleResetPwd} disabled={savingPwd || !newPwd} style={btnStyle('#f59e0b')}>
              {savingPwd ? 'Enregistrement...' : 'Réinitialiser'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL créer noeud ══ */}
      {showNodeForm && (
        <Modal title="Ajouter un noeud" onClose={() => { setShowNodeForm(false); setNodeError('') }} isDark={isDark}>
          <Field label="Nom du noeud *">
            <input style={inputS} placeholder="ex: ttsdp18a" value={newNode.name}
              onChange={e => setNewNode(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Rôle *">
            {/* ✅ Options toujours lisibles avec fond blanc */}
            <StyledSelect value={newNode.role} onChange={v => setNewNode(p => ({ ...p, role: v }))} style={selectS}>
              {ROLES.map(r => <Opt key={r} value={r} label={r} />)}
            </StyledSelect>
          </Field>
          <Field label="Description *">
            <input style={inputS} placeholder="ex: Service Data Point secondaire" value={newNode.description}
              onChange={e => setNewNode(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <Field label="Adresse IP">
            <input style={inputS} placeholder="ex: 192.168.147.130" value={newNode.ip_address}
              onChange={e => setNewNode(p => ({ ...p, ip_address: e.target.value }))} />
          </Field>
          <Field label="Type de serveur">
            <input style={inputS} placeholder="ex: Docker / VMware / Bare Metal" value={newNode.server_type}
              onChange={e => setNewNode(p => ({ ...p, server_type: e.target.value }))} />
          </Field>
          <Field label="Port *">
            <input style={inputS} type="number" placeholder="ex: 9107" value={newNode.port}
              onChange={e => setNewNode(p => ({ ...p, port: e.target.value }))} />
          </Field>
          {nodeError && <p style={{ color: '#ef4444', fontSize: '12px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '8px', margin: 0 }}>{nodeError}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowNodeForm(false); setNodeError('') }} style={btnStyle('#7a9bc5', true)}>Annuler</button>
            <button type="button" onClick={handleCreateNode} disabled={savingNode} style={btnStyle('#0082f0')}>
              {savingNode ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        select option { background: #ffffff !important; color: #0a1628 !important; }
      `}</style>
    </DashboardLayout>
  )
}