import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { loadDashboardData } from '../data/dashboardData'
import { loadFrozenSummaries, type FrozenSummaryData } from '../data/summaries'
import type { DashboardData } from '../data/types'

type DashboardState = { data: DashboardData | null; summaries: FrozenSummaryData | null; error: string | null }
const DashboardContext = createContext<DashboardState>({ data: null, summaries: null, error: null })

export function DashboardProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<DashboardState>({ data: null, summaries: null, error: null })

  useEffect(() => {
    Promise.all([loadDashboardData(), loadFrozenSummaries()]).then(([data, summaries]) => setState({ data, summaries, error: null })).catch((error: unknown) => {
      setState({ data: null, summaries: null, error: error instanceof Error ? error.message : '数据加载失败。' })
    })
  }, [])

  return <DashboardContext.Provider value={state}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  return useContext(DashboardContext)
}
