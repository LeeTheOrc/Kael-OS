// Terminal service stub
export const terminalService = {
  async executeCommand(command: string) {
    return `$ ${command}`
  },

  async executeScript(script: string) {
    return `Executing: ${script}`
  },
}
