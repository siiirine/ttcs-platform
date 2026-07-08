'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/language-context'

const API = 'http://192.168.147.129:8000'

export default function LoginPage() {
  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [mounted, setMounted]       = useState(false)

  // ── Étape 2FA ──────────────────────────────────────────────
  const [step, setStep]             = useState<'login' | 'otp'>('login')
  const [otpCode, setOtpCode]       = useState(['', '', '', '', '', ''])
  const [otpUsername, setOtpUsername] = useState('')
  const [otpHint, setOtpHint]       = useState('')
  const [otpTimer, setOtpTimer]     = useState(600) // 10 min en secondes
  const [resending, setResending]   = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  const router = useRouter()
  const { t } = useLang()

  useEffect(() => { setMounted(true) }, [])

  // Timer OTP
  useEffect(() => {
    if (step === 'otp') {
      setOtpTimer(600)
      timerRef.current = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // ── Soumission login ──────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || t('login', 'serverError')); return }

      if (data.otp_required) {
        // ── 2FA requis → passer à l'étape OTP ──────────────
        setOtpUsername(data.username)
        setOtpHint(data.message || '')
        setStep('otp')
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        // ── Pas de 2FA → login direct ───────────────────────
        setCookiesAndRedirect(data)
      }
    } catch { setError(t('login', 'serverError')) }
    finally { setIsLoading(false) }
  }

  // ── Gestion saisie OTP (6 champs) ────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otpCode]
    newOtp[index] = value.slice(-1)
    setOtpCode(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    // Auto-submit si 6 chiffres saisis
    if (newOtp.every(c => c !== '') && newOtp.join('').length === 6) {
      handleOtpSubmit(newOtp.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtpCode(newOtp)
      inputRefs.current[5]?.focus()
      handleOtpSubmit(pasted)
    }
  }

  // ── Soumission OTP ────────────────────────────────────────
  const handleOtpSubmit = async (code?: string) => {
    const finalCode = code || otpCode.join('')
    if (finalCode.length !== 6) return
    setIsLoading(true); setError('')
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: otpUsername, otp_code: finalCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Code OTP invalide')
        setOtpCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      setCookiesAndRedirect(data)
    } catch { setError(t('login', 'serverError')) }
    finally { setIsLoading(false) }
  }

  // ── Renvoyer OTP ──────────────────────────────────────────
  const handleResendOtp = async () => {
    setResending(true); setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.otp_required) {
        setOtpCode(['', '', '', '', '', ''])
        setOtpTimer(600)
        inputRefs.current[0]?.focus()
      }
    } catch { setError('Erreur lors du renvoi du code') }
    finally { setResending(false) }
  }

  const setCookiesAndRedirect = (data: any) => {
    document.cookie = `ttcs_token=${data.access_token}; path=/; max-age=86400`
    document.cookie = `ttcs_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`
    document.cookie = `ttcs_role=${data.user.role}; path=/; max-age=86400`
    router.push('/')
  }

  // ── Styles ────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', color: 'white', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'rgba(193,232,255,0.5)', textTransform: 'uppercase',
    letterSpacing: '0.09em', marginBottom: '8px',
  }

  // ── Panel formulaire login ────────────────────────────────
  const PanelLogin = (
    <div style={{ background: 'rgba(0,29,57,0.95)', backdropFilter: 'blur(24px)', padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white', letterSpacing: '-0.02em', marginBottom: '4px' }}>{t('login', 'welcome')}</div>
      <div style={{ fontSize: '12px', color: 'rgba(193,232,255,0.35)', marginBottom: '36px' }}>{t('login', 'subtitle')}</div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>{t('login', 'usernameLabel')}</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'rgba(123,189,232,0.5)'; e.target.style.background = 'rgba(74,118,159,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={labelStyle}>{t('login', 'passwordLabel')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'rgba(123,189,232,0.5)'; e.target.style.background = 'rgba(74,118,159,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)' }} />
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}
        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '13px', borderRadius: '10px', background: isLoading ? 'rgba(74,118,159,0.3)' : 'linear-gradient(135deg,#0A4174,#49769F)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', border: '1px solid rgba(123,189,232,0.2)', boxShadow: isLoading ? 'none' : '0 4px 20px rgba(0,29,57,0.5)', transition: 'all 0.2s' }}
          onMouseEnter={e => { if (!isLoading) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#0A4174,#7BBDE8)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg,#0A4174,#49769F)' }}>
          {isLoading ? t('login', 'submitting') : t('login', 'submit')}
        </button>
      </form>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0 16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(193,232,255,0.06)' }} />
        <span style={{ fontSize: '9px', color: 'rgba(193,232,255,0.15)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>système</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(193,232,255,0.06)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
        <span style={{ fontSize: '10px', color: 'rgba(193,232,255,0.2)', fontFamily: 'monospace' }}>TTCS Platform · Ericsson ECS</span>
      </div>
    </div>
  )

  // ── Panel OTP ────────────────────────────────────────────
  const PanelOTP = (
    <div style={{ background: 'rgba(0,29,57,0.95)', backdropFilter: 'blur(24px)', padding: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', boxSizing: 'border-box' }}>
      {/* Icône */}
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(0,85,204,0.3),rgba(0,130,240,0.2))', border: '1px solid rgba(0,130,240,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7BBDE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '6px' }}>Vérification en 2 étapes</div>
      <div style={{ fontSize: '12px', color: 'rgba(193,232,255,0.4)', marginBottom: '8px' }}>
        Code envoyé à votre adresse email
      </div>
      {otpHint && (
        <div style={{ fontSize: '12px', color: '#7BBDE8', marginBottom: '28px', fontFamily: 'monospace', background: 'rgba(0,130,240,0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0,130,240,0.2)' }}>
          📧 {otpHint}
        </div>
      )}

      {/* 6 champs OTP */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
        {otpCode.map((digit, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el }}
            type="text" inputMode="numeric" maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            onPaste={i === 0 ? handleOtpPaste : undefined}
            style={{
              width: '48px', height: '56px', textAlign: 'center',
              fontSize: '22px', fontWeight: 700, fontFamily: 'monospace',
              background: digit ? 'rgba(0,130,240,0.15)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${digit ? 'rgba(0,130,240,0.5)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '10px', color: 'white', outline: 'none',
              transition: 'all 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(123,189,232,0.7)'; e.target.style.background = 'rgba(74,118,159,0.15)' }}
            onBlur={e => { e.target.style.borderColor = digit ? 'rgba(0,130,240,0.5)' : 'rgba(255,255,255,0.12)'; e.target.style.background = digit ? 'rgba(0,130,240,0.15)' : 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>

      {/* Timer */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {otpTimer > 0 ? (
          <span style={{ fontSize: '12px', color: otpTimer < 60 ? '#f59e0b' : 'rgba(193,232,255,0.35)', fontFamily: 'monospace' }}>
            ⏱️ Expire dans {formatTimer(otpTimer)}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#ef4444' }}>⚠️ Code expiré</span>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Bouton vérifier */}
      <button
        onClick={() => handleOtpSubmit()}
        disabled={isLoading || otpCode.join('').length !== 6 || otpTimer === 0}
        style={{ width: '100%', padding: '13px', borderRadius: '10px', background: (isLoading || otpCode.join('').length !== 6 || otpTimer === 0) ? 'rgba(74,118,159,0.3)' : 'linear-gradient(135deg,#0A4174,#49769F)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: (isLoading || otpCode.join('').length !== 6 || otpTimer === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', border: '1px solid rgba(123,189,232,0.2)', transition: 'all 0.2s', marginBottom: '12px' }}>
        {isLoading ? 'Vérification…' : 'Vérifier le code'}
      </button>

      {/* Renvoyer + retour */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleResendOtp}
          disabled={resending || otpTimer > 540}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', color: (resending || otpTimer > 540) ? 'rgba(193,232,255,0.2)' : 'rgba(193,232,255,0.5)', border: '1px solid rgba(193,232,255,0.12)', fontSize: '12px', fontWeight: 600, cursor: (resending || otpTimer > 540) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
          {resending ? 'Envoi…' : '🔄 Renvoyer'}
        </button>
        <button
          onClick={() => { setStep('login'); setError(''); setOtpCode(['', '', '', '', '', '']) }}
          style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'transparent', color: 'rgba(193,232,255,0.4)', border: '1px solid rgba(193,232,255,0.08)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
          ← Retour
        </button>
      </div>
    </div>
  )

  // ── Panel branding (identique) ────────────────────────────
  const PanelBranding = (
    <div style={{ background: 'linear-gradient(150deg,rgba(10,65,116,0.95) 0%,rgba(73,118,159,0.7) 100%)', padding: '44px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
        <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(189,216,233,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>TTCS Platform v2.0.0</span>
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.18, letterSpacing: '-0.03em', marginBottom: '14px' }}>
        <span style={{ background: 'linear-gradient(90deg,#BDD8E9,#7BBDE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t('login', 'platformTitle')}
        </span>
      </h1>
      <p style={{ fontSize: '13px', color: 'rgba(189,216,233,0.45)', lineHeight: 1.7, marginBottom: '28px' }}>{t('login', 'platformSubtitle')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
        {[
          { path: 'M22 12h-4l-3 9L9 3l-3 9H2', label: t('login', 'feature1'), desc: t('login', 'feature1sub') },
          { path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: t('login', 'feature2'), desc: t('login', 'feature2sub') },
          { path: 'M18 20V10M12 20V4M6 20v-6', label: t('login', 'feature3'), desc: t('login', 'feature3sub') },
          { path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', label: t('login', 'feature4'), desc: t('login', 'feature4sub') },
        ].map(({ path, label, desc }) => (
          <div key={label} style={{ background: 'rgba(189,216,233,0.06)', border: '1px solid rgba(189,216,233,0.1)', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(189,216,233,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'rgba(189,216,233,0.35)', lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(189,216,233,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', flexShrink: 0 }}>
          <img src="/ericsson.jpg" alt="Ericsson" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.18)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/tt.jpg" alt="TT" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.03em' }}>TTCS Platform</div>
          <div style={{ fontSize: '10px', color: 'rgba(189,216,233,0.35)', fontFamily: 'monospace' }}>Ericsson × Tunisie Telecom</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Sora", system-ui, sans-serif', background: '#021024', padding: '40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: '600px', height: '600px', top: '-200px', left: '-150px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(73,118,159,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '500px', height: '500px', bottom: '-200px', right: '-100px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(189,216,233,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(189,216,233,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(189,216,233,0.03) 1px,transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '960px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,29,57,0.6), 0 0 0 1px rgba(189,216,233,0.1)', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr' }}>
          <div style={{ transition: 'all 0.3s ease' }}>
            {step === 'login' ? PanelLogin : PanelOTP}
          </div>
          <div style={{ borderLeft: '1px solid rgba(189,216,233,0.08)' }}>{PanelBranding}</div>
        </div>
      </div>
      <style>{`input::placeholder { color: rgba(255,255,255,0.2) !important; }`}</style>
    </div>
  )
}