export interface FrozenSummaryData { categories: Record<string, { summary_zh: string }>; tracks: Record<string, { summary_zh: string }> }

export async function loadFrozenSummaries(): Promise<FrozenSummaryData> {
  const response = await fetch('/data/category_track_summaries_v1.json')
  if (!response.ok) throw new Error('无法加载冻结研究摘要。')
  return response.json() as Promise<FrozenSummaryData>
}

export function getCategorySummary(data: FrozenSummaryData, dimension: string, categoryId: string) {
  return data.categories[`${dimension}:${categoryId}`]
}

export function getTrackSummary(data: FrozenSummaryData, trackId: string) {
  return data.tracks[trackId]
}
