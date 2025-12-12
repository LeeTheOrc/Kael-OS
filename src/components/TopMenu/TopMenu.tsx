import React from 'react'

interface TopMenuProps {
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({ onToggleLeftPanel, onToggleRightPanel }) => {
  return (
    <div style={{ 
      backgroundColor: '#1c162b', 
      borderBottom: '1px solid #3a2d56',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffcc00' }}>Kael-OS</h1>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={onToggleLeftPanel}
          style={{
            padding: '8px 12px',
            backgroundColor: '#120e1a',
            border: '1px solid #3a2d56',
            borderRadius: '4px',
            color: '#f7f2ff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ☰ Left
        </button>
        <button 
          onClick={onToggleRightPanel}
          style={{
            padding: '8px 12px',
            backgroundColor: '#120e1a',
            border: '1px solid #3a2d56',
            borderRadius: '4px',
            color: '#f7f2ff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Right ☰
        </button>
      </div>
    </div>
  )
}
