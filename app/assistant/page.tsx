'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { useThemeColors } from '@/lib/use-theme-colors'
import { Send, Bot, User, Loader2, History, Plus, Clock } from 'lucide-react'

const API_BASE = 'http://192.168.147.129:8000'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface HistoryItem {
  question: string
  reponse: string
  created_at: string
}

const WELCOME_MSG = `👋 Bonjour ! Je suis TTCS Assistant.\nComment puis-je vous aider ?`

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

function getToken(): string {
  try {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'ttcs_token') return decodeURIComponent(value)
    }
  } catch { }
  return ''
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now   = new Date()
  const diff  = now.getTime() - date.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return "À l'instant"
  if (mins < 60)  return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7)   return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
}

export default function AssistantPage() {
  const c = useThemeColors()

  const initMessages = (): Message[] => [{
    id: '1', role: 'assistant', timestamp: new Date(), content: WELCOME_MSG,
  }]

  const [messages, setMessages]       = useState<Message[]>(initMessages)
  const [input, setInput]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [groqHistory, setGroqHistory] = useState<Array<{ role: string; content: string }>>([])
  const [history, setHistory]         = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeHistory, setActiveHistory]   = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const username = getUsername()
      const token    = getToken()
      const res = await fetch(`${API_BASE}/chat/history/${username}?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setHistory(data.history || [])
    } catch { }
    finally { setLoadingHistory(false) }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const loadFromHistory = (item: HistoryItem, index: number) => {
    setActiveHistory(index)
    setMessages([
      { id: '1',  role: 'assistant', timestamp: new Date(),               content: WELCOME_MSG },
      { id: '2u', role: 'user',      timestamp: new Date(item.created_at), content: item.question },
      { id: '2a', role: 'assistant', timestamp: new Date(item.created_at), content: item.reponse },
    ])
    setGroqHistory([
      { role: 'user',      content: item.question },
      { role: 'assistant', content: item.reponse },
    ])
  }

  const newConversation = () => {
    setActiveHistory(null)
    setMessages(initMessages())
    setGroqHistory([])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    setActiveHistory(null)
    const userMessage: Message = {
      id: Date.now().toString(), role: 'user',
      content: input.trim(), timestamp: new Date(),
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question, history: groqHistory.slice(-6), username: getUsername() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur API')

      setGroqHistory(prev => [
        ...prev,
        { role: 'user',      content: question },
        { role: 'assistant', content: data.reponse },
      ])
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.reponse, timestamp: new Date(),
      }])
      fetchHistory()
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "❌ Erreur de connexion au serveur.",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <Topbar />
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>

        {/* ── CENTER : Zone de chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${c.borderSubtle}`, background: c.headerBg, display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.3s' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0055cc, #0082f0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} style={{ color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: c.textPrimary }}>TTCS Assistant</h2>
            <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', fontSize: '12px', color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} /> En ligne
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message}
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
              <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{
                padding: '13px 24px', borderRadius: '12px', border: 'none',
                background: !input.trim() || isLoading ? 'rgba(0,130,240,0.3)' : 'linear-gradient(135deg, #0055cc, #0082f0)',
                color: 'white', fontWeight: 700,
                cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
              }}>
                <Send size={16} /> Envoyer
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT : Historique ── */}
        <div style={{
          width: '280px', flexShrink: 0,
          borderLeft: `1px solid ${c.borderSubtle}`,
          background: c.sidebarRightBg,
          display: 'flex', flexDirection: 'column',
          transition: 'background 0.3s',
        }}>
          {/* Header historique */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${c.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={15} style={{ color: '#0082f0' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: c.textPrimary }}>Historique</span>
              </div>
              <span style={{ fontSize: '10px', color: c.textSecondary, background: 'rgba(0,130,240,0.1)', padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>
                {history.length}
              </span>
            </div>
            <button onClick={newConversation} style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #0055cc, #0082f0)',
              color: 'white', border: 'none', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Plus size={13} /> Nouvelle conversation
            </button>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '20px', color: c.textSecondary, fontSize: '12px' }}>Chargement...</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: c.textSecondary }}>
                <History size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p style={{ fontSize: '12px', margin: 0 }}>Aucune conversation</p>
              </div>
            ) : (
              history.map((item, i) => (
                <button key={i} onClick={() => loadFromHistory(item, i)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  borderRadius: '8px', marginBottom: '4px', border: 'none',
                  background: activeHistory === i ? 'rgba(0,130,240,0.12)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                  borderLeft: activeHistory === i ? '3px solid #0082f0' : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (activeHistory !== i) (e.currentTarget as HTMLElement).style.background = 'rgba(0,130,240,0.06)' }}
                  onMouseLeave={e => { if (activeHistory !== i) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <p style={{ fontSize: '12px', fontWeight: 500, color: c.textPrimary, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.question}
                  </p>
                  <p style={{ fontSize: '11px', color: c.textSecondary, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.reponse.replace(/\*\*/g, '').substring(0, 55)}...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} style={{ color: c.textSecondary, opacity: 0.6 }} />
                    <span style={{ fontSize: '10px', color: c.textSecondary, opacity: 0.7 }}>
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
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
      <div style={{ maxWidth: '75%', padding: '14px 18px', borderRadius: isAssistant ? '4px 16px 16px 16px' : '16px 4px 16px 16px', background: isAssistant ? cardBg : 'linear-gradient(135deg, #0055cc, #0082f0)', border: isAssistant ? `1px solid ${border}` : 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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