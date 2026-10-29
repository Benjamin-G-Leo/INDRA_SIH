'use client'

import Topbar from '@/components/dashboard/Topbar'
import FilterToolbar from '@/components/dashboard/FilterToolbar'
import { useSharedFilters } from '@/components/dashboard/FilterContext'
import AnalysisView from '@/components/dashboard/AnalysisView'

export default function AnalysisPage() {
  const { filters, setFilter, reset, loading, error } = useSharedFilters()

  // Loading state: no silent fallback to legacy data.
  if (loading) {
    return (
      <main className="dashboard analysis-page" id="main-content">
        <Topbar />
        <div className="loading">Loading incident data…</div>
      </main>
    )
  }

  // Error state: no silent fallback to legacy data.
  if (error) {
    return (
      <main className="dashboard analysis-page" id="main-content">
        <Topbar />
        <div className="error">Failed to load incident data: {error.message}</div>
      </main>
    )
  }

  return (
    <main className="dashboard analysis-page" id="main-content">
      <Topbar />
      <FilterToolbar filters={filters} setFilter={setFilter} reset={reset} />
      <AnalysisView />
    </main>
  )
}
