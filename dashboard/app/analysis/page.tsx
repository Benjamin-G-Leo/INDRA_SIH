'use client'

import Topbar from '@/components/dashboard/Topbar'
import FilterToolbar, { useFilters } from '@/components/dashboard/FilterToolbar'
import AnalysisView from '@/components/dashboard/AnalysisView'

export default function AnalysisPage() {
  const { filters, setFilter, reset } = useFilters()

  return (
    <main className="dashboard">
      <Topbar />
      <FilterToolbar filters={filters} setFilter={setFilter} reset={reset} />
      <AnalysisView />
    </main>
  )
}
