import { invoke } from '@tauri-apps/api/tauri'

export const kaelService = {
  async getChatHistory() {
    return invoke('get_chat_history')
  },

  async sendMessage(message: string) {
    return invoke('send_message', { message })
  },

  async getConfig() {
    return invoke('get_kael_config')
  },

  async saveConfig(config: any) {
    return invoke('save_kael_config', { config })
  },
}
