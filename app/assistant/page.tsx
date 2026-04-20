'use client'

import { useState, useRef, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Topbar } from '@/components/dashboard/topbar'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { RoleBadge } from '@/components/dashboard/role-badge'
import {
  Send,
  Bot,
  User,
  Loader2,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import { api, KNOWN_NODES } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const EXAMPLE_QUERIES = [
  "état de jambala",
  "anomalies ttsdp17a",
  "timeline ttocc1",
  "quelle est la cause probable ?",
  "quel est le risque de dégradation ?",
  "résumé global",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Bonjour ! Je suis l'assistant TTCS. Je peux vous aider à interroger le système de monitoring Ericsson Charging System.

Vous pouvez me demander :
- L'état d'un noeud (ex: "état de jambala")
- Les anomalies d'un noeud (ex: "anomalies ttsdp17a")
- L'historique d'un noeud (ex: "timeline ttocc1")
- La cause probable des incidents
- Le niveau de risque global

Noeuds disponibles : ${KNOWN_NODES.join(', ')}`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const detectNode = (text: string): string | null => {
    const lowerText = text.toLowerCase()
    for (const node of KNOWN_NODES) {
      if (lowerText.includes(node.toLowerCase())) {
        return node
      }
    }
    return null
  }

  const detectIntent = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('statut') || lowerText.includes('état') || lowerText.includes('status')) {
      return 'status'
    }
    if (lowerText.includes('anomalie') || lowerText.includes('alerte')) {
      return 'anomalies'
    }
    if (lowerText.includes('timeline') || lowerText.includes('historique')) {
      return 'timeline'
    }
    if (lowerText.includes('cause') || lowerText.includes('corrélation') || lowerText.includes('incident')) {
      return 'correlation'
    }
    if (lowerText.includes('risque') || lowerText.includes('prédiction') || lowerText.includes('prediction')) {
      return 'predict'
    }
    if (lowerText.includes('résumé') || lowerText.includes('global') || lowerText.includes('overview')) {
      return 'summary'
    }
    
    return 'unknown'
  }

  const formatStatusResponse = (node: string, data: Record<string, unknown>) => {
    const status = data as {
      role: string
      global_status: string
      hw: { status: string; cpu_pct: number; ram_pct: number }
      os: { status: string; load_avg_1m: number }
      app: { status: string; critical_alarms: number; major_alarms: number; issues: string[] }
    }
    
    return `**État du noeud ${node}** (${status.role})

**Statut global:** ${status.global_status}

**Hardware:**
- Statut: ${status.hw.status}
- CPU: ${status.hw.cpu_pct.toFixed(1)}%
- RAM: ${status.hw.ram_pct.toFixed(1)}%

**Système d'exploitation:**
- Statut: ${status.os.status}
- Load (1m): ${status.os.load_avg_1m}

**Application:**
- Statut: ${status.app.status}
- Alarmes critiques: ${status.app.critical_alarms}
- Alarmes majeures: ${status.app.major_alarms}
${status.app.issues.length > 0 ? `- Problèmes: ${status.app.issues.join(', ')}` : '- Aucun problème détecté'}`
  }

  const formatAnomaliesResponse = (node: string, data: Record<string, unknown>) => {
    const result = data as {
      count: number
      anomalies: Array<{
        rule_id: string
        severity: string
        message: string
        value: number
        threshold: number
      }>
    }
    
    if (result.count === 0) {
      return `Aucune anomalie détectée pour le noeud **${node}**.`
    }
    
    let response = `**Anomalies du noeud ${node}** (${result.count} anomalie${result.count > 1 ? 's' : ''})\n\n`
    
    result.anomalies.forEach((a, i) => {
      response += `${i + 1}. **${a.severity}** - ${a.message}\n   Valeur: ${a.value} (seuil: ${a.threshold})\n\n`
    })
    
    return response
  }

  const formatTimelineResponse = (node: string, data: Record<string, unknown>) => {
    const result = data as {
      role: string
      global_status: string
      events: Array<{
        type: string
        message: string
        severity?: string
      }>
      nb_anomalies: number
    }
    
    let response = `**Timeline du noeud ${node}** (${result.role}) - Statut: ${result.global_status}\n\n`
    
    if (result.events.length === 0) {
      response += 'Aucun événement dans la timeline.'
    } else {
      result.events.forEach((event, i) => {
        response += `${i + 1}. [${event.type}] ${event.message}${event.severity ? ` (${event.severity})` : ''}\n`
      })
    }
    
    response += `\n**Total anomalies:** ${result.nb_anomalies}`
    
    return response
  }

  const formatCorrelationResponse = (data: Record<string, unknown>) => {
    const result = data as {
      cause_probable: string
      noeuds_impactes: string[]
      chaine_impact: string[]
      nb_anomalies: number
      nb_critical: number
      nb_warning: number
    }
    
    return `**Analyse de corrélation**

**Cause probable:** ${result.cause_probable}

**Chaîne d'impact:** ${result.chaine_impact.join(' → ') || 'Aucune'}

**Noeuds impactés:** ${result.noeuds_impactes.join(', ') || 'Aucun'}

**Statistiques:**
- Anomalies totales: ${result.nb_anomalies}
- Critiques: ${result.nb_critical}
- Avertissements: ${result.nb_warning}`
  }

  const formatPredictResponse = (data: Record<string, unknown>) => {
    const result = data as {
      global: {
        risk_level: string
        risk_score: number
        nb_sdp: number
        interpretation: string
      }
    }
    
    return `**Analyse de risque**

**Niveau de risque global:** ${result.global.risk_level}
**Score de risque:** ${(result.global.risk_score * 100).toFixed(0)}%

**Interprétation:** ${result.global.interpretation}

**Noeuds SDP analysés:** ${result.global.nb_sdp}`
  }

  const formatSummaryResponse = (data: Record<string, unknown>) => {
    const result = data as {
      total_nodes: number
      CRITICAL: number
      WARNING: number
      NORMAL: number
      critical_nodes: string[]
      warning_nodes: string[]
      timestamp: string
    }
    
    return `**Résumé global du système**

**Total des noeuds:** ${result.total_nodes}

**État par statut:**
- Normaux: ${result.NORMAL}
- Avertissements: ${result.WARNING} ${result.warning_nodes.length > 0 ? `(${result.warning_nodes.join(', ')})` : ''}
- Critiques: ${result.CRITICAL} ${result.critical_nodes.length > 0 ? `(${result.critical_nodes.join(', ')})` : ''}

**Dernière mise à jour:** ${new Date(result.timestamp).toLocaleString('fr-FR')}`
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const intent = detectIntent(userMessage.content)
      const node = detectNode(userMessage.content)
      let responseContent = ''

      switch (intent) {
        case 'status':
          if (node) {
            const data = await api.getNodeStatus(node)
            responseContent = formatStatusResponse(node, data as unknown as Record<string, unknown>)
          } else {
            responseContent = 'Veuillez spécifier un noeud. Noeuds disponibles: ' + KNOWN_NODES.join(', ')
          }
          break

        case 'anomalies':
          if (node) {
            const data = await api.getNodeAnomalies(node)
            responseContent = formatAnomaliesResponse(node, data as unknown as Record<string, unknown>)
          } else {
            const data = await api.getAnomalies()
            responseContent = `**Anomalies globales** (${data.anomalies.length} anomalies)\n\n` +
              data.anomalies.slice(0, 5).map((a, i) => 
                `${i + 1}. **${a.node}** (${a.role}) - ${a.severity}: ${a.message}`
              ).join('\n\n')
          }
          break

        case 'timeline':
          if (node) {
            const data = await api.getTimeline(node)
            responseContent = formatTimelineResponse(node, data as unknown as Record<string, unknown>)
          } else {
            responseContent = 'Veuillez spécifier un noeud pour voir sa timeline. Noeuds disponibles: ' + KNOWN_NODES.join(', ')
          }
          break

        case 'correlation':
          {
            const data = await api.getCorrelation()
            responseContent = formatCorrelationResponse(data as unknown as Record<string, unknown>)
          }
          break

        case 'predict':
          {
            const data = await api.getPredict()
            responseContent = formatPredictResponse(data as unknown as Record<string, unknown>)
          }
          break

        case 'summary':
          {
            const data = await api.getSummary()
            responseContent = formatSummaryResponse(data as unknown as Record<string, unknown>)
          }
          break

        default:
          responseContent = `Je n'ai pas compris votre demande. Voici ce que je peux faire:

- **État d'un noeud:** "état de [noeud]" ou "statut de [noeud]"
- **Anomalies:** "anomalies [noeud]" ou "alertes [noeud]"
- **Timeline:** "timeline [noeud]" ou "historique [noeud]"
- **Corrélation:** "cause probable" ou "analyse de corrélation"
- **Prédiction:** "risque" ou "prédiction"
- **Résumé:** "résumé global" ou "overview"

Noeuds disponibles: ${KNOWN_NODES.join(', ')}`
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolé, une erreur est survenue lors de la communication avec l\'API. Veuillez vérifier que le serveur est accessible.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (query: string) => {
    setInput(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <DashboardLayout>
      <Topbar />
      
      <div className="h-[calc(100vh-64px)] flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 p-4">
                <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                </div>
                <span className="text-muted-foreground">Recherche en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border/30 glass-card">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-5 py-3.5 rounded-xl glass-card border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                <Send className="h-4 w-4" />
                Envoyer
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar with Examples */}
        <div className="w-80 border-l border-border/30 glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-[#ffb020]/20">
              <Lightbulb className="h-5 w-5 text-[#ffb020]" />
            </div>
            <h3 className="font-heading font-semibold text-foreground">Exemples de requêtes</h3>
          </div>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((query, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(query)}
                className="w-full text-left px-4 py-3 rounded-xl glass-card border border-border/30 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all text-sm"
              >
                &quot;{query}&quot;
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-medium text-foreground">Noeuds disponibles</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {KNOWN_NODES.map((node) => (
                <span
                  key={node}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono glass-card border border-border/30 text-foreground"
                >
                  {node}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`p-2.5 rounded-xl ${isAssistant ? 'bg-gradient-to-br from-primary/20 to-accent/20' : 'bg-gradient-to-br from-[#a855f7]/20 to-pink-500/20'}`}>
        {isAssistant ? (
          <Bot className="h-5 w-5 text-primary" />
        ) : (
          <User className="h-5 w-5 text-[#a855f7]" />
        )}
      </div>
      <div
        className={`max-w-[70%] rounded-2xl px-5 py-4 ${
          isAssistant
            ? 'glass-card gradient-border'
            : 'bg-gradient-to-r from-primary to-accent text-white'
        }`}
      >
        <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isAssistant ? 'text-foreground' : ''}`}>
          {message.content.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g)
            return (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {parts.map((part, j) => 
                  j % 2 === 1 ? <strong key={j} className={isAssistant ? 'text-primary' : ''}>{part}</strong> : part
                )}
              </p>
            )
          })}
        </div>
        <p className={`text-xs mt-3 ${isAssistant ? 'text-muted-foreground' : 'text-white/70'}`}>
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
