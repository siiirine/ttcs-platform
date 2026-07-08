'use client'

import { useEffect, useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useLang } from '@/lib/language-context'
import {
  User, Mail, Shield, Calendar, Clock, Camera, KeyRound,
  Save, Eye, EyeOff, CheckCircle, AlertCircle, Pencil, X,
  ChevronDown, ChevronUp, Activity, Bell, Globe,
  AlertTriangle, LogIn,
  Lock, Trash2, BadgeCheck, Settings,
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
  twofa_enabled?: boolean
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
    <div onClick={() => onChange(!checked)} style={{
      width: '42px', height: '24px', borderRadius: '12px', cursor: 'pointer',
      background: checked ? '#0082f0' : 'rgba(0,0,0,0.15)',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}>
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
  const { lang, setLang, t } = useLang()

  const card    = isDark ? 'rgba(15,24,40,0.95)' : 'white'
  const border  = isDark ? 'rgba(0,130,240,0.15)' : 'rgba(0,130,240,0.12)'
  const title   = isDark ? '#e8f4ff' : '#0a1628'
  const sub     = isDark ? '#6a8aaa' : '#6b7280'
  const inputBg = isDark ? '#131c2e' : '#f8faff'
  const inputBd = isDark ? 'rgba(0,130,240,0.2)' : 'rgba(0,130,240,0.2)'
  const inputCl = isDark ? '#e8f4ff' : '#0a1628'

  const inputS: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '9px',
    fontSize: '13px', outline: 'none', background: inputBg,
    color: inputCl, boxSizing: 'border-box',
    border: `1px solid ${inputBd}`, transition: 'border 0.2s',
  }

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [history, setHistory]   = useState<HistoryEntry[]>([])
  const showToast = (msg: string, ok = true) => setToast({ msg, ok })

  const fileRef                           = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar]               = useState<string | null>(null)
  const [avatarOrig, setAvatarOrig]       = useState<string | null>(null)
  const [savingAvatar, setSavingAvatar]   = useState(false)
  const avatarChanged                     = avatar !== avatarOrig

  const [editMode, setEditMode]           = useState(false)
  const [infoForm, setInfoForm]           = useState({ full_name: '', email: '' })
  const [savingInfo, setSavingInfo]       = useState(false)
  const [infoErr, setInfoErr]             = useState('')

  const [showPwd, setShowPwd]             = useState(false)
  const [pwdForm, setPwdForm]             = useState({ new_password: '', confirm: '' })
  const [showN, setShowN]                 = useState(false)
  const [showC, setShowC]                 = useState(false)
  const [savingPwd, setSavingPwd]         = useState(false)
  const [pwdErr, setPwdErr]               = useState('')
  const [pwdOk, setPwdOk]                 = useState(false)

  const [notifEmail, setNotifEmail]       = useState(true)
  const [notifSms, setNotifSms]           = useState(false)
  const [notifInternal, setNotifInternal] = useState(true)
  const [dangerConfirm, setDangerConfirm] = useState(false)

  // ── 2FA states ───────────────────────────────────────────────
  const [twoFaEnabled, setTwoFaEnabled]   = useState(false)
  const [twoFaLoading, setTwoFaLoading]   = useState(false)

  const fetchProfile = async () => {
    try {
      const token = getCookie('ttcs_token')
      if (!token) { router.push('/login'); return }
      const res = await fetch(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { router.push('/login'); return }
      const data: UserProfile = await res.json()
      setProfile(data)
      setInfoForm({ full_name: data.full_name || '', email: data.email || '' })
      setTwoFaEnabled(data.twofa_enabled || false)
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
    if (file.size > 2 * 1024 * 1024) { showToast(t('profile', 'tooBig'), false); return }
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
      showToast(t('profile', 'photoUpdated'))
    }, 500)
  }

  const handleSaveInfo = async () => {
    if (!profile) return; setInfoErr('')
    if (!infoForm.full_name.trim()) { setInfoErr(t('profile', 'nameRequired')); return }
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
      setEditMode(false); showToast(t('profile', 'infoUpdated'))
    } catch (e) { setInfoErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingInfo(false) }
  }

  const handleChangePwd = async () => {
    setPwdErr(''); setPwdOk(false)
    if (!pwdForm.new_password) { setPwdErr(t('profile', 'nameRequired')); return }
    if (pwdForm.new_password.length < 6) { setPwdErr(t('profile', 'min6')); return }
    if (pwdForm.new_password !== pwdForm.confirm) { setPwdErr(t('profile', 'noMatch')); return }
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
      setShowPwd(false); showToast(t('profile', 'passwordChanged'))
    } catch (e) { setPwdErr(e instanceof Error ? e.message : 'Erreur') }
    finally { setSavingPwd(false) }
  }

  // ── Toggle 2FA ───────────────────────────────────────────────
  const handleToggle2FA = async (enabled: boolean) => {
    if (!profile?.email) {
      showToast('Configurez un email avant d\'activer le 2FA', false)
      return
    }
    setTwoFaLoading(true)
    try {
      const token = getCookie('ttcs_token')
      const res = await fetch(`${BASE_URL}/auth/toggle-2fa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur')
      setTwoFaEnabled(enabled)
      showToast(
        enabled
          ? `2FA activé ! Code de test envoyé à ${profile.email}`
          : '2FA désactivé',
        true
      )
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Erreur 2FA', false)
    } finally {
      setTwoFaLoading(false)
    }
  }

  const getRoleLabel = (r: string) => r === 'admin' ? t('profile', 'admin') : t('profile', 'operator')
  const getRoleColor = (r: string) => r === 'admin' ? '#ef4444' : '#0082f0'
  const getRoleBg    = (r: string) => r === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(0,130,240,0.1)'
  const initials     = (n: string) => n.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
  const fmtDate      = (s: string | null) => s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  const fmtShort     = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const pwdStrength = (p: string) => {
    if (!p) return null
    if (p.length < 6) return { label: t('profile', 'tooShort'), color: '#ef4444', w: 20 }
    if (p.length < 8) return { label: t('profile', 'weak'),     color: '#f59e0b', w: 40 }
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[!@#$]/.test(p)) return { label: t('profile', 'strong'), color: '#16a34a', w: 100 }
    if (/[A-Z]/.test(p) || /[0-9]/.test(p)) return { label: t('profile', 'medium2'), color: '#0082f0', w: 65 }
    return { label: t('profile', 'weak'), color: '#f59e0b', w: 40 }
  }
  const strength = pwdStrength(pwdForm.new_password)

  const modules = [
    { name: t('nav', 'dashboard'),      access: true,                    color: '#0082f0' },
    { name: t('nav', 'nodes'),          access: true,                    color: '#0099cc' },
    { name: t('nav', 'inventory'),      access: true,                    color: '#a855f7' },
    { name: t('nav', 'monitoring'),     access: true,                    color: '#f97316' },
    { name: t('nav', 'prediction'),     access: true,                    color: '#ec4899' },
    { name: t('nav', 'assistant'),      access: true,                    color: '#eab308' },
    { name: t('nav', 'administration'), access: profile?.role === 'admin', color: '#ef4444' },
  ]

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: sub }}>
        {t('profile', 'loading')}
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
      padding: '16px 20px', borderBottom: `1px solid ${border}`,
      background: isDark ? 'rgba(0,130,240,0.05)' : 'rgba(0,130,240,0.03)',
    }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: title }}>{label}</span>
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ padding: '24px 28px', maxWidth: '1200px' }}>

        {/* ── HERO ── */}
        <div style={{
          ...cardStyle('#0082f0'), marginBottom: '20px',
          background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)' : 'linear-gradient(135deg, #e8f2ff 0%, #f0f8ff 50%, #e4efff 100%)',
          position: 'relative',
        }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #0055cc, #0082f0, #00d4aa)', position: 'absolute', top: 0, left: 0, right: 0 }} />
          <div style={{ padding: '28px 28px 24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div onClick={() => fileRef.current?.click()} style={{ width: '84px', height: '84px', borderRadius: '50%', background: avatar ? 'transparent' : 'linear-gradient(135deg, #0055cc, #0082f0)', border: '3px solid rgba(0,130,240,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,130,240,0.3)' }}>
                {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{initials(profile.full_name || profile.username)}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#0082f0', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={12} color="white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: title, margin: 0 }}>{profile.full_name || profile.username}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
                  {t('profile', 'online')}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: sub, marginBottom: '10px', fontFamily: 'monospace' }}>@{profile.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', background: getRoleBg(profile.role), color: getRoleColor(profile.role), border: `1px solid ${getRoleColor(profile.role)}44`, fontSize: '12px', fontWeight: 700 }}>
                  {getRoleLabel(profile.role)}
                </span>
                <span style={{ fontSize: '12px', color: sub, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />{t('profile', 'lastLogin')} {fmtDate(profile.last_login)}
                </span>
              </div>
            </div>

            {avatarChanged && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSaveAvatar} disabled={savingAvatar} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <Save size={13} />{savingAvatar ? '...' : t('profile', 'savePhoto')}
                </button>
                <button onClick={() => setAvatar(avatarOrig)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'transparent', color: sub, border: `1px solid ${border}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <X size={13} />{t('profile', 'cancelPhoto')}
                </button>
              </div>
            )}
            {avatarOrig && !avatarChanged && (
              <button onClick={() => { setAvatar(null); setAvatarOrig(null); profile && localStorage.removeItem(`avatar_${profile.username}`); showToast(t('profile', 'photoRemoved')) }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <X size={12} />{t('profile', 'removePhoto')}
              </button>
            )}
          </div>
        </div>

        {/* ── LIGNE 1 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Informations personnelles */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader(t('profile', 'personalInfo'), <User size={14} color="#0082f0" />)}
            <div style={{ padding: '20px' }}>
              {!editMode ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { icon: <User size={12} />,     label: t('profile', 'fullName'),      value: profile.full_name || '—' },
                      { icon: <Mail size={12} />,     label: t('profile', 'email'),          value: profile.email || '—' },
                      { icon: <Calendar size={12} />, label: t('profile', 'memberSince'),    value: fmtDate(profile.created_at) },
                      { icon: <Clock size={12} />,    label: t('profile', 'lastConnection'), value: fmtDate(profile.last_login) },
                    ].map(f => (
                      <div key={f.label} style={{ padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,130,240,0.04)', border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: sub, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{f.icon}{f.label}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setEditMode(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: 'rgba(0,130,240,0.1)', border: '1px solid rgba(0,130,240,0.3)', color: '#0082f0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <Pencil size={13} />{t('profile', 'modify')}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>{t('profile', 'fullNameLabel')}</label>
                      <input className="pi" style={inputS} value={infoForm.full_name} onChange={e => setInfoForm(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>{t('profile', 'emailLabel')}</label>
                      <input className="pi" style={inputS} type="email" value={infoForm.email} onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                  </div>
                  {infoErr && <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={12} />{infoErr}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditMode(false); setInfoErr('') }} style={{ padding: '8px 16px', borderRadius: '9px', background: 'transparent', border: `1px solid ${border}`, color: sub, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{t('profile', 'cancel')}</button>
                    <button onClick={handleSaveInfo} disabled={savingInfo} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: '#0082f0', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                      <Save size={13} />{savingInfo ? t('profile', 'saving') : t('profile', 'save')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rôles & Permissions */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader(t('profile', 'rolesPermissions'), <BadgeCheck size={14} color="#a855f7" />, '#a855f7')}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: '14px' }}>
                <Shield size={16} color="#a855f7" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: title }}>{getRoleLabel(profile.role)}</div>
                  <div style={{ fontSize: '11px', color: sub }}>{t('profile', 'accessTo')} {profile.role === 'admin' ? t('profile', 'fullAccess') : t('profile', 'limitedAccess')} {t('profile', 'platform')}</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{t('profile', 'accessibleModules')}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {modules.map(m => (
                  <span key={m.name} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: m.access ? `${m.color}15` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: m.access ? m.color : sub, border: `1px solid ${m.access ? m.color + '35' : border}`, opacity: m.access ? 1 : 0.5 }}>
                    {m.access ? '✓' : '✗'} {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── LIGNE 2 : Sécurité + Préférences ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Sécurité */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader(t('profile', 'security'), <Lock size={14} color="#f59e0b" />, '#f59e0b')}
            <div style={{ padding: '20px' }}>
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: title }}>{t('profile', 'securityLevel')}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: twoFaEnabled ? '#16a34a' : '#f59e0b' }}>
                    {twoFaEnabled ? 'Élevé' : t('profile', 'medium')}
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: twoFaEnabled ? '90%' : '60%', background: twoFaEnabled ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '99px', transition: 'all 0.4s' }} />
                </div>
                <div style={{ fontSize: '11px', color: sub, marginTop: '5px' }}>
                  {twoFaEnabled ? '✅ 2FA actif — sécurité renforcée' : t('profile', 'enable2FA')}
                </div>
              </div>

              <button onClick={() => { setShowPwd(p => !p); setPwdErr(''); setPwdOk(false); setPwdForm({ new_password: '', confirm: '' }) }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'transparent', border: `1px solid ${border}`, color: title, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><KeyRound size={14} color="#0082f0" />{t('profile', 'modifyPassword')}</span>
                {showPwd ? <ChevronUp size={14} color={sub} /> : <ChevronDown size={14} color={sub} />}
              </button>

              {showPwd && (
                <div style={{ padding: '14px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,130,240,0.03)', border: `1px solid ${border}`, marginBottom: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{t('profile', 'newPassword')}</label>
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
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>{t('profile', 'confirm')}</label>
                      <div style={{ position: 'relative' }}>
                        <input className="pi" style={{ ...inputS, paddingRight: '36px', fontSize: '12px', padding: '8px 36px 8px 12px', ...(pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }} type={showC ? 'text' : 'password'} placeholder="••••••••" value={pwdForm.confirm} onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))} />
                        <button className="peye" onClick={() => setShowC(p => !p)}>{showC ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                      </div>
                      {pwdForm.confirm && pwdForm.new_password !== pwdForm.confirm && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>{t('profile', 'noMatch')}</div>}
                      {pwdForm.confirm && pwdForm.new_password === pwdForm.confirm && pwdForm.confirm.length > 0 && <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '2px' }}>{t('profile', 'matches')}</div>}
                    </div>
                  </div>
                  {pwdErr && <div style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', marginBottom: '10px' }}>{pwdErr}</div>}
                  {pwdOk  && <div style={{ padding: '7px 10px', borderRadius: '7px', background: 'rgba(22,163,74,0.1)', color: '#16a34a', fontSize: '11px', marginBottom: '10px' }}>{t('profile', 'pwdModified')}</div>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowPwd(false)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'transparent', border: `1px solid ${border}`, color: sub, fontSize: '12px', cursor: 'pointer' }}>{t('profile', 'cancel')}</button>
                    <button onClick={handleChangePwd} disabled={savingPwd} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: '#0082f0', color: 'white', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      <KeyRound size={12} />{savingPwd ? '...' : t('profile', 'save')}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Auth. 2 facteurs — FONCTIONNEL ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${twoFaEnabled ? 'rgba(16,185,129,0.3)' : border}`, background: twoFaEnabled ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)') : 'transparent', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={14} color={twoFaEnabled ? '#10b981' : '#6b7280'} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>
                      {t('profile', 'twoFactor')}
                    </div>
                    <div style={{ fontSize: '11px', color: sub }}>
                      {twoFaEnabled
                        ? `✅ Actif — code envoyé à ${profile?.email}`
                        : profile?.email
                        ? t('profile', 'twoFactorSub')
                        : '⚠️ Ajoutez un email pour activer le 2FA'}
                    </div>
                  </div>
                </div>
                {twoFaLoading
                  ? <div style={{ width: '42px', height: '24px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #0082f0', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  : <Toggle checked={twoFaEnabled} onChange={handleToggle2FA} />
                }
              </div>
            </div>
          </div>

          {/* Préférences */}
          <div style={cardStyle()} className="pcard-hover">
            {sectionHeader(t('profile', 'preferences'), <Settings size={14} color="#00d4aa" />, '#00d4aa')}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe size={14} color="#0082f0" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: title }}>{t('profile', 'language')}</div>
                      <div style={{ fontSize: '11px', color: sub }}>{lang === 'fr' ? t('profile', 'french') : t('profile', 'english')}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['fr', 'en'] as const).map(l => (
                      <button key={l} onClick={() => setLang(l)} style={{
                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                        fontWeight: lang === l ? 700 : 500, cursor: 'pointer', border: 'none',
                        background: lang === l ? '#0082f0' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                        color: lang === l ? 'white' : sub, transition: 'all 0.2s',
                      }}>
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{t('profile', 'notifications')}</div>
                  {[
                    { label: t('profile','notifEmail'),    subLabel: t('profile','notifEmailSub'),    val: notifEmail,    set: setNotifEmail,    icon: <Mail size={13} color="#0082f0" /> },
                    { label: t('profile','notifSms'),      subLabel: t('profile','notifSmsSub'),      val: notifSms,      set: setNotifSms,      icon: <Bell size={13} color="#a855f7" /> },
                    { label: t('profile','notifInternal'), subLabel: t('profile','notifInternalSub'), val: notifInternal, set: setNotifInternal, icon: <Activity size={13} color="#00d4aa" /> },
                  ].map(n => (
                    <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        {n.icon}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: title }}>{n.label}</div>
                          <div style={{ fontSize: '10px', color: sub }}>{n.subLabel}</div>
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
          {sectionHeader(t('profile', 'recentActivity'), <Activity size={14} color="#0082f0" />)}
          <div style={{ padding: '16px 20px' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: sub, fontSize: '13px' }}>{t('profile', 'noActivity')}</div>
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
          {sectionHeader(t('profile', 'dangerZone'), <AlertTriangle size={14} color="#ef4444" />, '#ef4444')}
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: sub, marginBottom: '16px', lineHeight: 1.5 }}>{t('profile', 'dangerDesc')}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => { if (!dangerConfirm) { setDangerConfirm(true); showToast(t('profile', 'clickToConfirm'), false) } else { showToast(t('profile', 'notAvailable'), false); setDangerConfirm(false) } }}
                className="danger-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', background: dangerConfirm ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', color: '#ef4444', border: `1px solid ${dangerConfirm ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.25)'}`, fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Lock size={13} />{dangerConfirm ? t('profile', 'confirmDisable') : t('profile', 'disableAccount')}
              </button>
              <button onClick={() => showToast(t('profile', 'notAvailable'), false)}
                className="danger-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Trash2 size={13} />{t('profile', 'deleteAccount')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}