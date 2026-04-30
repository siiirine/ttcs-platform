'use client'

import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { Send, Bot, User, Loader2, Lightbulb, Sparkles } from 'lucide-react'
import { KNOWN_NODES } from '@/lib/api'

const API_BASE = 'http://192.168.147.129:8000'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const EXAMPLE_QUERIES = [
  "quel est l'état du système ?",
  "état de jambala",
  "anomalies ttsdp17a",
  "quelle est la cause probable ?",
  "quel est le risque de dégradation CIP ?",
  "résumé global du système",
  "compare les nœuds critiques",
  "que faire pour résoudre les problèmes ?",
]

// ✅ Lit le username depuis le cookie ttcs_user
function getUsername(): string {
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'ttcs_user') {
        const user = JSON.parse(decodeURIComponent(value))
        return user.username || 'admin'
      }
    }
  } catch { }
  return 'admin'
}

// ✅ Lit le token JWT depuis le cookie ttcs_token
function getToken(): string {
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'ttcs_token') {
        return decodeURIComponent(value)
      }
    }
  } catch { }
  return ''
}

export default function AssistantPage() {
  const c = useThemeColors()
  const [messages, setMessages] = useState<Message[]>([{
    id: '1', role: 'assistant', timestamp: new Date(),
    content: `👋 Bonjour ! Je suis **TTCS Assistant**, propulsé par l'IA Groq (LLaMA 3.3 70B).\n\nJe suis connecté en temps réel au système Ericsson Charging System de Tunisie Telecom.\n\nJe peux vous aider avec :\n- 🔍 **État des nœuds** — "état de jambala"\n- ⚠️ **Anomalies** — "anomalies ttsdp17a"\n- 🔗 **Corrélation** — "quelle est la cause probable ?"\n- 📊 **Prédiction CIP** — "quel est le risque ?"\n- 💡 **Recommandations** — "que faire pour résoudre ?"\n- 📋 **Résumé global** — "état général du système"\n\nPosez votre question en français !`,
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [groqHistory, setGroqHistory] = useState<Array<{role: string, content: string}>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMessage: Message = {
      id: Date.now().toString(), role: 'user',
      content: input.trim(), timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    const question = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      const token = getToken()

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ✅ FIX : token JWT injecté — sans ça → 401 Unauthorized
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question,
          history: groqHistory.slice(-6),
          username: getUsername()
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur API')

      setGroqHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.reponse }
      ])
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reponse,
        timestamp: new Date()
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "❌ Erreur de connexion au serveur. Vérifiez que l'API est démarrée sur 192.168.147.129:8000",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Topbar />
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.headerBg, display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.3s' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0055cc, #0082f0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: c.textPrimary }}>TTCS Assistant</h2>
              <p style={{ fontSize: '12px', color: c.textSecondary }}>Propulsé par Groq LLaMA 3.3 70B • Données en temps réel</p>
            </div>
            <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> En ligne
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(message => (
              <MessageBubble
                key={message.id} message={message}
                cardBg={c.cardBg} textPrimary={c.textPrimary}
                textSecondary={c.textSecondary} border={c.border}
              />
            ))}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(0,130,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={18} style={{ color: '#0082f0', animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '16px', background: c.cardBg, border: `1px solid ${c.border}`, fontSize: '14px', color: c.textSecondary }}>
                  L'assistant analyse le système...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${c.borderSubtle}`, background: c.headerBg, transition: 'background 0.3s' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Posez votre question en français..."
                disabled={isLoading}
                style={{ flex: 1, padding: '13px 18px', borderRadius: '12px', border: `1.5px solid ${c.borderInput}`, background: c.inputBg, fontSize: '14px', color: c.textPrimary, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#0082f0')}
                onBlur={e => (e.target.style.borderColor = c.borderInput)}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{ padding: '13px 24px', borderRadius: '12px', border: 'none', background: !input.trim() || isLoading ? 'rgba(0,130,240,0.3)' : 'linear-gradient(135deg, #0055cc, #0082f0)', color: 'white', fontWeight: 700, cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
              >
                <Send size={16} /> Envoyer
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '300px', flexShrink: 0, borderLeft: `1px solid ${c.borderSubtle}`, background: c.sidebarRightBg, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'background 0.3s' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245,158,11,0.12)' }}>
                <Lightbulb size={14} style={{ color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: c.textPrimary }}>Exemples de questions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {EXAMPLE_QUERIES.map((query, i) => (
                <button key={i} onClick={() => setInput(query)}
                  style={{ padding: '10px 12px', borderRadius: '10px', background: c.panelBg, border: `1px solid ${c.border}`, color: c.textSecondary, fontSize: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,130,240,0.1)'; (e.currentTarget as HTMLElement).style.color = c.textPrimary }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.panelBg; (e.currentTarget as HTMLElement).style.color = c.textSecondary }}
                >
                  &ldquo;{query}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(0,130,240,0.1)' }}>
                <Sparkles size={14} style={{ color: '#0082f0' }} />
              </div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: c.textPrimary }}>Nœuds disponibles</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {KNOWN_NODES.map(node => (
                <button key={node} onClick={() => setInput(`état de ${node}`)}
                  style={{ padding: '5px 10px', borderRadius: '8px', background: 'rgba(0,130,240,0.08)', border: `1px solid ${c.border}`, color: '#0082f0', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 600 }}
                >
                  {node}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: c.panelBg, border: `1px solid ${c.border}` }}>
            <p style={{ fontSize: '11px', color: c.textSecondary, lineHeight: 1.6 }}>
              💡 L'assistant mémorise le contexte de la conversation. Vous pouvez poser des questions de suivi sans répéter les informations.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}

function MessageBubble({ message, cardBg, textPrimary, textSecondary, border }: {
  message: Message; cardBg: string; textPrimary: string; textSecondary: string; border: string
}) {
  const isAssistant = message.role === 'assistant'
  const renderContent = (content: string) =>
    content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} style={{ margin: i > 0 ? '4px 0 0' : '0' }}>
          {parts.map((part, j) => j % 2 === 1
            ? <strong key={j} style={{ color: isAssistant ? '#0082f0' : 'white', fontWeight: 700 }}>{part}</strong>
            : part
          )}
        </p>
      )
    })

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexDirection: isAssistant ? 'row' : 'row-reverse' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0, background: isAssistant ? 'rgba(0,130,240,0.1)' : 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}` }}>
        {isAssistant ? <Bot size={18} style={{ color: '#0082f0' }} /> : <User size={18} style={{ color: '#a855f7' }} />}
      </div>
      <div style={{ maxWidth: '72%', padding: '14px 18px', borderRadius: isAssistant ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: isAssistant ? cardBg : 'linear-gradient(135deg, #0055cc, #0082f0)', border: isAssistant ? `1px solid ${border}` : 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: isAssistant ? textPrimary : 'white', whiteSpace: 'pre-wrap' }}>
          {renderContent(message.content)}
        </div>
        <p style={{ fontSize: '11px', marginTop: '8px', color: isAssistant ? textSecondary : 'rgba(255,255,255,0.7)' }}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}