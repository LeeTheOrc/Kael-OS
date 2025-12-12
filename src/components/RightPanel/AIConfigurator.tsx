import { useState, useEffect } from 'react'
import { useAIHybrid } from '../../hooks/useAIHybrid'

interface DetectedLocalAI {
  name: string
  endpoint: string
  models: string[]
  available: boolean
}

// Local AI detection logic
const LOCAL_AI_ENDPOINTS = [
  { name: 'Ollama', port: 11434, path: '/api/tags', modelPath: 'models' },
  { name: 'LM Studio', port: 1234, path: '/v1/models', modelPath: 'data.data' },
  { name: 'llama.cpp', port: 8000, path: '/v1/models', modelPath: 'data' },
  { name: 'Oobabooga', port: 5000, path: '/api/v1/model', modelPath: null },
  { name: 'vLLM', port: 8000, path: '/v1/models', modelPath: 'data' },
  { name: 'LocalAI', port: 8080, path: '/v1/models', modelPath: 'data' },
]

const scanForLocalAIs = async (): Promise<DetectedLocalAI[]> => {
  const detected: DetectedLocalAI[] = []
  const hosts = ['127.0.0.1', 'localhost']
  
  for (const config of LOCAL_AI_ENDPOINTS) {
    for (const host of hosts) {
      const endpoint = `http://${host}:${config.port}`
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        const response = await fetch(`${endpoint}${config.path}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          let models: string[] = []
          
          try {
            const data = await response.json()
            if (config.modelPath) {
              const keys = config.modelPath.split('.')
              let current = data
              
              for (const key of keys) {
                if (current === null || current === undefined) break
                current = current[key]
              }

              if (Array.isArray(current)) {
                models = current
                  .map((item: any) => {
                    if (typeof item === 'string') return item
                    if (item.name) return item.name
                    if (item.id) return item.id
                    return null
                  })
                  .filter((m: string | null): m is string => m !== null)
              }
            }
          } catch (e) {
            console.log(`Could not fetch models from ${config.name}`)
          }

          detected.push({
            name: config.name,
            endpoint,
            models: models.length > 0 ? models : ['(detected but models unknown)'],
            available: true
          })
          break
        }
      } catch (error) {
        // Continue to next
      }
    }
  }

  return detected
}

export interface AIConfig {
  id: string
  name: string
  type: 'local' | 'google-cloud' | 'openai'
  endpoint?: string
  apiKey?: string
  model?: string
  projectId?: string
  isActive: boolean
  createdAt: string
}

interface AIConfiguratorProps {
  onSave?: (config: AIConfig) => void
}

interface SetupWizardData {
  detected: DetectedLocalAI[]
  primaryIndex: number | null
  fallbackIndex: number | null
}

export const AIConfigurator = ({ onSave }: AIConfiguratorProps) => {
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<AIConfig>>({
    type: 'local',
    isActive: false,
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [setupWizard, setSetupWizard] = useState<SetupWizardData | null>(null)

  // Load configs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_configs')
    if (saved) {
      try {
        setConfigs(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load AI configs:', e)
      }
    }
  }, [])

  // Save configs to localStorage
  useEffect(() => {
    localStorage.setItem('ai_configs', JSON.stringify(configs))
  }, [configs])

  const handleAutoDetect = async () => {
    setDetecting(true)
    try {
      const detected = await scanForLocalAIs()
      if (detected.length > 0) {
        setSetupWizard({
          detected,
          primaryIndex: 0,
          fallbackIndex: detected.length > 1 ? 1 : null
        })
      } else {
        alert('No local AI instances detected. Make sure Ollama, LM Studio, or another local AI is running.')
      }
    } catch (error) {
      alert(`Detection failed: ${String(error)}`)
    } finally {
      setDetecting(false)
    }
  }

  const handleSetupWizardSave = () => {
    if (setupWizard === null) return

    const newConfigs: AIConfig[] = []
    
    // Add primary AI
    if (setupWizard.primaryIndex !== null) {
      const primary = setupWizard.detected[setupWizard.primaryIndex]
      newConfigs.push({
        id: Date.now().toString(),
        name: `${primary.name} (Primary)`,
        type: 'local',
        endpoint: primary.endpoint,
        model: primary.models[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      })
    }

    // Add fallback AI
    if (setupWizard.fallbackIndex !== null) {
      const fallback = setupWizard.detected[setupWizard.fallbackIndex]
      newConfigs.push({
        id: (Date.now() + 1).toString(),
        name: `${fallback.name} (Fallback)`,
        type: 'local',
        endpoint: fallback.endpoint,
        model: fallback.models[0],
        isActive: false,
        createdAt: new Date().toISOString(),
      })
    }

    setConfigs([...configs, ...newConfigs])
    setSetupWizard(null)
  }

  const handleAddNew = () => {
    setEditingId(null)
    setFormData({ type: 'local', isActive: false })
    setShowForm(true)
  }

  const handleEdit = (config: AIConfig) => {
    setEditingId(config.id)
    setFormData(config)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name) {
      alert('Please enter a name')
      return
    }

    if (editingId) {
      // Update existing
      setConfigs(configs.map(c => 
        c.id === editingId ? { ...formData as AIConfig, id: editingId } : c
      ))
    } else {
      // Add new
      const newConfig: AIConfig = {
        id: Date.now().toString(),
        name: formData.name!,
        type: formData.type as 'local' | 'google-cloud' | 'openai',
        endpoint: formData.endpoint,
        apiKey: formData.apiKey,
        model: formData.model,
        projectId: formData.projectId,
        isActive: formData.isActive || false,
        createdAt: new Date().toISOString(),
      }
      setConfigs([...configs, newConfig])
    }

    setShowForm(false)
    onSave?.(formData as AIConfig)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this AI configuration?')) {
      setConfigs(configs.filter(c => c.id !== id))
    }
  }

  const handleSetActive = (id: string) => {
    setConfigs(configs.map(c => ({
      ...c,
      isActive: c.id === id
    })))
  }

  const handleTest = async () => {
    if (!formData.endpoint && formData.type === 'local') {
      setTestResult({ success: false, message: 'Please enter an endpoint' })
      return
    }
    if (!formData.apiKey && formData.type === 'google-cloud') {
      setTestResult({ success: false, message: 'Please enter an API key' })
      return
    }

    setTesting(true)
    try {
      // Test the connection
      if (formData.type === 'local') {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(`${formData.endpoint}/health`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (response.ok) {
          setTestResult({ success: true, message: 'Connected successfully!' })
        } else {
          setTestResult({ success: false, message: `Server responded with ${response.status}` })
        }
      } else if (formData.type === 'google-cloud') {
        // For Google Cloud, we'll just validate the format
        if (formData.apiKey && formData.apiKey.length > 20) {
          setTestResult({ success: true, message: 'API key format looks valid' })
        } else {
          setTestResult({ success: false, message: 'API key seems too short' })
        }
      }
    } catch (error) {
      setTestResult({ success: false, message: `Error: ${String(error)}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#1c162b' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #3a2d56' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffcc00', margin: 0 }}>AI Configuration</h2>
      </div>

      {/* Configs List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {configs.length === 0 ? (
          <p style={{ color: '#a99ec3', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
            No AI configurations yet
          </p>
        ) : (
          configs.map(config => (
            <div
              key={config.id}
              style={{
                backgroundColor: config.isActive ? '#2d1f52' : '#120e1a',
                border: `1px solid ${config.isActive ? '#ffcc00' : '#3a2d56'}`,
                borderRadius: '4px',
                padding: '12px',
                cursor: 'pointer',
              }}
              onClick={() => handleSetActive(config.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: config.isActive ? '#ffcc00' : '#f7f2ff', fontSize: '14px' }}>
                    {config.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a99ec3' }}>
                    {config.type === 'local' ? '🖥️ Local' : config.type === 'google-cloud' ? '☁️ Google Cloud' : '🔌 OpenAI'}
                  </div>
                  {config.type === 'local' && config.endpoint && (
                    <div style={{ fontSize: '11px', color: '#7aebbe', marginTop: '4px' }}>
                      {config.endpoint}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(config) }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#3a2d56',
                      color: '#f7f2ff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(config.id) }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Button */}
      <div style={{ padding: '16px', borderTop: '1px solid #3a2d56', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAutoDetect}
          disabled={detecting}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '4px',
            cursor: detecting ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: detecting ? 0.5 : 1
          }}
        >
          {detecting ? '🔍 Scanning...' : '🔍 Auto-Detect Local AIs'}
        </button>
        <button
          onClick={handleAddNew}
          style={{
            flex: 1,
            padding: '8px 16px',
            backgroundColor: '#ffcc00',
            color: 'black',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Manual Add
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1c162b',
            border: '1px solid #3a2d56',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#ffcc00', marginTop: 0 }}>
              {editingId ? 'Edit AI Configuration' : 'New AI Configuration'}
            </h3>

            {/* Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Local Llama, Google Vertex AI"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#120e1a',
                  color: '#f7f2ff',
                  border: '1px solid #3a2d56',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                Type *
              </label>
              <select
                value={formData.type || 'local'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#120e1a',
                  color: '#f7f2ff',
                  border: '1px solid #3a2d56',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="local">🖥️ Local AI</option>
                <option value="google-cloud">☁️ Google Cloud</option>
                <option value="openai">🔌 OpenAI</option>
              </select>
            </div>

            {/* Local AI Fields */}
            {formData.type === 'local' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={formData.endpoint || ''}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    placeholder="http://localhost:8000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., llama2, mistral"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            {/* Google Cloud Fields */}
            {formData.type === 'google-cloud' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={formData.projectId || ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    placeholder="your-gcp-project-id"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Your Google Cloud API key"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., gemini-pro, text-bison"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            {/* OpenAI Fields */}
            {formData.type === 'openai' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="sk-..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a99ec3', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., gpt-4, gpt-3.5-turbo"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#120e1a',
                      color: '#f7f2ff',
                      border: '1px solid #3a2d56',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </>
            )}

            {/* Test Result */}
            {testResult && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: testResult.success ? '#1a3a2a' : '#3a1a1a',
                border: `1px solid ${testResult.success ? '#7aebbe' : '#ef4444'}`,
                borderRadius: '4px',
                fontSize: '12px',
                color: testResult.success ? '#7aebbe' : '#ef4444'
              }}>
                {testResult.message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleTest}
                disabled={testing}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#3a2d56',
                  color: '#f7f2ff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  opacity: testing ? 0.5 : 1
                }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#3a2d56',
                  color: '#f7f2ff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#ffcc00',
                  color: 'black',
                  fontWeight: 'bold',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal */}
      {setupWizard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: '#1c162b',
            border: '1px solid #3a2d56',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#ffcc00', marginTop: 0, marginBottom: '16px' }}>
              🤖 Detected Local AIs
            </h3>

            <p style={{ color: '#a99ec3', fontSize: '14px', marginBottom: '16px' }}>
              Found {setupWizard.detected.length} local AI instance{setupWizard.detected.length !== 1 ? 's' : ''}. 
              Which should be your primary (main) and which your fallback?
            </p>

            {/* Primary Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#ffcc00', marginBottom: '8px' }}>
                🎯 Primary AI (Used First)
              </label>
              <select
                value={setupWizard.primaryIndex ?? ''}
                onChange={(e) => {
                  const idx = parseInt(e.target.value)
                  setSetupWizard({
                    ...setupWizard,
                    primaryIndex: idx,
                    fallbackIndex: setupWizard.fallbackIndex === idx ? null : setupWizard.fallbackIndex
                  })
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#120e1a',
                  color: '#f7f2ff',
                  border: '2px solid #ffcc00',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Select Primary AI --</option>
                {setupWizard.detected.map((ai, idx) => (
                  <option key={idx} value={idx}>
                    {ai.name} - {ai.endpoint}
                  </option>
                ))}
              </select>
            </div>

            {/* Fallback Selection */}
            {setupWizard.detected.length > 1 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#7aebbe', marginBottom: '8px' }}>
                  🔄 Fallback AI (Used if Primary Fails)
                </label>
                <select
                  value={setupWizard.fallbackIndex ?? ''}
                  onChange={(e) => {
                    const idx = e.target.value === '' ? null : parseInt(e.target.value)
                    setSetupWizard({
                      ...setupWizard,
                      fallbackIndex: idx
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#120e1a',
                    color: '#f7f2ff',
                    border: '2px solid #7aebbe',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- No Fallback --</option>
                  {setupWizard.detected.map((ai, idx) => 
                    idx !== setupWizard.primaryIndex ? (
                      <option key={idx} value={idx}>
                        {ai.name} - {ai.endpoint}
                      </option>
                    ) : null
                  )}
                </select>
              </div>
            )}

            {/* AI Details */}
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#120e1a', borderRadius: '4px' }}>
              <p style={{ color: '#a99ec3', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Detected Models:</p>
              {setupWizard.detected.map((ai, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: '#7aebbe', marginBottom: '4px' }}>
                  <strong>{ai.name}:</strong> {ai.models.join(', ')}
                </div>
              ))}
            </div>

            {/* Info */}
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#1a2a2a', border: '1px solid #7aebbe', borderRadius: '4px' }}>
              <p style={{ color: '#7aebbe', fontSize: '12px', margin: 0 }}>
                ℹ️ The primary AI will be used for all requests. If it's unavailable or fails, Kael will automatically use the fallback. Both will share the same personality settings.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSetupWizard(null)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: '#3a2d56',
                  color: '#f7f2ff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetupWizardSave}
                disabled={setupWizard.primaryIndex === null}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: setupWizard.primaryIndex === null ? '#666' : '#ffcc00',
                  color: setupWizard.primaryIndex === null ? '#999' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: setupWizard.primaryIndex === null ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✓ Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
