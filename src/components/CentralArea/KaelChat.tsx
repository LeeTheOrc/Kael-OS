import { useState, useRef, useEffect } from 'react'
import { useAIHybrid } from '../../hooks/useAIHybrid'
import { Message } from '../../types'

export const KaelChat = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const { sendMessage, loading, error, lastResponse } = useAIHybrid()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date().toISOString(),
      synced: false
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setAiError(null)

    try {
      const response = await sendMessage([
        {
          role: 'user',
          content: input
        }
      ])

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.content,
        timestamp: new Date().toISOString(),
        synced: false
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMsg = String(error)
      setAiError(errorMsg)
      console.error('Error sending message:', error)

      // Show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        synced: false
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#120e1a' }}>
      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffcc00', marginBottom: '8px' }}>Kael-OS</h1>
              <p style={{ color: '#a99ec3' }}>Welcome, Architect! Ready to build something legendary?</p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div 
                style={{
                  maxWidth: '448px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  backgroundColor: msg.role === 'user' ? '#e040fb' : '#1c162b',
                  color: msg.role === 'user' ? 'white' : '#f7f2ff',
                  border: msg.role === 'user' ? 'none' : '1px solid #3a2d56'
                }}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#1c162b', color: '#f7f2ff', border: '1px solid #3a2d56', padding: '8px 16px', borderRadius: '4px' }}>
              🤖 Kael is thinking...
            </div>
            {lastResponse && (
              <span style={{ fontSize: '11px', color: '#7aebbe' }}>
                ({lastResponse.source} - {lastResponse.latency}ms)
              </span>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ borderTop: '1px solid #3a2d56', padding: '16px', backgroundColor: '#1c162b' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Speak with Kael..."
            style={{
              flex: 1,
              padding: '8px 16px',
              backgroundColor: '#120e1a',
              color: '#f7f2ff',
              border: '1px solid #3a2d56',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading}
            style={{
              padding: '8px 24px',
              backgroundColor: loading ? '#ccaa00' : '#ffcc00',
              color: 'black',
              fontWeight: 'bold',
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
