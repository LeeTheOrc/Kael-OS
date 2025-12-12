import { AIConfig } from '../../components/RightPanel/AIConfigurator'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  source: 'google-cloud' | 'openai' | 'local'
  latency: number
}

export interface PersonalitySettings {
  level: number // 0-10
  tone: 'professional' | 'casual' | 'creative' | 'technical'
  verbose: boolean
  systemPrompt?: string
}

class AIHybridService {
  private configs: AIConfig[] = []
  private personality: PersonalitySettings = {
    level: 7,
    tone: 'creative',
    verbose: true
  }
  private requestTimeout = 30000 // 30 seconds

  setConfigs(configs: AIConfig[]) {
    this.configs = configs
  }

  setPersonality(personality: PersonalitySettings) {
    this.personality = personality
    // Persist to localStorage
    localStorage.setItem('ai_personality', JSON.stringify(personality))
  }

  getPersonality(): PersonalitySettings {
    const saved = localStorage.getItem('ai_personality')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load personality:', e)
      }
    }
    return this.personality
  }

  private getPersonalityPrompt(): string {
    const p = this.getPersonality()
    const levelDesc = [
      'extremely cautious and reserved',
      'very reserved',
      'reserved',
      'somewhat reserved',
      'neutral',
      'balanced',
      'somewhat engaging',
      'very engaging and friendly',
      'extremely engaging and enthusiastic',
      'maximally engaging and enthusiastic',
      'wildly enthusiastic and energetic'
    ][p.level] || 'balanced'

    const toneDesc = {
      professional: 'Use professional terminology and formal language',
      casual: 'Use casual, friendly language like talking to a friend',
      creative: 'Be creative, imaginative, and think outside the box',
      technical: 'Be precise, technical, and include implementation details'
    }[p.tone]

    return `You are Kael-OS, an AI assistant with the following personality:
- Overall engagement level: ${levelDesc}
- Communication style: ${toneDesc}
- Verbosity: ${p.verbose ? 'Provide detailed, comprehensive answers' : 'Be concise and to the point'}
${p.systemPrompt ? `- Additional instructions: ${p.systemPrompt}` : ''}

Maintain this personality consistently in all responses.`
  }

  async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    const startTime = Date.now()
    const errors: Array<{ config: AIConfig; error: string }> = []

    // Try each AI in order (active first, then others)
    const orderedConfigs = [
      ...this.configs.filter(c => c.isActive),
      ...this.configs.filter(c => !c.isActive)
    ]

    for (const config of orderedConfigs) {
      try {
        console.log(`[Kael-OS] Trying AI: ${config.name} (${config.type})`)

        let response: AIResponse | null = null

        if (config.type === 'local') {
          response = await this.tryLocalAI(config, messages)
        } else if (config.type === 'google-cloud') {
          response = await this.tryGoogleCloudAI(config, messages)
        } else if (config.type === 'openai') {
          response = await this.tryOpenAI(config, messages)
        }

        if (response) {
          response.latency = Date.now() - startTime
          console.log(`[Kael-OS] Success with ${config.name} (${response.latency}ms)`)
          return response
        }
      } catch (error) {
        const errorMsg = String(error)
        console.warn(`[Kael-OS] Failed with ${config.name}: ${errorMsg}`)
        errors.push({ config, error: errorMsg })
        // Continue to next config
      }
    }

    // All AIs failed
    const errorDetails = errors.map(e => `${e.config.name}: ${e.error}`).join('\n')
    throw new Error(`All AI backends failed:\n${errorDetails}`)
  }

  private async tryLocalAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse | null> {
    if (!config.endpoint || !config.model) {
      throw new Error('Local AI endpoint or model not configured')
    }

    const systemPrompt = this.getPersonalityPrompt()

    try {
      const response = await Promise.race([
        fetch(`${config.endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            stream: false
          })
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Local AI timeout')), this.requestTimeout)
        )
      ])

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Handle different local AI API formats
      let content = ''
      if (data.message?.content) {
        content = data.message.content
      } else if (data.response) {
        content = data.response
      } else if (data.choices?.[0]?.message?.content) {
        content = data.choices[0].message.content
      }

      if (!content) {
        throw new Error('No content in response')
      }

      return {
        content,
        model: config.model,
        source: 'local',
        latency: 0
      }
    } catch (error) {
      throw new Error(`Local AI error: ${String(error)}`)
    }
  }

  private async tryGoogleCloudAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse | null> {
    if (!config.apiKey || !config.projectId || !config.model) {
      throw new Error('Google Cloud credentials not configured')
    }

    const systemPrompt = this.getPersonalityPrompt()

    try {
      const response = await Promise.race([
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
              })),
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: {
                temperature: this.personality.level / 10,
                maxOutputTokens: 1024
              }
            })
          }
        ),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Google Cloud timeout')), this.requestTimeout)
        )
      ])

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`HTTP ${response.status}: ${error}`)
      }

      const data = await response.json()

      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!content) {
        throw new Error('No content in Google Cloud response')
      }

      return {
        content,
        model: config.model,
        source: 'google-cloud',
        latency: 0
      }
    } catch (error) {
      throw new Error(`Google Cloud error: ${String(error)}`)
    }
  }

  private async tryOpenAI(config: AIConfig, messages: AIMessage[]): Promise<AIResponse | null> {
    if (!config.apiKey || !config.model) {
      throw new Error('OpenAI credentials not configured')
    }

    const systemPrompt = this.getPersonalityPrompt()

    try {
      const response = await Promise.race([
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            temperature: this.personality.level / 10,
            max_tokens: 1024
          })
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('OpenAI timeout')), this.requestTimeout)
        )
      ])

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`HTTP ${response.status}: ${error}`)
      }

      const data = await response.json()

      const content = data.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }

      return {
        content,
        model: config.model,
        source: 'openai',
        latency: 0
      }
    } catch (error) {
      throw new Error(`OpenAI error: ${String(error)}`)
    }
  }

  async testConnection(config: AIConfig): Promise<boolean> {
    try {
      if (config.type === 'local' && config.endpoint) {
        const response = await Promise.race([
          fetch(`${config.endpoint}/api/tags`),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ])
        return response.ok
      } else if (config.type === 'google-cloud' && config.apiKey) {
        // Test by doing a simple models list call
        const response = await Promise.race([
          fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${config.apiKey}`
          ),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ])
        return response.ok
      } else if (config.type === 'openai' && config.apiKey) {
        const response = await Promise.race([
          fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ])
        return response.ok
      }
      return false
    } catch (error) {
      console.error('Test connection error:', error)
      return false
    }
  }
}

export const aiHybridService = new AIHybridService()
