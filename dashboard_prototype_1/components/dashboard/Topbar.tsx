'use client'

import { Moon, Sun, CloudRain, RefreshCw } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Navigation from './Navigation'

export default function Topbar() {
  const { theme, toggle } = useTheme()

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <CloudRain size={22} />
        </div>
        <div>
          <h1>
            INDRA <span className="brand-subtitle">India&apos;s National Disaster &amp; Risk Analytics</span>
          </h1>
          <p>
            Integrated intelligence for weather, infrastructure, and public safety <span>— INDIA</span>
          </p>
        </div>
      </div>
      <div className="header-right">
        <Navigation />
        <div className="header-meta">
          <div>
            <span className="eyebrow">LAST UPDATED</span>
            <b>23 AUG 2026 · 14:32:08 IST</b>
          </div>
          <div className="online">
            <i /> ONLINE
          </div>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="refresh active">
            <RefreshCw size={14} /> Auto-refresh <b>30s</b>
          </button>
        </div>
      </div>
    </header>
  )
}
