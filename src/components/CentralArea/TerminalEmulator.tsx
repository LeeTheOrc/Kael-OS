import React from 'react'

export const TerminalEmulator: React.FC = () => {
  return (
    <div className="flex-1 bg-black text-green-400 font-mono p-4 overflow-y-auto">
      <div>$ kael-os v0.1.0</div>
      <div>Ready for commands...</div>
    </div>
  )
}
