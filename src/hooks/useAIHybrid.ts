import { useState, useCallback, useEffect } from 'react'
import { aiHybridService, AIMessage, AIResponse, PersonalitySettings } from '../services/aiHybrid/index'
import { AIConfig } from '../components/RightPanel/AIConfigurator'

export const useAIHybrid = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null)
  const [personality, setPersonalityState] = useState<PersonalitySettings>(
    aiHybridService.getPersonality()
  )

  // Load configs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_configs')
    if (saved) {
      try {
        const configs = JSON.parse(saved)
        aiHybridService.setConfigs(configs)
      } catch (e) {
        console.error('Failed to load AI configs:', e)
      }
    }
  }, [])

  // Load personality from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_personality')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        setPersonalityState(p)
      } catch (e) {
        console.error('Failed to load personality:', e)
      }
    }
  }, [])

  const sendMessage = useCallback(async (messages: AIMessage[]) => {
    setLoading(true)
    setError(null)

    try {
      const response = await aiHybridService.sendMessage(messages)
      setLastResponse(response)
      return response
    } catch (err) {
      const errorMsg = String(err)
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const setPersonality = useCallback((newPersonality: PersonalitySettings) => {
    setPersonalityState(newPersonality)
    aiHybridService.setPersonality(newPersonality)
  }, [])

  const updateConfigs = useCallback((configs: AIConfig[]) => {
    aiHybridService.setConfigs(configs)
  }, [])

  return {
    sendMessage,
    loading,
    error,
    lastResponse,
    personality,
    setPersonality,
    updateConfigs
  }
}
