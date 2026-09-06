export type Dimension = 'scenario' | 'business_domain' | 'technology'
export type MetricType = 'coverage' | 'sample_share'
export type DetailSection = 'salary' | 'association' | 'profile' | 'company'

export interface CountMetric {
  label: string
  count: number
  coverage?: number
  share?: number
}

export interface DimensionItem {
  category_id: string
  label: string
  label_zh: string
  count: number
  share_or_coverage: number
  metric_type: MetricType
}

export interface CrossDimensionItem {
  label: string
  label_zh: string
  count: number
  coverage: number
}

export interface SalarySummary {
  median_mid_k: number | null
  median_low_k: number | null
  median_high_k: number | null
}

export interface SalaryJourneyPoint {
  experience_point: string
  n: number
  median_mid_k: number | null
  median_low_k: number | null
  median_high_k: number | null
  confidence: 'normal' | 'low' | 'very_low'
}

export interface RequirementMetric extends CountMetric {
  required_count: number
  required_coverage: number
  preferred_count: number
  preferred_coverage: number
}

export interface DepthMetric extends CountMetric {
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'Unclear'
}

export interface CapabilityMetric {
  count: number
  coverage: number
}

export interface CapabilityBoundary {
  traditional_pm: CapabilityMetric
  ai_native_ownership: CapabilityMetric
  hands_on_validation: CapabilityMetric
  deep_technical: CapabilityMetric
}

export interface CategoryDetail {
  category_id: string
  dimension: Dimension
  label: string
  label_zh: string
  job_count: number
  sample_share_or_coverage: number
  metric_type: MetricType
  salary: SalarySummary
  experience: CountMetric[]
  salary_experience_journey: SalaryJourneyPoint[]
  cross_dimensions: Partial<Record<Dimension, CrossDimensionItem[]>>
  work_profile: {
    responsibilities: CountMetric[]
    requirements: RequirementMetric[]
    depth: DepthMetric[]
    capability_boundary: CapabilityBoundary
  }
  company: {
    company_size: CountMetric[]
    financing_stage: CountMetric[]
  }
}

export interface Track {
  track_id: string
  track_name_zh: string
  job_count: number
  sample_coverage: number
  salary_mid_median_k: number | null
  experience_distribution: CountMetric[]
  top_responsibilities: CountMetric[]
  top_required: CountMetric[]
  top_preferred: CountMetric[]
  depth_distribution: DepthMetric[]
  capability_boundary: CapabilityBoundary
  company_size: CountMetric[]
  financing_stage: CountMetric[]
}

export interface ObservationDirection {
  id: string
  name_zh: string
  job_count: number
  sample_coverage: number
}

export interface DashboardData {
  meta: {
    sample_size: number
    scope: string
    method_note: string
    salary_note: string
  }
  landing_signals: Array<{ value: string; value_k?: number; label: string; note: string }>
  dimension_overview: Record<Dimension, DimensionItem[]>
  overall_work_profile: Record<string, unknown>
  category_details: Record<Dimension, Record<string, CategoryDetail>>
  track_layer: {
    method_note: string
    tracks: Track[]
    observation_directions: ObservationDirection[]
    overlap_matrix: unknown
  }
}
