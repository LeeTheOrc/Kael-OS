// Common local AI endpoints and their typical ports
const LOCAL_AI_ENDPOINTS = [
  { name: 'Ollama', port: 11434, path: '/api/tags', modelPath: 'models' },
  { name: 'LM Studio', port: 1234, path: '/v1/models', modelPath: 'data.data' },
  { name: 'llama.cpp', port: 8000, path: '/v1/models', modelPath: 'data' },
  { name: 'Oobabooga', port: 5000, path: '/api/v1/model', modelPath: null },
  { name: 'vLLM', port: 8000, path: '/v1/models', modelPath: 'data' },
  { name: 'LocalAI', port: 8080, path: '/v1/models', modelPath: 'data' },
]

export interface DetectedLocalAI {
  name: string
  endpoint: string
  models: string[]
  available: boolean
}

class LocalAIDetector {
  async scanForLocalAIs(): Promise<DetectedLocalAI[]> {
    const detected: DetectedLocalAI[] = []

    // Try common localhost variations
    const hosts = ['127.0.0.1', 'localhost']
    
    for (const config of LOCAL_AI_ENDPOINTS) {
      for (const host of hosts) {
        const endpoint = `http://${host}:${config.port}`
        
        try {
          const available = await this.testEndpoint(endpoint, config.path)
          
          if (available) {
            let models: string[] = []
            
            try {
              const response = await fetch(`${endpoint}${config.path}`)
              if (response.ok) {
                const data = await response.json()
                models = this.extractModels(data, config.modelPath)
              }
            } catch (e) {
              // Models list not available, that's ok
              console.log(`Could not fetch models from ${config.name}`)
            }

            detected.push({
              name: config.name,
              endpoint,
              models: models.length > 0 ? models : ['(detected but models unknown)'],
              available: true
            })
            break // Found this AI, no need to check other hosts
          }
        } catch (error) {
          // Continue to next
        }
      }
    }

    return detected
  }

  private async testEndpoint(endpoint: string, path: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${endpoint}${path}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      return response.ok
    } catch (error) {
      return false
    }
  }

  private extractModels(data: any, modelPath: string | null): string[] {
    if (!modelPath) {
      return []
    }

    try {
      const keys = modelPath.split('.')
      let current = data
      
      for (const key of keys) {
        if (current === null || current === undefined) {
          return []
        }
        current = current[key]
      }

      if (Array.isArray(current)) {
        return current
          .map((item: any) => {
            if (typeof item === 'string') return item
            if (item.name) return item.name
            if (item.id) return item.id
            return null
          })
          .filter((m: string | null): m is string => m !== null)
      }
      
      return []
    } catch (error) {
      console.error('Error extracting models:', error)
      return []
    }
  }
}

export const localAIDetector = new LocalAIDetector()
