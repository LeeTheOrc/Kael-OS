import { useState } from 'react'
import { Message } from '../types'

export const useChatHistory = () => {
  const [messages, setMessages] = useState<Message[]>([])

  const addMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg])
  }

  const clearHistory = () => {
    setMessages([])
  }

  return { messages, addMessage, clearHistory }
}
