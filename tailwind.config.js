module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forge-bg': '#120e1a',
        'forge-panel': '#1c162b',
        'forge-border': '#3a2d56',
        'forge-text-primary': '#f7f2ff',
        'forge-text-secondary': '#a99ec3',
        
        'dragon-fire': '#ffcc00',
        'orc-steel': '#7aebbe',
        'magic-purple': '#e040fb',
        'rune-blue': '#60a5fa',
        'crimson-alert': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
