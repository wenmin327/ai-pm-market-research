import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCategoryDetail, getDimensionOverview, getLandingSignals, getObservationDirections, getOverallWorkProfile, getTrackDetail, getTrackOverview, isDimension } from './data/dashboardData'
import { getCategorySummary, getTrackSummary } from './data/summaries'
import type { CategoryDetail, DetailSection, Dimension, SalaryJourneyPoint } from './data/types'
import { DashboardProvider, useDashboardData } from './app/DashboardContext'
import { displayLabel, formatSalaryWanFromK } from './display'

const DIMENSIONS: Array<{ id: Dimension; zh: string }> = [{ id: 'scenario', zh: '应用场景' }, { id: 'business_domain', zh: '业务领域' }, { id: 'technology', zh: 'AI技术' }]
const SECTIONS: Array<{ id: DetailSection; label: string; no: string }> = [{ id: 'salary', label: '薪资与经验', no: '01' }, { id: 'association', label: '分类关联', no: '02' }, { id: 'profile', label: '工作画像', no: '03' }, { id: 'company', label: '招聘主体', no: '04' }]
const TRACK_SECTIONS = [{ id: 'overview', label: '方向概览与薪资经验', no: '01' }, { id: 'profile', label: '工作画像', no: '02' }, { id: 'company', label: '招聘主体', no: '03' }] as const
const MAP_KEY = 'ai-pm-map-state'
type MapState = { perspective: Dimension; selected?: string; x: number; y: number }
const mapState = (): MapState | null => { try { const state = JSON.parse(sessionStorage.getItem(MAP_KEY) ?? 'null'); return state && isDimension(state.perspective) ? state : null } catch { return null } }
const saveMap = (state: MapState) => sessionStorage.setItem(MAP_KEY, JSON.stringify(state))
const metric = (type: string) => type === 'sample_share' ? '样本占比' : '岗位覆盖率'
const money = formatSalaryWanFromK
const Boundary = () => <p className="boundary">北京 · 228条招聘JD观察样本 · 非随机市场抽样</p>

