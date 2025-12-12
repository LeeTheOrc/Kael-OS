import React, { useState, useEffect } from 'react'
import { TopMenu } from './components/TopMenu/TopMenu'
import { LeftPanel } from './components/LeftPanel/LeftPanel'
import { RightPanel } from './components/RightPanel/RightPanel'
import { KaelChat } from './components/CentralArea/KaelChat'
import './App.css'

export const App: React.FC = () => {
  const [leftPanelVisible, setLeftPanelVisible] = useState(true)
  const [rightPanelVisible, setRightPanelVisible] = useState(true)

  useEffect(() => {
    console.log('App component mounted')
  }, [])

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#120e1a', color: '#f7f2ff', width: '100%', height: '100vh', margin: 0, padding: 0, display: 'flex' }}>
      <TopMenu 
        onToggleLeftPanel={() => setLeftPanelVisible(!leftPanelVisible)}
        onToggleRightPanel={() => setRightPanelVisible(!rightPanelVisible)}
      />
      
      <div className="flex flex-1 overflow-hidden" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {leftPanelVisible && <LeftPanel />}
        <KaelChat />
        {rightPanelVisible && <RightPanel />}
      </div>
    </div>
  )
}
