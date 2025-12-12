import { useState } from 'react'

export const useTerminal = () => {
  const [output, setOutput] = useState<string[]>([])

  const executeCommand = async (command: string) => {
    setOutput(prev => [...prev, `$ ${command}`])
    // Terminal execution logic would go here
  }

  return { output, executeCommand }
}
