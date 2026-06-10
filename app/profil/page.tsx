'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import {
  User, Mail, Shield, Calendar, Clock, Camera,
  KeyRound, Save, Eye, EyeOff, CheckCircle, AlertCircle,
  LogIn, Pencil, X,
} from 'lucide-react'

const BASE_URL = 'http://192.168.147.129:8000'

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : ''
}

function useIsDark() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === 'dark'
}

interface UserProfile {
  id: number
  username: string
  full_name: string
  email: string | null
  role: 'admin' | 'operator'
  created_at: string
  last_login: string | null
  expires_at: string | null
  avatar?: string | null
}

interface LoginEntry {
  created_at: string
  question: string
}

// ── Composants utilitaires ────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px', borderRadius: '12px',
      background: ok ? '#16a34a' : '#dc2626',
      color: 'white', fontSize: '13px', fontWeight: 600,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      animation: 'slideInRight 0.3s ease',
    }}>
      {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  )
}

function SectionCard({ title, icon, children, isDark }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; isDark: boolean
}) {
  return (
    <div style={{
      background: isDark ? 'rgba(26,29,46,0.97)' : 'white',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.15)'}`,
      borderRadius: '16px', padding: '24px',
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,130,240,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '9px',
          background: 'rgba(0,130,240,0.12)', border: '1px solid rgba(0,130,240,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#e8f4ff' : '#0a1628', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function ProfilPage() {
  const isDark = useIsDark()
  const router = useRouter()

  const titleCol  = isDark ? '#e8f4ff' : '#0a1628'
  const subCol    = isDark ? '#7a9bc5' : '#6b7280'
  const text2Col  = isDark ? '#8899aa' : '#4a6a8a'
  const inputBg   = isDark ? '#2a2d42' : 'white'
  const inputBdr  = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,130,240,0.25)'
  const inputCol  = isDark ? '#e8f4ff' : '#0a1628'
  const divider   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,130,240,0.08)'

  const inputS: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '9px',
    fontSize: '13px', outline: 'none', background: inputBg,
    color: inputCol, boxSizing: 'border-box',
    border: `1px solid ${inputBdr}`, transition: 'border 0.2s',
  }

  // ── State ─────────────────────────────────────────────────────────────────
  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const showToast = (msg: string, ok = true) => setToast({ msg, ok })

  // Avatar
  const fileRef                   = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingAvatar, setSavingAvatar]   = useState(false)

  // Infos
  const [editMode, setEditMode]   = useState(false)
  const [infoForm, setInfoForm]   = useState({ full_name: '', email: '' })
  const [savingInfo, setSavingInfo] = useState(false)
  const [infoErr, setInfoErr]     = useState('')

  // Password
  const [pwdForm, setPwdForm]     = useState({ old_password: '', new_password: '', confirm: '' })
  const [showOld, setShowOld]     = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdErr, setPwdErr]       = useState('')
  const [pwdOk, setPwdOk]         = useState(false)

  // Historique
  const [history, setHistory]     = useState<LoginEntry[]>([])
  const [loadingHist, setLoadingHist] = useState(true)

  // ── Fetch profil ──────────────────────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      const token = getCookie('ttcs_token')
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { router.push('/login'); return }
      const data: UserProfile = await res.json()
      setProfile(data)
      setInfoForm({ full_name: data.full_name || '', email: data.email || '' })

      // Avatar depuis localStorage
      const saved = localStorage.getItem(`avatar_${data.username}`)
      if (saved) setAvatarPreview(saved)
    } catch { router.push('/login') }
    finally { setLoading(false) }
  }

  // ── Fetch historique conversations (preuve de connexions) ─────────────────
  const fetchHistory = async () => {
    try {
      const token = getCookie('ttcs_token')
      const userCookie = getCookie('ttcs_user')
      if (!token || !userCookie) return
      const u = JSON.parse(userCookie)
      const res = await fetch(`${BASE_URL}/chat/history/${u.username}?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch { /* silencieux */ }
    finally { setLoadingHist(false) }
  }

  useEffect(() => { fetchProfile(); fetchHistory() }, [])

  // ── Avatar — sélection fichier ────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Image trop lourde (max 2 Mo)', false); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveAvatar = () => {
    if (!avatarPreview || !profile) return
    setSavingAvatar(true)
    setTimeout(() => {
      localStorage.setItem(`avatar_${profile.username}`, avatarPreview)
      setSavingAvatar(false)
      showToast('Photo de profil mise à jour')
    }, 600)
  }

  const handleRemoveAvatar = () => {
    if (!profile) return
    setAvatarPreview(null)
    localStorage.removeItem(`avatar_${profile.username}`)
    showToast('Photo supprimée')
  }

  // ── Sauvegarder infos ─────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!profile) return
    setInfoErr('')
    if (!infoForm.full_name.trim()) { setInfoErr('Le nom complet est requis'); return }
    if (infoForm.email && !infoForm.email.includes('@')) { setInfoErr('Email invalide'); return }
    setSavingInfo(true)
    try {
      const token = getCookie('ttcs_token')
      const res = await fetch(`${BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: infoForm.full_name, email: infoForm.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      setProfile(prev => prev ? { ...prev, full_name: infoForm.full_name, email: infoForm.email } : prev)

      // Met à jour le cookie ttcs_user
      const userCookie = getCookie('ttcs_user')
      if (userCookie) {
        const u = JSON.parse(userCookie)
        u.full_name = infoForm.full_name
        u.email = infoForm.email
        document.cookie = `ttcs_user=${encodeURIComponent(JSON.stringify(u))};path=/`
      }

      setEditMode(false)
      showToast('Informations mises à jour')
    } catch (e) { setInfoErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingInfo(false) }
  }

  // ── Changer mot de passe ──────────────────────────────────────────────────
  const handleChangePwd = async () => {
    setPwdErr(''); setPwdOk(false)
    if (!pwdForm.old_password) { setPwdErr("L'ancien mot de passe est requis"); return }
    if (!pwdForm.new_password) { setPwdErr('Le nouveau mot de passe est requis'); return }
    if (pwdForm.new_password.length < 6) { setPwdErr('Minimum 6 caractères'); return }
    if (pwdForm.new_password !== pwdForm.confirm) { setPwdErr('Les mots de passe ne correspondent pas'); return }
    setSavingPwd(true)
    try {
      const token = getCookie('ttcs_token')
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: pwdForm.old_password, new_password: pwdForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      setPwdOk(true)
      setPwdForm({ old_password: '', new_password: '', confirm: '' })
      showToast('Mot de passe modifié avec succès')
    } catch (e) { setPwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingPwd(false) }
  }

  // ── Helpers affichage ─────────────────────────────────────────────────────
  const getRoleColor = (role: string) => role === 'admin' ? '#ef4444' : '#0082f0'
  const getRoleBg    = (role: string) => role === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(0,130,240,0.12)'
  const getRoleLabel = (role: string) => role === 'admin' ? 'Administrateur' : 'Opérateur'

  const initials = (name: string) =>
    name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  const fmtDate = (s: string | null) => {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const pwdStrength = (p: string) => {
    if (!p) return null
    if (p.length < 6) return { label: 'Trop court', color: '#ef4444', w: '25%' }
    if (p.length < 8) return { label: 'Faible', color: '#f59e0b', w: '45%' }
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[!@#$]/.test(p)) return { label: 'Fort', color: '#16a34a', w: '100%' }
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) return { label: 'Moyen', color: '#0082f0', w: '70%' }
    return { label: 'Faible', color: '#f59e0b', w: '45%' }
  }

  const strength = pwdStrength(pwdForm.new_password)

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: subCol, fontSize: '14px' }}>
        Chargement du profil...
      </div>
    </DashboardLayout>
  )

  if (!profile) return null

  return (
    <DashboardLayout>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .profile-input:focus { border-color: #0082f0 !important; box-shadow: 0 0 0 3px rgba(0,130,240,0.12); }
        .pwd-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#7a9bc5; display:flex; align-items:center; padding:0; }
        .pwd-eye:hover { color: #0082f0; }
      `}</style>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,130,240,0.12)', border: '1px solid rgba(0,130,240,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} style={{ color: '#0082f0' }} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: titleCol, margin: 0 }}>Mon Profil</h1>
        </div>
        <p style={{ color: subCol, fontSize: '13px', margin: 0, paddingLeft: '46px' }}>
          Gérez vos informations personnelles et la sécurité de votre compte
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp 0.4s ease 0.05s both' }}>

          {/* Card avatar */}
          <div style={{
            background: isDark ? 'rgba(26,29,46,0.97)' : 'white',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,130,240,0.15)'}`,
            borderRadius: '16px', padding: '28px 24px', textAlign: 'center',
            boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,130,240,0.07)',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: avatarPreview ? 'transparent' : `linear-gradient(135deg, #0055cc, #0082f0)`,
                border: '3px solid rgba(0,130,240,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', margin: '0 auto',
                boxShadow: '0 4px 20px rgba(0,130,240,0.25)',
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '32px', fontWeight: 700, color: 'white', letterSpacing: '-1px' }}>{initials(profile.full_name || profile.username)}</span>
                }
              </div>
              {/* Bouton appareil photo */}
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: '#0082f0', border: '2px solid white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)', transition: 'transform 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                title="Changer la photo"
              >
                <Camera size={13} color="white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Nom et rôle */}
            <div style={{ fontSize: '17px', fontWeight: 700, color: titleCol, marginBottom: '4px' }}>
              {profile.full_name || profile.username}
            </div>
            <div style={{ fontSize: '12px', color: subCol, marginBottom: '12px', fontFamily: 'monospace' }}>
              @{profile.username}
            </div>
            <span style={{
              display: 'inline-block',
              background: getRoleBg(profile.role),
              color: getRoleColor(profile.role),
              border: `1px solid ${getRoleColor(profile.role)}44`,
              borderRadius: '20px', padding: '4px 14px',
              fontSize: '12px', fontWeight: 700,
            }}>
              {getRoleLabel(profile.role)}
            </span>

            {/* Boutons avatar */}
            {avatarPreview && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                <button
                  onClick={handleSaveAvatar}
                  disabled={savingAvatar}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: '#0082f0', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Save size={12} />{savingAvatar ? '...' : 'Sauvegarder'}
                </button>
                <button
                  onClick={handleRemoveAvatar}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <X size={12} />Supprimer
                </button>
              </div>
            )}
            {!avatarPreview && (
              <button
                onClick={() => fileRef.current?.click()}
                style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'transparent', color: '#0082f0', border: '1px solid rgba(0,130,240,0.35)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Camera size={13} />Ajouter une photo
              </button>
            )}
          </div>

          {/* Card infos compte */}
          <SectionCard title="Informations du compte" icon={<Shield size={15} color="#0082f0" />} isDark={isDark}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: <Shield size={13} />, label: 'Rôle', value: getRoleLabel(profile.role), color: getRoleColor(profile.role) },
                { icon: <Calendar size={13} />, label: 'Membre depuis', value: fmtDate(profile.created_at), color: text2Col },
                { icon: <Clock size={13} />, label: 'Dernière connexion', value: fmtDate(profile.last_login), color: text2Col },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: '9px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,130,240,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: subCol, fontSize: '12px' }}>
                    {item.icon}{item.label}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
              {profile.role === 'operator' && profile.expires_at && (
                <div style={{
                  padding: '10px 12px', borderRadius: '9px',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '3px' }}>⏳ Compte limité</div>
                  <div style={{ fontSize: '12px', color: text2Col }}>Expire le {fmtDate(profile.expires_at)}</div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp 0.4s ease 0.1s both' }}>

          {/* ── Informations personnelles ── */}
          <SectionCard title="Informations personnelles" icon={<User size={15} color="#0082f0" />} isDark={isDark}>
            {!editMode ? (
              /* Vue lecture */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  {[
                    { icon: <User size={13} />, label: 'Nom complet', value: profile.full_name || '—' },
                    { icon: <Mail size={13} />, label: 'Adresse email', value: profile.email || '—' },
                  ].map(f => (
                    <div key={f.label} style={{
                      padding: '14px 16px', borderRadius: '10px',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,130,240,0.04)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,130,240,0.1)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subCol, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
                        {f.icon}{f.label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: titleCol }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '9px', background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.3)', color: '#0082f0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Pencil size={13} />Modifier mes informations
                </button>
              </div>
            ) : (
              /* Mode édition */
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Nom complet *</label>
                    <input
                      className="profile-input"
                      style={inputS}
                      placeholder="Votre nom"
                      value={infoForm.full_name}
                      onChange={e => setInfoForm(p => ({ ...p, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Adresse email</label>
                    <input
                      className="profile-input"
                      style={inputS}
                      type="email"
                      placeholder="votre@email.com"
                      value={infoForm.email}
                      onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
                {infoErr && (
                  <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <AlertCircle size={13} />{infoErr}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditMode(false); setInfoErr(''); setInfoForm({ full_name: profile.full_name || '', email: profile.email || '' }) }}
                    style={{ padding: '9px 18px', borderRadius: '9px', background: 'transparent', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`, color: subCol, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={savingInfo}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '9px', background: '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Save size={13} />{savingInfo ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Changer mot de passe ── */}
          <SectionCard title="Sécurité — Mot de passe" icon={<KeyRound size={15} color="#0082f0" />} isDark={isDark}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              {/* Ancien */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Mot de passe actuel</label>
                <div style={{ position: 'relative' }}>
                  <input className="profile-input" style={{ ...inputS, paddingRight: '38px' }} type={showOld ? 'text' : 'password'} placeholder="••••••••" value={pwdForm.old_password} onChange={e => setPwdForm(p => ({ ...p, old_password: e.target.value }))} />
                  <button className="pwd-eye" onClick={() => setShowOld(p => !p)}>{showOld ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
              </div>
              {/* Nouveau */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input className="profile-input" style={{ ...inputS, paddingRight: '38px' }} type={showNew ? 'text' : 'password'} placeholder="••••••••" value={pwdForm.new_password} onChange={e => setPwdForm(p => ({ ...p, new_password: e.target.value }))} />
                  <button className="pwd-eye" onClick={() => setShowNew(p => !p)}>{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {/* Barre force */}
                {strength && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ height: '3px', borderRadius: '99px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: strength.w, background: strength.color, transition: 'width 0.4s, background 0.3s', borderRadius: '99px' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: strength.color, fontWeight: 600, marginTop: '3px' }}>{strength.label}</div>
                  </div>
                )}
              </div>
              {/* Confirmer */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: subCol, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Confirmer</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="profile-input"
                    style={{
                      ...inputS, paddingRight: '38px',
                      ...(pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm ? { borderColor: 'rgba(239,68,68,0.6)' } : {}),
                      ...(pwdForm.confirm && pwdForm.new_password === pwdForm.confirm && pwdForm.confirm.length > 0 ? { borderColor: 'rgba(22,163,74,0.6)' } : {}),
                    }}
                    type={showConf ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwdForm.confirm}
                    onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
                  />
                  <button className="pwd-eye" onClick={() => setShowConf(p => !p)}>{showConf ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                </div>
                {pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm && (
                  <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px', fontWeight: 600 }}>Ne correspond pas</div>
                )}
                {pwdForm.confirm && pwdForm.new_password === pwdForm.confirm && pwdForm.confirm.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '3px', fontWeight: 600 }}>✓ Correspond</div>
                )}
              </div>
            </div>

            {pwdErr && (
              <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <AlertCircle size={13} />{pwdErr}
              </div>
            )}
            {pwdOk && (
              <div style={{ padding: '9px 13px', borderRadius: '8px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <CheckCircle size={13} />Mot de passe modifié avec succès
              </div>
            )}

            <button
              onClick={handleChangePwd}
              disabled={savingPwd}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', borderRadius: '9px', background: savingPwd ? '#6b7280' : '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: savingPwd ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              <KeyRound size={13} />{savingPwd ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </SectionCard>

          {/* ── Historique de connexions ── */}
          <SectionCard title="Activité récente" icon={<LogIn size={15} color="#0082f0" />} isDark={isDark}>
            {loadingHist ? (
              <div style={{ color: subCol, fontSize: '13px', padding: '10px 0' }}>Chargement...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: subCol, fontSize: '13px' }}>
                <LogIn size={28} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                Aucune activité enregistrée
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '12px 0',
                    borderBottom: i < history.length - 1 ? `1px solid ${divider}` : 'none',
                  }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogIn size={12} color="#0082f0" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: titleCol, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.question}
                      </div>
                      <div style={{ fontSize: '11px', color: subCol, marginTop: '2px' }}>
                        {fmtDate(h.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>
      </div>
    </DashboardLayout>
  )
}