function ScrollSpy() {
  const location = useLocation()
  const navigate = useNavigate()
  const isCategory = location.pathname.startsWith('/category/')
  const isTrack = location.pathname.startsWith('/tracks/')
  const sections: ReadonlyArray<{ id: string }> | null = isCategory ? SECTIONS : isTrack ? TRACK_SECTIONS : null

  useEffect(() => {
    if (!sections) return
    let frame = 0
    const update = () => {
      const anchor = 136
      const current = sections.reduce((best, section) => {
        const top = document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity
        const bestTop = document.getElementById(best)?.getBoundingClientRect().top ?? -Infinity
        return top <= anchor && top > bestTop ? section.id : best
      }, sections[0].id)
      const target = document.querySelector(`[data-section-nav="${current}"]`)
      document.querySelectorAll<HTMLElement>('[data-section-nav]').forEach((button) => button.classList.toggle('active', button === target))
      if (new URLSearchParams(location.search).get('section') !== current) navigate(`${location.pathname}?section=${current}`, { replace: true })
    }
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll) }
  }, [location.pathname, location.search, navigate, sections])
  return null
}
function DataRoutes() { const { data, summaries, error } = useDashboardData(); if (error) return <main className="status">{error}</main>; if (!data || !summaries) return <main className="status">加载公开聚合数据…</main>; return <><ScrollSpy /><Routes><Route path="/" element={<Landing />} /><Route path="/map" element={<Map />} /><Route path="/category/:dimension/:id" element={<Category />} /><Route path="/tracks" element={<Tracks />} /><Route path="/tracks/:trackId" element={<TrackDetail />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></> }

function Landing() { const { data } = useDashboardData(); if (!data) return null; const signals = getLandingSignals(data); const layer = (index: number) => index === 0 || index === 1 || index === 4 ? 'foreground' : index === 2 || index === 3 || index === 5 ? 'midground' : 'background'; return <main className="landing"><header><Boundary /><span>AI PM 市场调研 / V1</span></header><section className="landingTitle"><h1>AI PM<br />市场调研</h1><p>从 228 条北京 AI 产品经理招聘 JD 出发，看看现在市场在招什么、做什么，以及不同方向的机会与门槛。</p></section><section className="signalField" aria-label="市场信号">{signals.map((signal, index) => <article className={`signal s${index} ${layer(index)}`} key={signal.label}><strong>{signal.value_k != null ? money(signal.value_k) : signal.value}</strong><span>{displayLabel(signal.label)}</span><small>{signal.note}</small></article>)}</section><nav className="landingNav"><Link className="primary" to="/map?perspective=scenario">探索市场结构 <b>→</b></Link><Link to="/tracks">查看 AI PM 求职方向 →</Link></nav></main> }

function Map() { const { data } = useDashboardData(); const [params] = useSearchParams(); const navigate = useNavigate(); const didRestore = useRef(false); const fallback = mapState()?.perspective ?? 'scenario'; const perspective = isDimension(params.get('perspective') ?? fallback) ? (params.get('perspective') ?? fallback) as Dimension : 'scenario'; const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null); const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null); if (!data) return null; const items = getDimensionOverview(data, perspective); const meta = DIMENSIONS.find((item) => item.id === perspective)!; const highlightedCategoryId = hoveredCategoryId ?? focusedCategoryId;
  useEffect(() => { const state = mapState(); if (!didRestore.current && state?.perspective === perspective) { didRestore.current = true; requestAnimationFrame(() => window.scrollTo(state.x, state.y)) } }, [perspective]); useEffect(() => { const persist = () => saveMap({ perspective, x: window.scrollX, y: window.scrollY }); window.addEventListener('scroll', persist, { passive: true }); return () => { persist(); window.removeEventListener('scroll', persist) } }, [perspective]);
  return <main className={`map map--${perspective}`}><header><Link to="/">AI PM / 228</Link><Boundary /><Link to="/tracks">研究解释层 →</Link></header><section className="mapIntro"><span>市场分类地图</span><h1>{meta.zh}</h1><p>{perspective === 'business_domain' ? '单标签分类；以下数值为样本占比。' : '多标签分类，一条岗位可能覆盖多个类别，因此覆盖率之和不等于100%。'}</p></section><div className="perspectives" aria-label="事实分类视角">{DIMENSIONS.map((item, index) => <button className={item.id === perspective ? 'active' : ''} onClick={() => { setHoveredCategoryId(null); setFocusedCategoryId(null); saveMap({ perspective: item.id, x: 0, y: 0 }); navigate(`/map?perspective=${item.id}`) }} key={item.id}><i>0{index + 1}</i>{item.zh}</button>)}</div><section className={`constellation ${highlightedCategoryId ? 'dimmed' : ''}`}>{items.map((item, index) => <Link onMouseEnter={() => setHoveredCategoryId(item.id)} onMouseLeave={() => setHoveredCategoryId(null)} onFocus={() => setFocusedCategoryId(item.id)} onBlur={() => setFocusedCategoryId(null)} onClick={() => { saveMap({ perspective, x: window.scrollX, y: window.scrollY }) }} className={`node ${index < 3 ? 'large' : index < 8 ? 'medium' : ''} ${highlightedCategoryId === item.id ? 'active' : ''}`} style={{ '--n': index } as React.CSSProperties} to={`/category/${perspective}/${item.id}`} key={item.id}><i>{String(index + 1).padStart(2, '0')}</i><strong>{displayLabel(item.label_zh)}</strong><b>{item.share_or_coverage}%</b><small>{item.count} 个样本岗位 · {metric(item.metric_type)}</small></Link>)}</section></main> }

