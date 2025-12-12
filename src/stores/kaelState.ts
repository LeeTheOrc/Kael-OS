import { create } from 'zustand'
import { Message, KaelConfig } from '../types'

interface KaelState {
  messages: Message[]
  config: KaelConfig
  addMessage: (msg: Message) => void
  setConfig: (cfg: KaelConfig) => void
}

export const useKaelStore = create<KaelState>((set) => ({
  messages: [],
  config: {
    personality_level: 7,
    cloud_enabled: true,
    local_core_enabled: true,
    auto_sync: true,
  },
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setConfig: (cfg) => set({ config: cfg }),
}))
