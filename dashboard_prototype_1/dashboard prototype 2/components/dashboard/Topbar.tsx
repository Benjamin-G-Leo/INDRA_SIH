'use client'

import { Moon, Sun, CloudRain, RefreshCw } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Navigation from './Navigation'
import { formatIST, type FreshnessState } from '@/lib/utils'

function FreshnessDot({ state }: { state: FreshnessState }) {
  return <span className={`freshness-dot freshness-dot--${state}`} />
}

export default function Topbar({
  currentTime,
  lastSync,
  freshness,
  syncing,
  onRefresh,
}: {
  currentTime?: Date | null
  lastSync?: Date
  freshness?: FreshnessState
  syncing?: boolean
  onRefresh?: () => void
}) {
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
        <div className="header-center">
          {currentTime !== undefined && (
            <div>
              <span className="eyebrow">CURRENT TIME (IST)</span>
              <b>{currentTime ? formatIST(currentTime) : '—'}</b>
            </div>
          )}
          {lastSync && freshness !== undefined && (
            <div>
              <span className="eyebrow">LAST UPDATED</span>
              <b>
                {formatIST(lastSync)}
                <FreshnessDot state={freshness} />
              </b>
            </div>
          )}
          <div className="online">
            <i aria-hidden="true" /> ONLINE
          </div>
        </div>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {onRefresh !== undefined && (
            <button
              className="refresh active"
              onClick={onRefresh}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? 'spin' : ''} />
              {syncing ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
