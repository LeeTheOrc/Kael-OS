import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

console.log('main.tsx loading...')
console.log('root element at load:', document.getElementById('root'))

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  // Create a fallback root
  const fallback = document.createElement('div')
  fallback.id = 'root'
  fallback.style.cssText = 'width: 100%; height: 100%; background: #120e1a; color: red; display: flex; align-items: center; justify-content: center; font-family: Arial;'
  fallback.innerHTML = '<div><h1>Error: root element not found in HTML</h1></div>'
  document.body.appendChild(fallback)
  console.error('Created fallback root element')
} else {
  console.log('Root element found, mounting React')
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    console.log('React mounted successfully')
  } catch (error) {
    console.error('Error mounting React:', error)
    if (rootElement) {
      rootElement.innerHTML = '<div style="background: #120e1a; color: red; padding: 20px; font-family: Arial;"><h1>Error mounting React</h1><p>' + String(error) + '</p></div>'
    }
  }
}
