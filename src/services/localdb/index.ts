// Local database service stub
export const localdbService = {
  async getChatHistory() {
    return []
  },

  async saveChatMessage(message: any) {
    console.log('Saving message locally:', message)
  },

  async getScripts() {
    return []
  },
}
