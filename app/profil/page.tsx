'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import {
  User, Mail, Shield, Calendar, Clock, Camera, KeyRound,
  Save, Eye, EyeOff, CheckCircle, AlertCircle, Pencil, X,
  ChevronDown, ChevronUp, Activity, Bell, BellOff, Globe,
  Sun, Moon, Zap, AlertTriangle, Server, Network, LogIn,
  Lock, Unlock, Trash2, BadgeCheck, Settings,
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
}

interface HistoryEntry { created_at: string; question: string }

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px', borderRadius: '12px',
      background: ok ? '#16a34a' : '#dc2626',
      color: 'white', fontSize: '13px', fontWeight: 600,
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    }}>
      {ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{msg}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '42px', height: '24px', borderRadius: '12px', cursor: 'pointer',
        background: checked ? '#0082f0' : 'rgba(0,0,0,0.15)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: checked ? '21px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: 'white', transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

export default function ProfilPage() {
  const isDark = useIsDark()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  const bg      = isDark ? '#0b1220' : '#f0f6ff'
  const card    = isDark ? 'rgba(15,24,40,0.95)' : 'white'
  const border  = isDark ? 'rgba(0,130,240,0.15)' : 'rgba(0,130,240,0.12)'
  const title   = isDark ? '#e8f4ff' : '#0a1628'
  const sub     = isDark ? '#6a8aaa' : '#6b7280'
  const text2   = isDark ? '#8899aa' : '#4a6a8a'
  const inputBg = isDark ? '#131c2e' : '#f8faff'
  const inputBd = isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.2)'
  const inputCl = isDark ? '#e8f4ff' : '#0a1628'

  const inputS: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '9px',
    fontSize: '13px', outline: 'none', background: inputBg,
    color: inputCl, boxSizing: 'border-box',
    border: `1px solid ${inputBd}`, transition: 'border 0.2s',
  }

  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [history, setHistory]     = useState<HistoryEntry[]>([])
  const showToast = (msg: string, ok = true) => setToast({ msg, ok })

  const fileRef                                 = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar]                     = useState<string | null>(null)
  const [avatarOrig, setAvatarOrig]             = useState<string | null>(null)
  const [savingAvatar, setSavingAvatar]         = useState(false)
  const avatarChanged                           = avatar !== avatarOrig

  const [editMode, setEditMode]                 = useState(false)
  const [infoForm, setInfoForm]                 = useState({ full_name: '', email: '' })
  const [savingInfo, setSavingInfo]             = useState(false)
  const [infoErr, setInfoErr]                   = useState('')

  const [showPwd, setShowPwd]                   = useState(false)
  const [pwdForm, setPwdForm]                   = useState({ new_password: '', confirm: '' })
  const [showN, setShowN]                       = useState(false)
  const [showC, setShowC]                       = useState(false)
  const [savingPwd, setSavingPwd]               = useState(false)
  const [pwdErr, setPwdErr]                     = useState('')
  const [pwdOk, setPwdOk]                       = useState(false)

  const [notifEmail, setNotifEmail]             = useState(true)
  const [notifSms, setNotifSms]                 = useState(false)
  const [notifInternal, setNotifInternal]       = useState(true)
  const [dangerConfirm, setDangerConfirm]       = useState(false)

  const fetchProfile = async () => {
    try {
      const token = getCookie('ttcs_token')
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { router.push('/login'); return }
      const data: UserProfile = await res.json()
      setProfile(data)
      setInfoForm({ full_name: data.full_name || '', email: data.email || '' })
      const saved = localStorage.getItem(`avatar_${data.username}`)
      if (saved) { setAvatar(saved); setAvatarOrig(saved) }
    } catch { router.push('/login') }
    finally { setLoading(false) }
  }

  const fetchHistory = async () => {
    try {
      const token = getCookie('ttcs_token')
      const uc = getCookie('ttcs_user')
      if (!token || !uc) return
      const u = JSON.parse(uc)
      const res = await fetch(`${BASE_URL}/chat/history/${u.username}?limit=8`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setHistory(d.history || []) }
    } catch { /* silencieux */ }
  }

  useEffect(() => { fetchProfile(); fetchHistory() }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showToast('Image trop lourde (max 2 Mo)', false); return }
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSaveAvatar = () => {
    if (!avatar || !profile) return
    setSavingAvatar(true)
    setTimeout(() => {
      localStorage.setItem(`avatar_${profile.username}`, avatar)
      setAvatarOrig(avatar); setSavingAvatar(false)
      showToast('Photo mise à jour')
    }, 500)
  }

  const handleSaveInfo = async () => {
    if (!profile) return; setInfoErr('')
    if (!infoForm.full_name.trim()) { setInfoErr('Nom requis'); return }
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
      setProfile(prev => prev ? { ...prev, ...infoForm } : prev)
      setEditMode(false); showToast('Informations mises à jour')
    } catch (e) { setInfoErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingInfo(false) }
  }

  const handleChangePwd = async () => {
    setPwdErr(''); setPwdOk(false)
    if (!pwdForm.new_password) { setPwdErr('Mot de passe requis'); return }
    if (pwdForm.new_password.length < 6) { setPwdErr('Minimum 6 caractères'); return }
    if (pwdForm.new_password !== pwdForm.confirm) { setPwdErr('Ne correspondent pas'); return }
    setSavingPwd(true)
    try {
      const token = getCookie('ttcs_token')
      const res = await fetch(`${BASE_URL}/profile/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: pwdForm.new_password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      setPwdOk(true); setPwdForm({ new_password: '', confirm: '' })
      setShowPwd(false); showToast('Mot de passe modifié')
    } catch (e) { setPwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingPwd(false) }
  }

  const getRoleLabel  = (r: string) => r === 'admin' ? 'Administrateur' : 'Opérateur'
  const getRoleColor  = (r: string) => r === 'admin' ? '#ef4444' : '#0082f0'
  const getRoleBg     = (r: string) => r === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(0,130,240,0.1)'
  const initials      = (n: string) => n.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  const fmtDate       = (s: string | null) => s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  const fmtShort      = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const pwdStrength = (p: string) => {
    if (!p) return null
    if (p.length < 6) return { label: 'Trop court', color: '#ef4444', w: 20 }
    if (p.length < 8) return { label: 'Faible', color: '#f59e0b', w: 40 }
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[!@#$]/.test(p)) return { label: 'Fort', color: '#16a34a', w: 100 }
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) return { label: 'Moyen', color: '#0082f0', w: 65 }
    return { label: 'Faible', color: '#f59e0b', w: 40 }
  }
  const strength = pwdStrength(pwdForm.new_password)

  const modules = [
    { name: 'Tableau de bord', access: true,  color: '#0082f0' },
    { name: 'Noeuds',          access: true,  color: '#0099cc' },
    { name: 'Inventaire',      access: true,  color: '#a855f7' },
    { name: 'Monitoring',      access: true,  color: '#f97316' },
    { name: 'Prédiction',      access: true,  color: '#ec4899' },
    { name: 'Assistant IA',    access: true,  color: '#eab308' },
    { name: 'Administration',  access: profile?.role === 'admin', color: '#ef4444' },
  ]

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: sub }}>
        Chargement...
      </div>
    </DashboardLayout>
  )
  if (!profile) return null

  const cardStyle = (accent?: string): React.CSSProperties => ({
    background: card,
    border: `1px solid ${accent ? accent + '30' : border}`,
    borderRadius: '16px',
    boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,130,240,0.06)',
    overflow: 'hidden',
  })

  const sectionHeader = (label: string, icon: React.ReactNode, color = '#0082f0') => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '16px 20px',
      borderBottom: `1px solid ${border}`,
      background: isDark ? 'rgba(0,130,240,0.05)' : 'rgba(0,130,240,0.03)',
    }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: title, letterSpacing: '0.01em' }}>{label}</span>
    </div>
  )

  return (
    <DashboardLayout>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
      <style>{`
        .pi:focus { border-color: #0082f0 !important; box-shadow: 0 0 0 3px rgba(0,130,240,0.1); }
        .peye { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#7a9bc5;display:flex;padding:0; }
        .peye:hover { color:#0082f0; }
        .pcard-hover:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,130,240,0.12) !important; }
        .pcard-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .danger-btn:hover { opacity: 0.85; }
      `}</style>

      <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

        {/* ── HERO HEADER ── */}
        <div style={{
          ...cardStyle('#0082f0'),
          marginBottom: '20px',
          background: isDark
            ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)'
            : 'linear-gradient(135deg, #e8f2ff 0%, #f0f8ff 50%, #e4efff 100%)',
          position: 'relative',
        }}>
          {/* Accent bar top */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #0055cc, #0082f0, #00d4aa)', position: 'absolute', top: 0, left: 0, right: 0 }} />

          <div style={{ padding: '28px 28px 24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '84px', height: '84px', borderRadius: '50%',
                  background: avatar ? 'transparent' : 'linear-gradient(135deg, #0055cc, #0082f0)',
                  border: '3px solid rgba(0,130,240,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,130,240,0.3)',
                }}
              >
                {avatar
                  ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{initials(profile.full_name || profile.username)}</span>
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#0082f0', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
                title="Changer la photo"
              >
                <Camera size={12} color="white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Infos hero */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: title, margin: 0 }}>{profile.full_name || profile.username}</h1>
                {/* Badge statut en ligne */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
                  En ligne
                </span>
              </div>
              <div style={{ fontSize: '13px', color: sub, marginBottom: '10px', fontFamily: 'monospace' }}>@{profile.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', background: getRoleBg(profile.role), color: getRoleColor(profile.role), border: `1px solid ${getRoleColor(profile.role)}44`, fontSize: '12px', fontWeight: 700 }}>
                  {getRoleLabel(profile.role)}
                </span>
                <span style={{ fontSize: '12px', color: sub, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />Dernière connexion : {fmtDate(profile.last_login)}
                </span>
              </div>
            </div>

            {/* Boutons avatar si changé */}
            {avatarChanged && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSaveAvatar} disabled={savingAvatar}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <Save size={13} />{savingAvatar ? '...' : 'Sauvegarder'}
                </button>
                <button onClick={() => setAvatar(avatarOrig)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'transparent', color: sub, border: `1px solid ${border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <X size={13} />Annuler
                </button>
              </div>
            )}
            {avatarOrig && !avatarChanged && (
              <button onClick={() => { setAvatar(null); setAvatarOrig(null); profile && localStorage.removeItem(`avatar_${profile.username}`); showToast('Photo supprimée') }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <X size={12} />Supprimer photo
              </button>
            )}
          </div>
        </div>

        {/* ── GRILLE PRINCIPALE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* ── Informations personnelles ── */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader('Informations personnelles', <User size={14} color="#0082f0" />)}
            <div style={{ padding: '20px' }}>
              {!editMode ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { icon: <User size={12} />, label: 'Nom complet', value: profile.full_name || '—' },
                      { icon: <Mail size={12} />, label: 'Email', value: profile.email || '—' },
                      { icon: <Calendar size={12} />, label: 'Membre depuis', value: fmtDate(profile.created_at) },
                      { icon: <Clock size={12} />, label: 'Dernière connexion', value: fmtDate(profile.last_login) },
                    ].map(f => (
                      <div key={f.label} style={{ padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,130,240,0.04)', border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: sub, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{f.icon}{f.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEditMode(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.3)', color: '#0082f0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <Pencil size={13} />Modifier
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Nom complet *</label>
                      <input className="pi" style={inputS} value={infoForm.full_name} onChange={e => setInfoForm(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>Email</label>
                      <input className="pi" style={inputS} type="email" value={infoForm.email} onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  {infoErr && <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={12} />{infoErr}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditMode(false); setInfoErr('') }} style={{ padding: '8px 16px', borderRadius: '9px', background: 'transparent', border: `1px solid ${border}`, color: sub, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleSaveInfo} disabled={savingInfo} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      <Save size={13} />{savingInfo ? '...' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Rôles & Permissions ── */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader('Rôles & Permissions', <BadgeCheck size={14} color="#a855f7" />, '#a855f7')}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: '14px' }}>
                <Shield size={16} color="#a855f7" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: title }}>{getRoleLabel(profile.role)}</div>
                  <div style={{ fontSize: '11px', color: sub }}>Accès {profile.role === 'admin' ? 'complet' : 'limité'} à la plateforme</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Modules accessibles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {modules.map(m => (
                  <span key={m.name} style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: m.access ? `${m.color}15` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: m.access ? m.color : sub,
                    border: `1px solid ${m.access ? m.color + '35' : border}`,
                    opacity: m.access ? 1 : 0.5,
                  }}>
                    {m.access ? '✓' : '✗'} {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── LIGNE 2 : Sécurité + Préférences ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* ── Sécurité ── */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader('Sécurité du compte', <Lock size={14} color="#f59e0b" />, '#f59e0b')}
            <div style={{ padding: '20px' }}>
              {/* Niveau de sécurité */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: title }}>Niveau de sécurité</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>Moyen</span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '60%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '99px' }} />
                </div>
                <div style={{ fontSize: '11px', color: sub, marginTop: '5px' }}>Activez le 2FA pour améliorer la sécurité</div>
              </div>

              {/* Bouton modifier mot de passe */}
              <button
                onClick={() => { setShowPwd(p => !p); setPwdErr(''); setPwdOk(false); setPwdForm({ new_password: '', confirm: '' }) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'transparent', border: `1px solid ${border}`, color: title, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><KeyRound size={14} color="#0082f0" />Modifier le mot de passe</span>
                {showPwd ? <ChevronUp size={14} color={sub} /> : <ChevronDown size={14} color={sub} />}
              </button>

              {showPwd && (
                <div style={{ padding: '14px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,130,240,0.03)', border: `1px solid ${border}`, marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Nouveau</label>
                      <div style={{ position: 'relative' }}>
                        <input className="pi" style={{ ...inputS, paddingRight: '36px', fontSize: '12px', padding: '8px 36px 8px 12px' }} type={showN ? 'text' : 'password'} placeholder="••••••••" value={pwdForm.new_password} onChange={e => setPwdForm(p => ({ ...p, new_password: e.target.value }))} />
                        <button className="peye" onClick={() => setShowN(p => !p)}>{showN ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      </div>
                      {strength && (
                        <div style={{ marginTop: '5px' }}>
                          <div style={{ height: '3px', borderRadius: '99px', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${strength.w}%`, background: strength.color, borderRadius: '99px', transition: 'width 0.3s' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: strength.color, fontWeight: 600, marginTop: '2px' }}>{strength.label}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Confirmer</label>
                      <div style={{ position: 'relative' }}>
                        <input className="pi" style={{ ...inputS, paddingRight: '36px', fontSize: '12px', padding: '8px 36px 8px 12px', ...(pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }} type={showC ? 'text' : 'password'} placeholder="••••••••" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
                        <button className="peye" onClick={() => setShowC(p => !p)}>{showC ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      </div>
                      {pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>Ne correspond pas</div>}
                    </div>
                  </div>
                  {pwdErr && <div style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', marginBottom: '10px' }}>{pwdErr}</div>}
                  {pwdOk  && <div style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontSize: '11px', marginBottom: '10px' }}>Mot de passe modifié ✓</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowPwd(false)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${border}`, color: sub, fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleChangePwd} disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: '#0082f0', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <KeyRound size={12} />{savingPwd ? '...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color="#10b981" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>Auth. 2 facteurs</div>
                    <div style={{ fontSize: '11px', color: sub }}>Sécurité renforcée</div>
                  </div>
                </div>
                <Toggle checked={false} onChange={() => showToast('2FA disponible prochainement', false)} />
              </div>
            </div>
          </div>

          {/* ── Préférences ── */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader('Préférences', <Settings size={14} color="#00d4aa" />, '#00d4aa')}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Thème */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isDark ? <Moon size={14} color="#a855f7" /> : <Sun size={14} color="#f59e0b" />}
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>Mode sombre</div>
                      <div style={{ fontSize: '11px', color: sub }}>{isDark ? 'Activé' : 'Désactivé'}</div>
                    </div>
                  </div>
                  <Toggle checked={isDark} onChange={v => setTheme(v ? 'dark' : 'light')} />
                </div>

                {/* Langue */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} color="#0082f0" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>Langue</div>
                      <div style={{ fontSize: '11px', color: sub }}>Français</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: sub, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '6px' }}>FR</span>
                </div>

                {/* Notifications */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Notifications</div>
                  {[
                    { label: 'Email', sub: 'Alertes critiques par email', val: notifEmail, set: setNotifEmail, icon: <Mail size={13} color="#0082f0" /> },
                    { label: 'SMS', sub: 'Messages urgents', val: notifSms, set: setNotifSms, icon: <Bell size={13} color="#a855f7" /> },
                    { label: 'Internes', sub: 'Notifications plateforme', val: notifInternal, set: setNotifInternal, icon: <Activity size={13} color="#00d4aa" /> },
                  ].map(n => (
                    <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {n.icon}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: title }}>{n.label}</div>
                          <div style={{ fontSize: '10px', color: sub }}>{n.sub}</div>
                        </div>
                      </div>
                      <Toggle checked={n.val} onChange={n.set} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Activité récente ── */}
        <div style={{ ...cardStyle(), marginBottom: '16px' }} className="pcard-hover">
          {sectionHeader('Activité récente', <Activity size={14} color="#0082f0" />)}
          <div style={{ padding: '16px 20px' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: sub, fontSize: '13px' }}>Aucune activité enregistrée</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                {history.slice(0, 6).map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,130,240,0.03)', border: `1px solid ${border}` }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogIn size={12} color="#0082f0" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: title, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.question}</div>
                      <div style={{ fontSize: '11px', color: sub, marginTop: '2px' }}>{fmtShort(h.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Zone de danger ── */}
        <div style={{ ...cardStyle('#ef4444'), border: '1px solid rgba(239,68,68,0.2)' }}>
          {sectionHeader('Zone de danger', <AlertTriangle size={14} color="#ef4444" />, '#ef4444')}
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: sub, marginBottom: '16px', lineHeight: 1.5 }}>
              Les actions suivantes sont irréversibles. Procédez avec précaution.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { if (!dangerConfirm) { setDangerConfirm(true); showToast('Cliquez à nouveau pour confirmer', false) } else { showToast('Fonctionnalité non disponible', false); setDangerConfirm(false) } }}
                className="danger-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', background: dangerConfirm ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', color: '#ef4444', border: `1px solid ${dangerConfirm ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.25)'}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Lock size={13} />{dangerConfirm ? 'Confirmer la désactivation' : 'Désactiver le compte'}
              </button>
              <button
                onClick={() => showToast('Demande de suppression non disponible', false)}
                className="danger-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Trash2 size={13} />Supprimer le compte
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}