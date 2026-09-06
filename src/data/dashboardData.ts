import type { CategoryDetail, DashboardData, Dimension, DimensionItem, ObservationDirection, Track } from './types'

export interface CategoryRouteItem extends DimensionItem {
  id: string
}

const dimensions: Dimension[] = ['scenario', 'business_domain', 'technology']

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<DashboardData>
  return dimensions.every((dimension) => Array.isArray(data.dimension_overview?.[dimension]))
    && dimensions.every((dimension) => typeof data.category_details?.[dimension] === 'object')
    && Array.isArray(data.landing_signals)
    && Array.isArray(data.track_layer?.tracks)
}

export async function loadDashboardData(): Promise<DashboardData> {
  const response = await fetch('/data/dashboard_aggregate_final_v2.json')
  if (!response.ok) throw new Error('无法加载公开聚合数据。')
  const payload: unknown = await response.json()
  if (!isDashboardData(payload)) throw new Error('公开聚合数据结构不符合 Dashboard V1。')
  return payload
}

export function getLandingSignals(data: DashboardData) {
  return data.landing_signals
}

export function getDimensionOverview(data: DashboardData, dimension: Dimension): CategoryRouteItem[] {
  return data.dimension_overview[dimension].map((item) => ({
    ...item,
    id: item.category_id,
  }))
}

export function getCategoryDetail(data: DashboardData, dimension: Dimension, categoryId: string): CategoryDetail | undefined {
  const routeItem = getDimensionOverview(data, dimension).find((item) => item.id === categoryId)
  if (!routeItem) return undefined
  const label = routeItem.label
  return data.category_details[dimension][label]
}

export function getTrackOverview(data: DashboardData): Track[] {
  return data.track_layer.tracks
}

export function getTrackDetail(data: DashboardData, trackId: string): Track | undefined {
  return data.track_layer.tracks.find((track) => track.track_id === trackId)
}

export function getObservationDirections(data: DashboardData): ObservationDirection[] {
  return data.track_layer.observation_directions
}

export function getOverallWorkProfile(data: DashboardData) {
  return data.overall_work_profile
}

export function isDimension(value: string | undefined): value is Dimension {
  return Boolean(value && dimensions.includes(value as Dimension))
}
