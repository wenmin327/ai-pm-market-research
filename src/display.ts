const labels: Record<string, string> = {
  'Content Creation & Media Production': '内容创作与媒体生产', 'Knowledge & Information Services': '知识与信息服务', 'Workflow & Business Automation': '工作流与业务自动化', 'Conversational Assistant & Companion': '对话助手与陪伴', 'Customer Service & Support': '客户服务与支持', 'Marketing & Advertising': '营销与广告', 'Sales & Commerce': '销售与商业', 'Recommendation & Personalization': '推荐与个性化', 'Data Analysis & Decision Support': '数据分析与决策支持', 'Recruitment & HR': '招聘与人力资源', 'Professional / Domain Assistance': '专业领域辅助', 'Developer & AI Platform': 'AI平台与开发者工具', 'AI Evaluation, Safety & Governance': 'AI评测、安全与治理', 'General / Cross-scenario AI': '通用 / 跨场景 AI', 'Unclear': '不明确',
  'Content & Media': '内容与媒体', 'Enterprise Productivity': '企业效率', 'General / Cross-industry': '通用 / 跨行业', 'Developer / Technology': '开发者与技术平台', 'Healthcare': '医疗健康', 'Education': '教育', 'Finance': '金融', 'Gaming & Entertainment': '游戏与娱乐', 'E-commerce & Retail': '电商与零售', 'Industrial & Manufacturing': '工业与制造', 'Sales & CRM': '销售与客户关系管理', 'Customer Service': '客户服务', 'Automotive & Mobility': '汽车与出行', 'HR & Recruitment': '人力资源与招聘', 'Government & Public Sector': '政府与公共部门', 'Cybersecurity': '网络安全', 'Defense & Public Safety': '国防与公共安全', 'Home & Construction': '家居与建筑', 'Legal': '法律', 'Telecommunications': '通信', 'Energy & Utilities': '能源与公共事业', 'Other': '其他',
  'Speech / Audio': '语音 / 音频', 'Machine Learning': '机器学习', 'Computer Vision': '计算机视觉', 'Knowledge Graph': '知识图谱', 'Company Size': '公司规模', 'Financing Stage': '融资阶段', 'Experience Composition': '经验要求构成', 'Salary × Experience Journey': '薪资 × 经验要求分布',
  'No experience requirement': '不限经验', 'Fresh / <1': '应届 / 1年以下', '1–3': '1–3年', '3–5': '3–5年', '5–10': '5–10年', '10+': '10年以上', 'Unspecified': '未明确', 'Multimodal': '多模态', 'Hands-on Validation': '动手验证',
  'Traditional PM Coverage': '传统 PM 基本功', 'AI-native Ownership Coverage': 'AI-native 职责', 'Hands-on Validation Coverage': '亲手验证', 'Deep Technical Participation Coverage': '深度技术参与',
  '1000-9999人': '1000–9999人', '500-999人': '500–999人', '100-499人': '100–499人', '20-99人': '20–99人', '0-20人': '0–20人',
}

export function displayLabel(value: string | undefined) { return value ? labels[value] ?? value : '—' }

export function formatSalaryWanFromK(valueK: number | null) {
  if (valueK == null) return '—'
  const wan = valueK / 10
  return `${wan.toFixed(wan % 1 === 0 ? 0 : 1)}万元`
}
