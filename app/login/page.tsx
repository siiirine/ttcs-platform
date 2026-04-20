'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const body = isLogin
        ? { username, password }
        : { username, password, full_name: fullName }
      const res = await fetch(`http://192.168.147.129:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Erreur'); return }
      document.cookie = `ttcs_token=${data.access_token}; path=/; max-age=86400`
      document.cookie = `ttcs_user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400`
      router.push('/')
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#020d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Background Effects ── */}

      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,130,240,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,130,240,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
      }} />

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute',
        top: '-100px', left: '-100px',
        width: '500px', height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,100,220,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px', right: '-100px',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float2 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px', height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Animated diagonal lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 100px,
          rgba(0,130,240,0.015) 100px,
          rgba(0,130,240,0.015) 101px
        )`,
        pointerEvents: 'none',
      }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${4 + i * 2}px`,
          height: `${4 + i * 2}px`,
          borderRadius: '50%',
          background: ['#0082f0','#00d4aa','#a855f7','#f59e0b','#ef4444','#00cc88'][i],
          opacity: 0.3,
          top: `${10 + i * 15}%`,
          left: `${5 + i * 16}%`,
          animation: `particle${i % 3} ${5 + i}s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Corner decorations */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px',
        width: '60px', height: '60px',
        borderTop: '2px solid rgba(0,130,240,0.3)',
        borderLeft: '2px solid rgba(0,130,240,0.3)',
        borderRadius: '4px 0 0 0',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20px', right: '20px',
        width: '60px', height: '60px',
        borderBottom: '2px solid rgba(168,85,247,0.3)',
        borderRight: '2px solid rgba(168,85,247,0.3)',
        borderRadius: '0 0 4px 0',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '20px', right: '20px',
        width: '40px', height: '40px',
        borderTop: '2px solid rgba(0,212,170,0.3)',
        borderRight: '2px solid rgba(0,212,170,0.3)',
        borderRadius: '0 4px 0 0',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20px', left: '20px',
        width: '40px', height: '40px',
        borderBottom: '2px solid rgba(245,158,11,0.3)',
        borderLeft: '2px solid rgba(245,158,11,0.3)',
        borderRadius: '0 0 0 4px',
        pointerEvents: 'none',
      }} />

      {/* ── Main Content — centered ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '520px',
        padding: '20px',
        position: 'relative',
        zIndex: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s ease',
      }}>

        {/* Logos */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '16px', marginBottom: '20px',
        }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #0055aa, #0082f0)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,130,240,0.5)',
          }}>
            <img src="/ericsson.jpg" alt="Ericsson" style={{
              width: '44px', height: '44px',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }} />
          </div>
          <div style={{
            height: '40px', width: '1px',
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent)',
          }} />
          <img src="/tt.jpg" alt="TT" style={{
            width: '56px', height: '56px',
            objectFit: 'contain', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.4rem', fontWeight: 900,
          textAlign: 'center', marginBottom: '6px',
          background: 'linear-gradient(135deg, #ffffff 0%, #94c8ff 50%, #00d4aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}>
          TTCS Platform
        </h1>

        <p style={{
          fontSize: '13px', color: '#5a7a99',
          textAlign: 'center', marginBottom: '6px',
        }}>
          Ericsson Charging System — Tunisie Telecom
        </p>

        {/* TT gradient bar */}
        <div style={{
          height: '3px', width: '100px', borderRadius: '2px',
          background: 'linear-gradient(90deg, #0066cc, #00cc88, #ffaa00, #ff3366, #aa00ff)',
          marginBottom: '28px',
        }} />

        {/* Features row */}
        <div style={{
          display: 'flex', gap: '12px',
          marginBottom: '28px', flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {[
            { icon: '⚡', label: 'HealthCheck', color: '#0082f0' },
            { icon: '🧠', label: 'IA Anomalies', color: '#00d4aa' },
            { icon: '📊', label: 'Prédiction', color: '#a855f7' },
            { icon: '💬', label: 'Assistant', color: '#f59e0b' },
          ].map(({ icon, label, color }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '20px',
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span style={{ fontSize: '12px', color: '#7a9bc5', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Glass Card */}
        <div style={{
          width: '100%',
          background: 'rgba(8, 20, 42, 0.85)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          padding: '36px',
          border: '1px solid rgba(0,130,240,0.2)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>

          {/* Card title */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
              {isLogin ? '👋 Bienvenue' : '🚀 Créer un compte'}
            </h2>
            <p style={{ fontSize: '13px', color: '#4a6a8a' }}>
              {isLogin
                ? 'Connectez-vous à votre espace de supervision'
                : 'Rejoignez la plateforme TTCS'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(0,130,240,0.08)',
            borderRadius: '12px', padding: '4px',
            marginBottom: '24px',
            border: '1px solid rgba(0,130,240,0.12)',
          }}>
            {['Connexion', 'Nouveau compte'].map((tab, i) => (
              <button key={tab} onClick={() => { setIsLogin(i === 0); setError('') }} style={{
                flex: 1, padding: '10px', borderRadius: '10px',
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                background: isLogin === (i === 0)
                  ? 'linear-gradient(135deg, #0055cc, #0082f0)'
                  : 'transparent',
                color: isLogin === (i === 0) ? 'white' : '#4a6a8a',
                transition: 'all 0.25s',
                boxShadow: isLogin === (i === 0) ? '0 4px 12px rgba(0,130,240,0.35)' : 'none',
              }}>{tab}</button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {!isLogin && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                  Nom complet
                </label>
                <input type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ahmed Ben Ali" required={!isLogin}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: '12px',
                    border: '1.5px solid rgba(0,130,240,0.2)',
                    background: 'rgba(0,130,240,0.06)',
                    fontSize: '14px', color: 'white', outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#0082f0')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,130,240,0.2)')}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                Nom d&apos;utilisateur
              </label>
              <input type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin" required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '12px',
                  border: '1.5px solid rgba(0,130,240,0.2)',
                  background: 'rgba(0,130,240,0.06)',
                  fontSize: '14px', color: 'white', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#0082f0')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,130,240,0.2)')}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a6a8a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                Mot de passe
              </label>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: '12px',
                  border: '1.5px solid rgba(0,130,240,0.2)',
                  background: 'rgba(0,130,240,0.06)',
                  fontSize: '14px', color: 'white', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#0082f0')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,130,240,0.2)')}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: '13px', fontWeight: 500,
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} style={{
              padding: '14px', borderRadius: '12px', border: 'none',
              background: isLoading
                ? 'rgba(0,130,240,0.4)'
                : 'linear-gradient(135deg, #0055cc, #0082f0, #00aaff)',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', marginTop: '4px',
              boxShadow: isLoading ? 'none' : '0 8px 24px rgba(0,130,240,0.4)',
              letterSpacing: '0.02em',
            }}
              onMouseEnter={e => {
                if (!isLoading)(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {isLoading ? '⏳ Chargement...' : isLogin ? '→ Se connecter' : '→ Créer le compte'}
            </button>

          </form>

          {isLogin && (
            <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#2a4a6a' }}>
              Par défaut : <span style={{ color: '#4a7a9b', fontFamily: 'monospace' }}>admin / ttadmin</span>
            </p>
          )}

        </div>

        {/* Bottom */}
        <p style={{ marginTop: '20px', fontSize: '11px', color: '#2a4262', textAlign: 'center' }}>
          Système de supervision Ericsson ECS • Version 2.0.0
        </p>

      </div>

      <style>{`
        input::placeholder { color: #3a5a7a !important; }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.08); }
        }
        @keyframes particle0 {
          0%, 100% { transform: translateY(0px); opacity: 0.3; }
          50% { transform: translateY(-20px); opacity: 0.6; }
        }
        @keyframes particle1 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          50% { transform: translateY(-15px) translateX(10px); opacity: 0.5; }
        }
        @keyframes particle2 {
          0%, 100% { transform: translateY(0px); opacity: 0.25; }
          50% { transform: translateY(-25px); opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}