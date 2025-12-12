import { useState, useEffect } from 'react'
import { AIConfigurator } from './AIConfigurator'
import { useAIHybrid } from '../../hooks/useAIHybrid'

export const RightPanel = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'ui'>('ai')
  const { personality, setPersonality } = useAIHybrid()
  const [personalityLevel, setPersonalityLevel] = useState(personality.level)
  const [tone, setTone] = useState<'professional' | 'casual' | 'creative' | 'technical'>(personality.tone)
  const [verbose, setVerbose] = useState(personality.verbose)

  // Sync personality changes to service
  useEffect(() => {
    setPersonality({
      level: personalityLevel,
      tone,
      verbose
    })
  }, [personalityLevel, tone, verbose, setPersonality])

  return (
    <div style={{ width: '256px', backgroundColor: '#1c162b', borderLeft: '1px solid #3a2d56', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #3a2d56' }}>
        <button
          onClick={() => setActiveTab('ai')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'ai' ? '#2d1f52' : 'transparent',
            color: activeTab === 'ai' ? '#ffcc00' : '#a99ec3',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'ai' ? 'bold' : 'normal',
            borderBottom: activeTab === 'ai' ? '2px solid #ffcc00' : 'none'
          }}
        >
          🤖 AI
        </button>
        <button
          onClick={() => setActiveTab('ui')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'ui' ? '#2d1f52' : 'transparent',
            color: activeTab === 'ui' ? '#ffcc00' : '#a99ec3',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: activeTab === 'ui' ? 'bold' : 'normal',
            borderBottom: activeTab === 'ui' ? '2px solid #ffcc00' : 'none'
          }}
        >
          ⚙️ UI
        </button>
      </div>

      {/* AI Tab */}
      {activeTab === 'ai' && (
        <AIConfigurator />
      )}

      {/* UI Tab */}
      {activeTab === 'ui' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Personality Section */}
          <div>
            <h3 style={{ color: '#ffcc00', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              🎭 Kael Personality
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#120e1a', padding: '12px', borderRadius: '4px', border: '1px solid #3a2d56' }}>
              {/* Engagement Level */}
              <div>
                <label style={{ fontSize: '12px', color: '#a99ec3', display: 'block', marginBottom: '4px' }}>
                  Engagement Level: {personalityLevel}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={personalityLevel}
                  onChange={(e) => setPersonalityLevel(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '10px', color: '#7aebbe', marginTop: '4px' }}>
                  {personalityLevel <= 3 ? 'Reserved' : personalityLevel <= 5 ? 'Balanced' : personalityLevel <= 7 ? 'Engaging' : 'Very Engaging'}
                </div>
              </div>

              {/* Tone */}
              <div>
                <label style={{ fontSize: '12px', color: '#a99ec3', marginBottom: '4px', display: 'block' }}>
                  Communication Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#1c162b',
                    color: '#f7f2ff',
                    border: '1px solid #3a2d56',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="creative">Creative & Imaginative</option>
                  <option value="technical">Technical & Precise</option>
                </select>
              </div>

              {/* Verbosity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="verbose" 
                  checked={verbose}
                  onChange={(e) => setVerbose(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="verbose" style={{ fontSize: '12px', color: '#a99ec3', cursor: 'pointer' }}>
                  {verbose ? '📝 Detailed Responses' : '📝 Concise Responses'}
                </label>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div>
            <h3 style={{ color: '#ffcc00', fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              ⚙️ System
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#120e1a', padding: '12px', borderRadius: '4px', border: '1px solid #3a2d56' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="cloud" defaultChecked />
                <label htmlFor="cloud" style={{ fontSize: '12px', color: '#a99ec3' }}>☁️ Cloud Enabled</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="offline" defaultChecked />
                <label htmlFor="offline" style={{ fontSize: '12px', color: '#a99ec3' }}>🔌 Offline Mode</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
