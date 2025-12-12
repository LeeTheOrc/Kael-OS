import React from 'react'

export const LeftPanel: React.FC = () => {
  return (
    <div style={{ width: '256px', backgroundColor: '#1c162b', borderRight: '1px solid #3a2d56', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #3a2d56' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffcc00' }}>Explorer</h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ padding: '8px', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }}>
          📁 Scripts
        </div>
        <div style={{ padding: '8px', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }}>
          🔧 Tools
        </div>
        <div style={{ padding: '8px', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }}>
          📚 Library
        </div>
      </div>
    </div>
  )
}