function Category() { const { data } = useDashboardData(); const { dimension, id } = useParams(); if (!data || !isDimension(dimension) || !id) return <Navigate to="/map?perspective=scenario" replace />; const detail = getCategoryDetail(data, dimension, id); return detail ? <Detail detail={detail} dimension={dimension} /> : <Navigate to={`/map?perspective=${dimension}`} replace /> }
function Detail({ detail, dimension }: { detail: CategoryDetail; dimension: Dimension }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requestedSection = params.get('section') as DetailSection | null
  const active = SECTIONS.some((section) => section.id === requestedSection) ? requestedSection! : 'salary'
  const { summaries } = useDashboardData()
  const summary = summaries ? getCategorySummary(summaries, dimension, detail.category_id) : undefined
  useLayoutEffect(() => { if (!requestedSection || !SECTIONS.some((section) => section.id === requestedSection)) window.scrollTo(0, 0) }, [detail.category_id])
  const goto = (section: DetailSection) => {
    navigate(`?section=${section}`, { replace: true })
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return <main className="detail"><header className="detailHead"><Link to={`/map?perspective=${dimension}`}>← 返回分类地图</Link><span>分类数据实验室 / {DIMENSIONS.find((x) => x.id === dimension)?.zh}</span><h1>{displayLabel(detail.label_zh)}</h1><div><b>{detail.job_count}</b> 个岗位　 <b>{detail.sample_share_or_coverage}%</b> {metric(detail.metric_type)}</div>{summary && <p className="researchSummary"><i>研究摘要</i>{summary.summary_zh}</p>}<p>基于冻结观察样本的事实描述，不代表总体市场。</p></header><aside>{SECTIONS.map((section) => <button data-section-nav={section.id} className={active === section.id ? 'active' : ''} onClick={() => goto(section.id)} key={section.id}><i>{section.no}</i>{section.label}</button>)}</aside><article className="detailContent"><section id="salary"><Label no="01" text="薪资与经验" /><h2>薪资与经验</h2><div className="salary"><div><span>样本年薪区间中点中位数</span><strong>{money(detail.salary.median_mid_k)}</strong><small>中位区间：{money(detail.salary.median_low_k)} — {money(detail.salary.median_high_k)}</small></div><p>该图表示岗位经验要求覆盖范围与对应招聘薪资分布，并非个人工作年限增长后的薪资曲线。</p></div><h3>经验要求构成</h3><Distribution items={detail.experience} /><Journey points={detail.salary_experience_journey} /></section><section id="association"><Label no="02" text="分类关联" /><h2>分类关联</h2><Cross detail={detail} /></section><section id="profile"><Label no="03" text="工作画像" /><h2>工作画像</h2><Profile detail={detail} /></section><section id="company"><Label no="04" text="招聘主体" /><h2>招聘主体结构</h2><CompanyLandscape size={detail.company.company_size} financing={detail.company.financing_stage} /></section></article></main>
}
const Label = ({ no, text }: { no: string; text: string }) => <p className="label">{no} / {text}</p>
function Distribution({ items }: { items: Array<{ label: string; count: number; share?: number; coverage?: number }> }) { return <div className="distribution">{items.map((item) => { const value = item.share ?? item.coverage ?? 0; return <div key={item.label}><span>{displayLabel(item.label)}</span><b>{value}%</b><i style={{ width: `${value}%` }} /></div> })}</div> }
type HiringMetric = { label: string; count: number; share?: number }
const COMPANY_SIZE_ORDER = ['10000人以上', '1000-9999人', '500-999人', '100-499人', '20-99人', '0-20人']
const FINANCING_ORDER = ['已上市', 'D轮及以上', 'C轮', 'B轮', 'A轮', '天使轮', '未融资', '不需要融资', '未披露']
function HiringBars({ title, items, order, note }: { title: string; items: HiringMetric[]; order: string[]; note?: string }) { const ordered = order.map((label) => items.find((item) => item.label === label)).filter((item): item is HiringMetric => Boolean(item)); const max = Math.max(...ordered.map((item) => item.count), 1); return <div className="hiringModule"><h3>{title}</h3>{note && <p className="hiringNote">{note}</p>}<div className="hiringBars">{ordered.map((item) => <div className="hiringBar" key={item.label}><span>{displayLabel(item.label)}</span><i><em style={{ width: `${(item.count / max) * 100}%` }} /></i><b>{item.count} 岗位</b><small>{item.share}%</small></div>)}</div></div> }
function CompanyLandscape({ size, financing }: { size: HiringMetric[]; financing: HiringMetric[] }) { return <div className="companyLandscape"><HiringBars title="公司规模构成" items={size} order={COMPANY_SIZE_ORDER} /><HiringBars title="融资阶段 / 状态构成" items={financing} order={FINANCING_ORDER} note="顺序按企业资本阶段 / 状态组织，横条长度代表对应状态的招聘岗位数量。" /><p className="note">公司规模与融资阶段为两个独立分布，不表示两者存在对应关系。</p></div> }
function Journey({ points }: { points: SalaryJourneyPoint[] }) {
  const valid = points.filter((p) => p.median_mid_k != null); const values = valid.map((p) => p.median_mid_k!); const min = Math.floor(Math.min(...values) / 50) * 50; const max = Math.ceil(Math.max(...values) / 50) * 50; const ticks = [min, min + (max - min) / 2, max]; const y = (v: number) => 175 - ((v - min) / Math.max(1, max - min)) * 120
  return <div className="journey"><div><h3>薪资 × 经验要求分布</h3><span>纵轴：薪资（万元）</span></div><svg viewBox="0 0 1000 220" role="img" aria-label="岗位经验要求与对应招聘薪资分布"><line className="axis" x1="90" y1="180" x2="970" y2="180" />{ticks.map((tick) => <g key={tick}><line className="gridline" x1="90" x2="970" y1={y(tick)} y2={y(tick)} /><text x="80" y={y(tick) + 5} textAnchor="end">{money(tick)}</text></g>)}{points.slice(1).map((to, i) => { const from = points[i]; return from.n >= 5 && to.n >= 5 && from.median_mid_k != null && to.median_mid_k != null ? <line className={from.n >= 10 && to.n >= 10 ? 'line' : 'line low'} key={to.experience_point} x1={90 + i * 88} y1={y(from.median_mid_k)} x2={90 + (i + 1) * 88} y2={y(to.median_mid_k)} /> : null })}{points.map((p, i) => <g key={p.experience_point}><text x={90 + i * 88} y="208" textAnchor="middle">{p.experience_point}</text>{p.median_mid_k != null && <circle tabIndex={0} role="img" aria-label={`${p.experience_point}年，${money(p.median_mid_k)}，样本 N=${p.n}`} className={p.n >= 10 ? 'point' : p.n >= 5 ? 'point low' : 'point weak'} cx={90 + i * 88} cy={y(p.median_mid_k)} r={p.n < 5 ? 4 : 7}><title>{`${p.experience_point}年｜${money(p.median_mid_k)}｜Sample N = ${p.n}`}</title></circle>}</g>)}</svg><p>N ≥ 10 正常显示　N = 5–9 降低权重　N &lt; 5 仅观察点　n = 0 不显示点位</p></div>
}
function Cross({ detail }: { detail: CategoryDetail }) { const { data } = useDashboardData(); if (!data) return null; return <div className="columns">{Object.entries(detail.cross_dimensions).map(([dimension, items]) => <div className="relationship" key={dimension}><h3>{DIMENSIONS.find((x) => x.id === dimension)?.zh}</h3>{items?.slice(0, 12).map((item) => { const target = getDimensionOverview(data, dimension as Dimension).find((x) => x.label === item.label); return target ? <Link key={item.label} to={`/category/${dimension}/${target.id}`}><span>{displayLabel(item.label_zh)}</span><b>{item.coverage}%</b><i style={{ width: `${item.coverage}%` }} /></Link> : <div key={item.label}><span>{displayLabel(item.label_zh)}</span><b>{item.coverage}%</b></div> })}</div>)}</div> }
function Profile({ detail }: { detail: CategoryDetail }) { const { work_profile: p } = detail; return <div className="profile"><div><h3>01 / 主要在做什么</h3><Ranking items={p.responsibilities.slice(0, 10)} /></div><div><h3>02 / 公司在找什么样的人</h3><p className="note">总覆盖率区分必备要求与加分项；加分项不代表硬门槛。</p><div className="requirements">{p.requirements.slice(0, 10).map((item) => <div key={item.label}><span>{displayLabel(item.label)}</span><b>{item.coverage}%</b><p><i className="required" style={{ width: `${item.required_coverage}%` }} /><i className="preferred" style={{ width: `${item.preferred_coverage}%` }} /></p><small>必备要求 {item.required_coverage}% · 加分项 {item.preferred_coverage}%</small></div>)}</div></div></div> }
function Ranking({ items }: { items: Array<{ label: string; coverage?: number }> }) { return <ol className="ranking">{items.map((item, i) => <li key={item.label}><i>{String(i + 1).padStart(2, '0')}</i><span>{displayLabel(item.label)}</span><b>{item.coverage}%</b></li>)}</ol> }
function Depth({ items }: { items: Array<{ level: string; label?: string; coverage?: number }> }) { return <div className="depth">{items.map((item) => { const coverage = item.coverage ?? 0; return <div key={item.level}><span>{item.level}</span><i style={{ height: `${Math.max(4, coverage)}%` }} /><b>{coverage}%</b><small>{item.label}</small></div> })}</div> }
function BoundaryChart({ boundary }: { boundary: CategoryDetail['work_profile']['capability_boundary'] }) { const items = [{ key: 'traditional_pm', text: '传统 PM 基本功' }, { key: 'ai_native_ownership', text: 'AI-native 职责' }, { key: 'hands_on_validation', text: '亲手验证' }, { key: 'deep_technical', text: '深度技术参与' }] as const; return <div className="boundaryExpansion">{items.map((item, index) => <div key={item.key}><i>0{index + 1}</i><span>{item.text}</span><b>{boundary[item.key].coverage}%</b><em style={{ width: `${boundary[item.key].coverage}%` }} /></div>)}</div> }

function OverallProfile() {
  const { data } = useDashboardData()
  if (!data) return null
  const profile = getOverallWorkProfile(data) as CategoryDetail['work_profile']
  return <section className="overallProfile"><Label no="01" text="AI PM 整体画像" /><h2>AI PM 整体画像</h2><p>从当前观察样本看，AI PM 的工作既保留传统产品职责，也延伸到 AI 原生方案主导、动手验证与更深的技术参与。</p><div className="overallProfileGrid"><div><h3>技术参与深度</h3><Depth items={profile.depth} /></div><div><h3>岗位能力边界</h3><BoundaryChart boundary={profile.capability_boundary} /></div></div></section>
}
function Tracks() { const { data } = useDashboardData(); if (!data) return null; const observationName = (id: string) => id === 'consumer_ai_assistant_companion' ? 'C端 AI 助手 / 陪伴' : id === 'recommendation_personalization' ? '推荐与个性化' : ''; return <main className="tracks"><header><Link to="/">AI PM / 228</Link><span>研究解释层</span><h1>AI PM<br />求职方向</h1><p>Track 是基于招聘样本共现结构与岗位画像形成的研究解释，不是招聘平台原生分类；不同 Track 允许岗位重叠，因此覆盖率不可相加解释为市场份额。</p></header><OverallProfile /><section className="trackIndex"><Label no="02" text="主要求职方向" />{getTrackOverview(data).map((track, i) => <Link to={`/tracks/${track.track_id}`} key={track.track_id}><i>{String(i + 1).padStart(2, '0')}</i><h2>{track.track_name_zh}</h2><span><b>{track.job_count}</b> 岗位覆盖数</span><span><b>{track.sample_coverage}%</b> 样本覆盖率</span><span><b>{money(track.salary_mid_median_k)}</b> 年薪区间中点中位数</span><span><b>{track.capability_boundary.hands_on_validation.coverage}%</b> 动手验证</span><em>→</em></Link>)}</section><section className="observations"><div className="observationIntro"><Label no="03" text="观察方向" /><p>以下方向在当前样本中已形成一定招聘信号，但尚未纳入主要求职方向，因此暂作为观察方向持续跟踪。</p></div><div className="observationItems">{getObservationDirections(data).map((item) => <article key={item.id}><h3>{observationName(item.id) || item.name_zh}</h3><span><b>{item.job_count}</b> 岗位 · {item.sample_coverage}% 覆盖率</span></article>)}</div></section></main> }
function TrackDetail() {
  const { data, summaries } = useDashboardData()
  const { trackId } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const requestedSection = params.get('section') as (typeof TRACK_SECTIONS)[number]['id'] | null
  const active = TRACK_SECTIONS.some((section) => section.id === requestedSection) ? requestedSection! : 'overview'
  useLayoutEffect(() => { if (!requestedSection || !TRACK_SECTIONS.some((section) => section.id === requestedSection)) window.scrollTo(0, 0) }, [trackId])
  if (!data || !trackId) return <Navigate to="/tracks" replace />
  const track = getTrackDetail(data, trackId)
  if (!track) return <Navigate to="/tracks" replace />
  const summary = summaries ? getTrackSummary(summaries, track.track_id) : undefined
  const goto = (section: (typeof TRACK_SECTIONS)[number]['id']) => { navigate(`?section=${section}`, { replace: true }); document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  return <main className="trackDetail"><header><Link to="/tracks">← 返回 AI PM 求职方向</Link><span>研究解释层 / 方向详情</span><h1>{track.track_name_zh}</h1><div><b>{track.job_count}</b> 岗位　 <b>{track.sample_coverage}%</b> 覆盖率　 <b>{money(track.salary_mid_median_k)}</b> 样本年薪区间中点中位数</div>{summary && <p className="researchSummary"><i>研究摘要</i>{summary.summary_zh}</p>}<p>Track 为基于招聘样本共现结构与岗位画像形成的研究解释，不是招聘平台原生分类；不同 Track 允许岗位重叠，因此覆盖率不可相加解释为市场份额。</p></header><aside>{TRACK_SECTIONS.map((section) => <button data-section-nav={section.id} className={active === section.id ? 'active' : ''} onClick={() => goto(section.id)} key={section.id}><i>{section.no}</i>{section.label}</button>)}</aside><article><section id="overview"><Label no="01" text="方向概览与薪资经验" /><h2>方向概览与薪资经验</h2><div className="salary"><div><span>样本年薪区间中点中位数</span><strong>{money(track.salary_mid_median_k)}</strong><small>{track.job_count} 个岗位覆盖 · {track.sample_coverage}% 样本覆盖率</small></div><p>薪资为该 Track 覆盖岗位的年薪区间中点中位数；经验要求为样本中岗位要求的分布。</p></div><h3>经验要求构成</h3><Distribution items={track.experience_distribution} /></section><section id="profile"><Label no="02" text="工作画像" /><h2>工作画像</h2><div className="profile"><div><h3>主要在做什么</h3><Ranking items={track.top_responsibilities} /></div><div><h3>公司在找什么样的人</h3><div className="columns"><div><p className="note">必备要求</p><Ranking items={track.top_required} /></div><div><p className="note">加分项</p><Ranking items={track.top_preferred} /></div></div></div></div></section><section id="company"><Label no="03" text="招聘主体" /><h2>招聘主体结构</h2><CompanyLandscape size={track.company_size} financing={track.financing_stage} /></section></article></main>
}
export default function App() { return <BrowserRouter><DashboardProvider><DataRoutes /></DashboardProvider></BrowserRouter> }
