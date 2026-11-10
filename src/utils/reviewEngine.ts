import {
  PaperMetadata, JournalType, ResearchMethod, PaperTopic,
  StrictnessLevel, DecisionType, StageInfo, ReviewStage,
  DimensionScore, ReviewerProfile, ReviewerReport, MajorComment,
  EditorSummary, FinalDecision, RevisionPlan, JournalConfig,
} from '../types';

// ===== JOURNAL CONFIGURATIONS =====
export const JOURNAL_CONFIGS: Record<JournalType, JournalConfig> = {
  MS_OR: { type: 'MS_OR', label: 'Management Science / Operations Research', category: '英文顶级管理科学', weights: { theory: 25, design: 20, question: 15, literature: 15, method: 10, evidence: 10, writing: 5 }, styleNote: '强调理论贡献和方法严谨性，偏好数学模型或严格的实证识别策略。' },
  AMJ: { type: 'AMJ', label: 'Academy of Management Journal', category: '英文顶级管理综合', weights: { theory: 25, design: 20, question: 15, literature: 15, method: 10, evidence: 10, writing: 5 }, styleNote: '强调理论贡献的新颖性和突破性，要求研究问题具有重大理论张力。对定性研究（案例、扎根）也较为包容，但要求极高的理论抽象。' },
  SMJ: { type: 'SMJ', label: 'Strategic Management Journal', category: '英文顶级战略管理', weights: { theory: 20, design: 20, question: 15, literature: 15, method: 15, evidence: 10, writing: 5 }, styleNote: '偏好战略管理核心问题，要求研究设计能够识别因果关系，对机制有明确解释。' },
  MISQ_ISR: { type: 'MISQ_ISR', label: 'MIS Quarterly / ISR', category: '英文顶级信息系统', weights: { theory: 25, design: 20, question: 15, literature: 10, method: 15, evidence: 10, writing: 5 }, styleNote: '强调理论贡献与IS领域的独特连接，要求对信息技术/数字化现象有深入的理论化。' },
  JBV: { type: 'JBV', label: 'Journal of Business Venturing', category: '英文顶级创新创业', weights: { theory: 20, design: 20, question: 20, literature: 10, method: 15, evidence: 10, writing: 5 }, styleNote: '关注创业现象的理论贡献，对情境独特性有较高要求。' },
  TAR_JAE_JAR: { type: 'TAR_JAE_JAR', label: 'The Accounting Review / JAE / JAR', category: '英文顶级会计', weights: { theory: 15, design: 20, question: 15, literature: 15, method: 20, evidence: 10, writing: 5 }, styleNote: '极为强调研究设计的严谨性和因果识别，内生性处理是核心关注点。' },
  GLWJ_ZGGYJJ: { type: 'GLWJ_ZGGYJJ', label: '管理世界 / 中国工业经济', category: '中文顶级管理综合', weights: { question: 20, theory: 20, design: 15, mechanism: 15, evidence: 15, literature: 10, writing: 5 }, styleNote: '强调中国情境的独特性、问题意识和政策含义，偏好"顶天立地"的研究——理论有高度、实践能落地。' },
  NKGL_GLKXXB: { type: 'NKGL_GLKXXB', label: '南开管理评论 / 管理科学学报', category: '中文顶级管理学术', weights: { question: 15, theory: 20, design: 20, method: 15, evidence: 15, literature: 10, writing: 5 }, styleNote: '强调学术规范性、理论深度和方法的严谨性。管理科学学报更偏数理和建模，南开管理评论更偏实证和案例。' },
  custom: { type: 'custom', label: '自定义期刊', category: '自定义', weights: { question: 18, theory: 18, design: 18, method: 15, evidence: 15, literature: 10, writing: 6 }, styleNote: '可自行调整各维度权重。' },
};

// ===== STAGE DEFINITIONS =====
export function getStages(): StageInfo[] {
  return [
    { stage: 'manuscript_submitted', label: 'Manuscript Submitted', status: 'waiting', timeEstimate: '—', risk: '初始提交', riskLevel: 'low' },
    { stage: 'format_check', label: 'Managing Editor Format Check', status: 'waiting', timeEstimate: '1-3天', risk: '格式不合格直接退回', riskLevel: 'medium' },
    { stage: 'assigned_area_editor', label: 'Assigned to Area Editor', status: 'waiting', timeEstimate: '1-3天', risk: '暂无', riskLevel: 'low' },
    { stage: 'area_editor_screening', label: 'Area Editor Initial Screening', status: 'waiting', timeEstimate: '3-14天', risk: 'Desk Reject 风险', riskLevel: 'high' },
    { stage: 'assigned_associate_editor', label: 'Assigned to Associate Editor', status: 'waiting', timeEstimate: '1-7天', risk: '暂无', riskLevel: 'low' },
    { stage: 'ae_inviting_reviewers', label: 'Associate Editor Invites Reviewers', status: 'waiting', timeEstimate: '1-8周', risk: '找不到审稿人风险（小众方向尤其严重）', riskLevel: 'high' },
    { stage: 'with_reviewers', label: 'With Reviewers', status: 'waiting', timeEstimate: '4-12周', risk: '审稿人拖延，可能数月无进展', riskLevel: 'high' },
    { stage: 'awaiting_scores', label: 'Awaiting Reviewer Scores', status: 'waiting', timeEstimate: '1-4周', risk: '审稿人意见可能严重分歧', riskLevel: 'medium' },
    { stage: 'ae_recommendation', label: 'Associate Editor Recommendation', status: 'waiting', timeEstimate: '3-14天', risk: 'AE可能否定审稿人意见', riskLevel: 'medium' },
    { stage: 'area_editor_decision', label: 'Area Editor Final Decision', status: 'waiting', timeEstimate: '1-7天', risk: '最终决定', riskLevel: 'high' },
    { stage: 'decision_letter', label: 'Decision Letter Generated', status: 'waiting', timeEstimate: '即时', risk: '—', riskLevel: 'low' },
  ];
}

// ===== METADATA SCORING =====
export function scoreFromMetadata(meta: PaperMetadata, strictness: StrictnessLevel): number {
  const strictMultiplier = strictness === 'gentle' ? 0.8 : strictness === 'normal' ? 1.0 : strictness === 'strict' ? 1.2 : 1.4;
  let score = meta.formatScore;
  if (!meta.hasLiteratureReview) score -= 8;
  if (!meta.hasAnalysis) score -= 12;
  if (!meta.hasResearchDesign) score -= 10;
  if (meta.aiTraceScore > 60) score -= 15;
  return Math.max(10, Math.min(100, Math.round(score * (1 / strictMultiplier))));
}

// ===== DIMENSION SCORING =====
export function evaluateDimensions(
  text: string, meta: PaperMetadata,
  journalType: JournalType, method: ResearchMethod,
  topic: PaperTopic, strictness: StrictnessLevel
): DimensionScore[] {
  const strictMap: Record<StrictnessLevel, number> = { gentle: 0.85, normal: 1.0, strict: 1.15, top_tier: 1.3 };
  const multiplier = strictMap[strictness];

  const isCase = ['multi_case', 'longitudinal_case', 'single_case'].includes(method);
  const isEmpirical = ['archival', 'experiment', 'survey'].includes(method);

  const dimensions: DimensionScore[] = [
    {
      dimension: 'Fit to Journal（期刊匹配度）',
      score: clamp(scoreTopicFit(text, topic, journalType) / multiplier),
      riskLevel: 'medium', mainIssue: '', suggestion: '', impactOnDecision: '不匹配可能导致 Desk Reject',
    },
    {
      dimension: 'Research Question（研究问题）',
      score: clamp(scoreResearchQuestion(text) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '问题不清晰是 Desk Reject 的主要原因之一',
    },
    {
      dimension: 'Theoretical Contribution（理论贡献）',
      score: clamp(scoreTheoryContribution(text, isCase) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '贡献不足是大修或退稿的核心原因',
    },
    {
      dimension: 'Literature Engagement（文献对话）',
      score: clamp(scoreLiteratureEngagement(text) / multiplier),
      riskLevel: 'medium', mainIssue: '', suggestion: '', impactOnDecision: '文献综述薄弱影响理论贡献评价',
    },
    {
      dimension: 'Research Design（研究设计）',
      score: clamp(scoreResearchDesign(text, method) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '设计缺陷是退稿的主要原因',
    },
    {
      dimension: 'Data and Evidence（数据与证据）',
      score: clamp(scoreDataEvidence(text, isCase, isEmpirical) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '数据不足或证据链断裂直接导致退稿',
    },
    {
      dimension: 'Methodological Transparency（方法透明度）',
      score: clamp(scoreMethodTransparency(text, isEmpirical) / multiplier),
      riskLevel: 'medium', mainIssue: '', suggestion: '', impactOnDecision: '方法描述不透明影响结果可信度',
    },
    {
      dimension: 'Construct Development（构念生成）',
      score: clamp(scoreConstructDevelopment(text, isCase) / multiplier),
      riskLevel: 'medium', mainIssue: '', suggestion: '', impactOnDecision: '构念不清影响理论贡献评价',
    },
    {
      dimension: 'Mechanism Clarity（机制清晰度）',
      score: clamp(scoreMechanismClarity(text) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '机制不清是中文顶刊常见退稿原因',
    },
    {
      dimension: 'Robustness / Validity（稳健性/效度）',
      score: clamp(scoreRobustness(text, isCase, isEmpirical) / multiplier),
      riskLevel: 'high', mainIssue: '', suggestion: '', impactOnDecision: '稳健性不足可能导致大修或退稿',
    },
    {
      dimension: 'Writing Quality（写作质量）',
      score: clamp(scoreWritingQuality(text, meta) / multiplier),
      riskLevel: 'low', mainIssue: '', suggestion: '', impactOnDecision: '写作质量影响整体印象，但一般不单独导致退稿',
    },
    {
      dimension: 'Practical Relevance（实践价值）',
      score: clamp(scorePracticalRelevance(text) / multiplier),
      riskLevel: 'low', mainIssue: '', suggestion: '', impactOnDecision: '实践价值影响 Minor/Major Revision 边界',
    },
    {
      dimension: 'Revision Potential（返修潜力）',
      score: clamp(scoreRevisionPotential(text, meta) / multiplier),
      riskLevel: 'medium', mainIssue: '', suggestion: '', impactOnDecision: '影响 Editor 是否给 R&R 机会的判断',
    },
  ];

  // Fill in details
  dimensions.forEach(d => {
    if (d.score >= 72) {
      d.riskLevel = 'low'; d.mainIssue = '该维度表现良好'; d.suggestion = '继续保持当前水平，可在细节上进一步打磨';
    } else if (d.score >= 52) {
      d.riskLevel = 'medium'; d.mainIssue = '该维度存在可改进空间'; d.suggestion = '需要在修改中有针对性地加强';
    } else {
      d.riskLevel = 'high'; d.mainIssue = '该维度是论文的主要短板，审稿人很可能会重点关注';
      d.suggestion = '这是优先修改项，需要在下一版本中重点解决';
    }
  });

  return dimensions;
}

function clamp(v: number): number { return Math.max(5, Math.min(98, Math.round(v))); }

// ===== INDIVIDUAL SCORING FUNCTIONS =====
function scoreTopicFit(text: string, topic: PaperTopic, journal: JournalType): number {
  let score = 50;
  const topicKeywords: Record<PaperTopic, string[]> = {
    digital_transformation: ['数字化', '转型', 'digital transformation', '数据', 'data'],
    ai: ['人工智能', 'AI', '机器学习', 'machine learning', '深度学习', 'deep learning', '算法', '大语言模型', 'LLM', '生成式AI'],
    innovation_entrepreneurship: ['创新', '创业', 'innovation', 'entrepreneur', '研发', 'R&D', '专利', 'venture'],
    platform_ecosystem: ['平台', 'platform', '生态', 'ecosystem', '双边市场', 'two-sided', '网络效应', 'network effect'],
    org_governance: ['组织', 'organization', '治理', 'governance', 'ESG', '企业社会责任', 'CSR'],
    corp_governance: ['公司治理', 'corporate governance', '董事会', 'board', '高管', 'CEO', 'executive', '股东', 'shareholder'],
    supply_chain: ['供应链', 'supply chain', '物流', 'logistics', '韧性', 'resilience', '库存', 'inventory'],
    accounting_disclosure: ['会计', 'accounting', '审计', 'audit', '信息披露', 'disclosure', '盈余', 'earnings', '财务', 'financial'],
    strategic_mgmt: ['战略', 'strategy', '竞争', 'competition', '并购', 'M&A', '多元化', 'diversification'],
    org_behavior: ['组织行为', 'organizational behavior', '领导', 'leadership', '员工', 'employee', '激励', 'motivation', '团队', 'team'],
    other: [],
  };

  const kws = topicKeywords[topic] || [];
  let matchCount = 0;
  kws.forEach(kw => { if (text.toLowerCase().includes(kw.toLowerCase())) matchCount++; });
  score += kws.length > 0 ? (matchCount / kws.length) * 35 : 15;

  // Bonus for hot topics
  if (/\b(AI|人工智能|机器学习|大语言模型|生成式)\b/.test(text)) score += 8;
  if (/碳中和|碳达峰|ESG|绿色|减排|sustainability/.test(text)) score += 5;
  if (/数字化|数字化转型|digital transformation/.test(text)) score += 5;

  return score;
}

function scoreResearchQuestion(text: string): number {
  let score = 50;
  if (/研究问题|research question|核心问题|本文.*探究|本文.*考察|本文.*探讨|本文.*研究|研究.*问题.*是/.test(text)) score += 15;
  if (/然而|但是|不足|缺乏|少有|尚未|鲜有|空白|缺口|局限|gap/.test(text)) score += 10;
  if (/\?|？/.test(text)) score += 5;
  if (/RQ\d|H\d[a-z]?|假设\s*\d|Hypothesis\s*\d/.test(text)) score += 10;

  // Penalize vague problem statements
  if (/具有.*重要.*意义|值得.*深入.*研究|重要的.*理论.*和.*实践.*意义/.test(text)) score -= 10;
  if (/在.*背景下|随着.*的.*发展|近年来.*越来越多/.test(text)) score -= 5;

  return score;
}

function scoreTheoryContribution(text: string, isCase: boolean): number {
  let score = 45;
  const theoryKws = /代理理论|信号理论|制度理论|资源基础|交易成本|利益相关者|社会网络|社会资本|社会交换|认知理论|前景理论|期权|博弈|委托代理|信息不对称|产权|组织学习|动态能力|吸收能力|权变|锦标赛|烙印|合法性|嵌入|资源依赖|agency theory|signaling theory|institutional theory|resource-based|transaction cost|stakeholder theory|social network|social capital|social exchange|cognitive theory|prospect theory|real options|game theory|dynamic capabilities|absorptive capacity|legitimacy|embeddedness|imprinting/g;
  const matches = text.match(theoryKws) || [];
  score += Math.min(20, matches.length * 4);

  if (/理论贡献|theoretical contribution|拓展了|修正了|挑战了|推进了|发展了|丰富了|contributes to|extends|advances|challenges/.test(text)) score += 12;
  if (/中介|调节|机制|路径|渠道|mechanism|mediat|moderat|channel|pathway/.test(text)) score += 10;
  if (isCase && /命题|Proposition|proposition|理论抽样|theoretical sampling/.test(text)) score += 8;

  // Penalize weak theory language
  if (/可能.*影响|maybe|probably|might affect/.test(text) && !/假设|hypothesis|命题|proposition/.test(text)) score -= 10;

  return score;
}

function scoreLiteratureEngagement(text: string): number {
  let score = 45;
  const critKws = /不足|缺乏|局限|有待|尚未|冲突|矛盾|不一致|争议|忽视|忽略|未能|没有考虑|limitation|gap|inconsistency|contradiction|overlook|neglect|scant|scarce/.test(text);
  if (critKws) score += 18;

  if (/综上|总体来看|综合来看|归纳|梳理|总结|概括|taken together|in summary|to summarize|synthesize/.test(text)) score += 10;

  const refCount = (text.match(/\[\d+\]|（\d{4}）|\(\d{4}\)|[A-Z][a-z]+.*\(\d{4}\)/g) || []).length;
  if (refCount > 30) score += 12;
  else if (refCount > 15) score += 8;
  else if (refCount > 5) score += 4;
  else score -= 10;

  const recentRefs = (text.match(/202[3-6]/g) || []).length;
  if (recentRefs > 10) score += 8;
  else if (recentRefs > 4) score += 4;
  else score -= 5;

  return score;
}

function scoreResearchDesign(text: string, method: ResearchMethod): number {
  let score = 50;
  const isCase = ['multi_case', 'longitudinal_case', 'single_case'].includes(method);

  if (isCase) {
    if (/案例选择|case selection|理论抽样|theoretical sampling|典型|极端|代表性|关键案例/.test(text)) score += 15;
    if (/访谈|interview|档案|archive|观察|observation|文档|document|三角验证|triangulation/.test(text)) score += 12;
    if (/编码|coding|主题|theme|范畴|category|归纳|inductive/.test(text)) score += 8;
  } else {
    if (/样本|sample|观测值|observation|面板数据|panel data|截面数据|cross.?section/.test(text)) score += 10;
    if (/被解释变量|解释变量|因变量|自变量|dependent variable|independent variable|控制变量|control variable/.test(text)) score += 10;
    if (/模型|model|回归|regression|固定效应|fixed effect|随机效应|random effect/.test(text)) score += 10;
    if (/DID|双重差分|difference.in.difference|RDD|断点回归|regression discontinuity|工具变量|instrumental variable|IV|2SLS|PSM|倾向得分|Heckman/.test(text)) score += 12;
  }

  return score;
}

function scoreDataEvidence(text: string, isCase: boolean, isEmpirical: boolean): number {
  let score = 45;
  if (isCase) {
    if (/访谈.*次|访谈.*小时|interview.*hour|受访者|interviewee|案例.*企业|case.*compan/.test(text)) score += 15;
    const sources = (text.match(/访谈|档案|观察|文档|二手|一手/g) || []).length;
    if (sources >= 3) score += 15;
    else if (sources >= 1) score += 8;
  }
  if (isEmpirical) {
    if (/N\s*[=＝]\s*\d+|样本量|sample size|观测值.*\d+/.test(text)) score += 12;
    if (/CSMAR|Wind|国泰安|万得|CNRDS|Compustat|CRSP|World Bank|国家统计局/.test(text)) score += 10;
    if (/描述性统计|descriptive stat|相关系数|correlation matrix/.test(text)) score += 8;
    if (/标准化|standardize|缩尾|winsorize|缩尾处理/.test(text)) score += 5;
  }
  return score;
}

function scoreMethodTransparency(text: string, isEmpirical: boolean): number {
  let score = 50;
  if (isEmpirical) {
    if (/标准误|standard error|t.?值|t.?stat|p\s*[<≤]|显著性|significant/.test(text)) score += 15;
    if (/R[²2]|Adj.*R[²2]|F.?值|F.?stat|χ|chi.?square/.test(text)) score += 10;
    if (/模型.*设定|model specification|检验.*步骤|estimation procedure/.test(text)) score += 8;
  }
  if (/稳健|robust|sensitivity|安慰剂|placebo|bootstrap/.test(text)) score += 10;
  return score;
}

function scoreConstructDevelopment(text: string, isCase: boolean): number {
  let score = 50;
  if (isCase) {
    if (/一阶|二阶|构念|construct|维度|dimension|概念化|conceptualization/.test(text)) score += 18;
    if (/编码|coding|主题|theme|范畴|category|涌现|emerge/.test(text)) score += 12;
    if (/定义|define|测量|measure|操作化|operationalize/.test(text)) score += 8;
  } else {
    if (/Cronbach|α|alpha|因子分析|factor analysis|CFA|EFA|AVE|CR|组合信度|composite reliability/.test(text)) score += 15;
    if (/构念|construct|变量.*定义|variable.*definition|测量|measurement/.test(text)) score += 12;
  }
  return score;
}

function scoreMechanismClarity(text: string): number {
  let score = 45;
  if (/机制|mechanism|路径|pathway|channel|中介|mediat|调节|moderat/.test(text)) score += 15;
  if (/因为|因此|所以|故而|据此|because|therefore|thus|hence|consequently/.test(text)) score += 8;
  if (/间接效应|indirect effect|直接效应|direct effect|总效应|total effect/.test(text)) score += 10;
  if (/Sobel|Bootstrap.*中介|逐步.*回归|结构方程|SEM|路径.*分析|path analysis/.test(text)) score += 10;

  // Penalize vague mechanism description
  if (/可能.*通过.*影响|might.*through|maybe.*via/.test(text) && !/机制|mechanism|路径|pathway/.test(text)) score -= 10;

  return score;
}

function scoreRobustness(text: string, isCase: boolean, isEmpirical: boolean): number {
  let score = 40;
  if (isEmpirical) {
    if (/稳健|robust|sensitivity/.test(text)) score += 10;
    const robustMethods = text.match(/替换.*变量|替换.*指标|替换.*模型|子样本|剔除|缩尾|winsor|安慰剂|placebo|bootstrap|聚类.*标准误|cluster.*standard error|Heckman|PSM|倾向得分|工具变量|IV|2SLS|GMM|系统GMM|差分GMM/g);
    if (robustMethods) score += Math.min(25, robustMethods.length * 5);
    if (/内生|endogen|自选择|self.selection|遗漏变量|omitted variable|反向因果|reverse causal/.test(text)) score += 8;
  }
  if (isCase) {
    if (/三角验证|triangulation|交叉验证|cross.?valid|成员检验|member check/.test(text)) score += 15;
    if (/复制逻辑|replication logic|理论复制|literal replication/.test(text)) score += 12;
    if (/其他.*解释|alternative.*explanation|竞争性.*解释|rival.*explanation/.test(text)) score += 10;
  }
  return score;
}

function scoreWritingQuality(text: string, meta: PaperMetadata): number {
  let score = 60;
  if (meta.aiTraceScore < 20) score += 12;
  else if (meta.aiTraceScore < 40) score += 6;
  else score -= 10;

  if (!/值得注意的是|需要指出的是|不可否认|毋庸置疑|显而易见/.test(text)) score += 8;
  if (!/本文|笔者/g.test(text) || (text.match(/本文|笔者/g) || []).length < 3) score += 5;

  const sentences = text.split(/[。；;]\s*/).filter(s => s.trim());
  const avgLen = sentences.reduce((s, sen) => s + sen.length, 0) / Math.max(1, sentences.length);
  if (avgLen < 60) score += 8;
  else if (avgLen > 100) score -= 8;

  return score;
}

function scorePracticalRelevance(text: string): number {
  let score = 50;
  if (/实践启示|政策建议|管理建议|实践意义|管理启示|政策启示|对.*启示|建议.*企业|建议.*政府|practical implication|managerial implication|policy implication/.test(text)) score += 15;
  if (/具体|建议|措施|策略|方案|路线|路径|recommend|suggest|propose/.test(text)) score += 10;

  // Penalize generic implications
  if (/企业.*应.*重视|企业.*应.*加强|政府.*应.*完善|政府.*应.*加大/.test(text)) score -= 8;

  return score;
}

function scoreRevisionPotential(text: string, meta: PaperMetadata): number {
  let score = 60;
  if (meta.formatScore > 60) score += 10;
  if (meta.wordCount > 8000) score += 8;
  if (/研究问题|research question|核心问题/.test(text)) score += 8;

  if (meta.aiTraceScore > 50) score -= 15;
  if (!meta.hasLiteratureReview) score -= 12;
  if (!meta.hasResearchDesign) score -= 10;
  return score;
}

// ===== REVIEWER GENERATION =====
export function generateReviewers(method: ResearchMethod, topic: PaperTopic): ReviewerProfile[] {
  const pool: ReviewerProfile[] = [
    {
      id: 1, name: 'Prof. Zhang Wei', institution: 'Guanghua School of Management, Peking University',
      expertise: ['组织理论', '制度理论', '战略管理'], type: 'theory', strictness: 0.75,
    },
    {
      id: 2, name: 'Prof. Chen Li', institution: 'School of Management, Xi\'an Jiaotong University',
      expertise: ['计量经济学', '因果推断', '公司金融', '面板数据分析'], type: 'method', strictness: 0.85,
    },
    {
      id: 3, name: 'Prof. Wang Fang', institution: 'School of Business, Sun Yat-sen University',
      expertise: ['案例研究', '创新创业', '数字化转型', '质性研究'], type: 'domain', strictness: 0.65,
    },
    {
      id: 4, name: 'Prof. Liu Qiang', institution: 'School of Management, Huazhong University of Science and Technology',
      expertise: ['管理信息系统', '大数据分析', '平台经济', 'AI应用'], type: 'method', strictness: 0.80,
    },
    {
      id: 5, name: 'Prof. Li Na', institution: 'School of Business, Renmin University of China',
      expertise: ['组织行为', '人力资源管理', '领导力', '问卷调查'], type: 'theory', strictness: 0.72,
    },
    {
      id: 6, name: 'Prof. Zhou Jie', institution: 'School of Economics and Management, Tsinghua University',
      expertise: ['公司治理', '财务会计', '审计', '资本市场'], type: 'domain', strictness: 0.78,
    },
    {
      id: 7, name: 'Prof. Sun Hao', institution: 'Antai College, Shanghai Jiao Tong University',
      expertise: ['营销科学', '消费者行为', '实验设计', '行为经济学'], type: 'method', strictness: 0.70,
    },
    {
      id: 8, name: 'Prof. Huang Ying', institution: 'School of Management, Fudan University',
      expertise: ['战略管理', '国际商务', '新兴市场', '制度环境'], type: 'domain', strictness: 0.68,
    },
    {
      id: 9, name: 'Prof. Ma Chao', institution: 'Business School, Nanjing University',
      expertise: ['组织理论', '社会网络', '知识管理', '创新管理'], type: 'theory', strictness: 0.73,
    },
    {
      id: 10, name: 'Prof. Zhao Xin', institution: 'School of Management, Zhejiang University',
      expertise: ['供应链管理', '运营管理', '博弈论', '优化模型'], type: 'method', strictness: 0.82,
    },
  ];

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
}

// ===== REVIEWER REPORT GENERATION =====
export function generateReviewerReport(
  reviewer: ReviewerProfile, dimensions: DimensionScore[],
  text: string, method: ResearchMethod, strictness: StrictnessLevel
): ReviewerReport {
  const strictMap: Record<StrictnessLevel, number> = { gentle: 0.8, normal: 1.0, strict: 1.15, top_tier: 1.3 };
  const sMult = strictMap[strictness];
  const isCase = ['multi_case', 'longitudinal_case', 'single_case'].includes(method);

  // Select dimensions based on reviewer type
  let relevantDims = dimensions;
  if (reviewer.type === 'theory') {
    relevantDims = dimensions.filter(d =>
      d.dimension.includes('Theory') || d.dimension.includes('Literature') ||
      d.dimension.includes('Construct') || d.dimension.includes('Question') ||
      d.dimension.includes('Mechanism')
    );
  } else if (reviewer.type === 'method') {
    relevantDims = dimensions.filter(d =>
      d.dimension.includes('Design') || d.dimension.includes('Data') ||
      d.dimension.includes('Method') || d.dimension.includes('Robustness') ||
      d.dimension.includes('Construct')
    );
  }

  const avgScore = Math.round(relevantDims.reduce((s, d) => s + d.score, 0) / relevantDims.length);
  const overallScore = Math.round(avgScore / sMult);

  // Determine verdict
  let overallRecommendation: DecisionType;
  if (overallScore >= 82) overallRecommendation = 'Minor Revision';
  else if (overallScore >= 68) overallRecommendation = 'Major Revision';
  else if (overallScore >= 50) overallRecommendation = 'Reject and Resubmit';
  else if (overallScore >= 35) overallRecommendation = 'Reject';
  else overallRecommendation = 'Reject';

  // Generate summary
  const summary = generateSummary(reviewer, dimensions, overallScore, method);

  // Generate major comments
  const majorComments = generateMajorComments(reviewer, dimensions, isCase, overallScore);

  // Generate minor comments
  const minorComments = generateMinorComments(reviewer, dimensions, text, isCase);

  // Most critical revision
  const worstDim = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const mostCriticalRevision = generateCriticalRevision(reviewer, worstDim, isCase);

  return {
    reviewer, overallRecommendation, summary,
    majorComments, minorComments, mostCriticalRevision,
    dimensionScores: Object.fromEntries(dimensions.map(d => [d.dimension, d.score])),
    overallScore,
  };
}

function generateSummary(reviewer: ReviewerProfile, dims: DimensionScore[], score: number, method: ResearchMethod): string {
  const worst = [...dims].sort((a, b) => a.score - b.score).slice(0, 3);
  const best = [...dims].sort((a, b) => b.score - a.score).slice(0, 2);

  const templates = [
    `This paper addresses an interesting topic related to ${method.replace('_', ' ')} research. The manuscript demonstrates ${best.map(d => d.dimension.split('（')[0]).join(' and ')}. However, I have significant concerns regarding ${worst.map(d => d.dimension.split('（')[0]).join(', ')}. These issues need to be thoroughly addressed before the paper can be considered for publication.`,
    `The manuscript investigates a relevant research question using ${method.replace('_', ' ')} methodology. While the paper shows some promise in ${best.map(d => d.dimension.split('（')[0]).join(' and ')}, the current version falls short in ${worst.slice(0, 2).map(d => d.dimension.split('（')[0]).join(' and ')}. I outline specific concerns below.`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function generateMajorComments(reviewer: ReviewerProfile, dims: DimensionScore[], isCase: boolean, score: number): MajorComment[] {
  const comments: MajorComment[] = [];
  const weakDims = dims.filter(d => d.score < 55).sort((a, b) => a.score - b.score);

  if (reviewer.type === 'theory') {
    comments.push({
      problem: 'The theoretical framing of this study is underdeveloped. The manuscript does not clearly articulate which theoretical conversation it enters and what specific gap it fills.',
      whyImportant: 'Without a clear theoretical anchor, reviewers cannot evaluate whether the contribution is incremental or transformative. This is often the most common reason for rejection at top management journals.',
      howToFix: '1) Identify 1-2 core management theories that your study speaks to. 2) Clearly articulate what these theories predict and where they fall short. 3) Build your hypotheses/propositions as direct logical extensions of these theoretical tensions. 4) In the Discussion, explicitly state how your findings extend, challenge, or refine these theories.',
      rejectRiskIfNotFixed: 'If the theoretical foundation is not strengthened, the paper will likely be rejected because the contribution claim cannot be substantiated.',
    });
    comments.push({
      problem: 'The literature review is more of a summary than a critical engagement. It reads like an annotated bibliography rather than a synthesis that builds toward a research question.',
      whyImportant: 'Top journals expect the literature review to not just summarize prior work but to identify tensions, contradictions, and gaps that logically necessitate the current study.',
      howToFix: 'Restructure the literature review around 2-3 thematic tensions rather than listing studies chronologically. For each theme: (a) what do we know? (b) what is contested or unclear? (c) what does this imply for your study? End with a clear statement of the research gap that your study fills.',
      rejectRiskIfNotFixed: 'A weak literature review undermines the entire contribution claim. Reviewers will question whether the study adds anything new.',
    });
  }

  if (reviewer.type === 'method') {
    comments.push({
      problem: isCase ? 'The case selection logic is not sufficiently justified. Why were these specific cases chosen? What makes them theoretically appropriate?' :
        'The empirical strategy lacks sufficient attention to identification. Several threats to internal validity are not adequately addressed.',
      whyImportant: isCase ? 'Case selection is the foundation of case study validity. Without a clear theoretical sampling logic, the findings cannot be generalized or replicated.' :
        'Without credible identification, the estimated effects cannot be interpreted causally. This is a fundamental requirement for empirical research at top journals.',
      howToFix: isCase ? 'Explicitly state your case selection criteria using theoretical sampling logic (e.g., extreme cases, typical cases, maximum variation). Explain what each case contributes to theory building and why the number of cases is appropriate.' :
        '1) Clearly discuss potential sources of endogeneity (omitted variables, selection bias, reverse causality, measurement error). 2) Implement appropriate identification strategies (instrumental variables, DID, RDD, PSM, Heckman correction). 3) Conduct falsification/placebo tests. 4) Report the economic magnitude of effects, not just statistical significance.',
      rejectRiskIfNotFixed: 'Without addressing these methodological concerns, the empirical results cannot be trusted, leading to rejection.',
    });
    comments.push({
      problem: 'The robustness checks are insufficient. A single robustness test is not enough to establish confidence in the findings.',
      whyImportant: 'Robustness is not a checklist exercise—it demonstrates that the core finding is not an artifact of specific modeling choices.',
      howToFix: 'Conduct at least 3-4 types of robustness checks: (1) alternative dependent/independent variable measures, (2) alternative model specifications, (3) subsample analyses, (4) exclusion of outliers/influential observations, (5) alternative estimation methods. For each, explain why the check is meaningful.',
      rejectRiskIfNotFixed: 'Insufficient robustness checks will lead to a Major Revision request at best, or rejection if the core findings appear fragile.',
    });
  }

  if (reviewer.type === 'domain') {
    comments.push({
      problem: 'The practical relevance and boundary conditions of the findings are not sufficiently discussed. The paper reads as if the findings apply universally, which is rarely the case.',
      whyImportant: 'Managers and policymakers need to know under what conditions the findings hold and when they might not. Without boundary conditions, the practical contribution is overstated.',
      howToFix: '1) Explicitly discuss the boundary conditions of your theory and findings. 2) Acknowledge contextual factors (industry, institutional environment, time period, cultural setting) that may moderate the relationships. 3) Provide specific, actionable recommendations for different types of organizations or managers.',
      rejectRiskIfNotFixed: 'Omitting boundary conditions weakens both the theoretical contribution (by overclaiming) and the practical relevance (by being too vague).',
    });
  }

  // Generic major comments (always add some)
  const genericMajor: MajorComment[] = [
    {
      problem: 'The research question, while interesting, is not sufficiently motivated. The manuscript jumps into the empirical analysis without establishing why this particular question is theoretically important.',
      whyImportant: 'Without a compelling motivation, readers and reviewers will question whether the study is worth the effort required to understand it.',
      howToFix: 'In the introduction, use a "hook" (surprising fact, puzzle, tension) to capture attention. Then clearly state: (1) what we know, (2) what we don\'t know (the gap), and (3) why filling this gap matters for theory and/or practice.',
      rejectRiskIfNotFixed: 'A poorly motivated research question significantly increases the risk of desk rejection.',
    },
    {
      problem: 'The mechanism linking the key constructs is underdeveloped. The manuscript describes relationships but does not adequately explain WHY these relationships exist.',
      whyImportant: 'Top management journals prioritize theoretical mechanisms over empirical patterns. Showing that X affects Y is not enough—you must explain the process through which X affects Y.',
      howToFix: 'Develop a clear theoretical model that specifies the causal mechanisms. Use theory to derive each link in the chain. If possible, empirically test the proposed mechanism through mediation analysis, process tracing, or qualitative evidence.',
      rejectRiskIfNotFixed: 'Without clear mechanisms, the study is descriptive rather than explanatory, which almost always leads to rejection at top journals.',
    },
    {
      problem: 'The contribution relative to existing literature is not clearly stated. The paper claims to make a contribution but does not specify exactly what is new and why it matters.',
      whyImportant: 'Explicitly stating the contribution is essential for reviewers to evaluate whether the paper advances knowledge. Vague contribution claims signal that the authors themselves are unsure of their contribution.',
      howToFix: 'At the end of the introduction and in the Discussion, use precise language: "This study contributes to [specific literature] by [specific contribution]. Unlike prior work that [what prior work did], we [what you did differently] and find [key insight]."',
      rejectRiskIfNotFixed: 'Unclear contribution is a common reason for rejection, as it suggests the study does not add meaningful new knowledge.',
    },
  ];

  // Select based on weak dimensions
  const selected = [...comments];
  if (weakDims.length >= 2) {
    selected.push(genericMajor[0]);
    selected.push(genericMajor[1]);
  }
  if (selected.length < 5) {
    const remaining = genericMajor.filter(g => !selected.includes(g));
    selected.push(...remaining.slice(0, 5 - selected.length));
  }

  return selected.slice(0, 6);
}

function generateMinorComments(reviewer: ReviewerProfile, dims: DimensionScore[], text: string, isCase: boolean): string[] {
  const todos: string[] = [
    'The abstract should be restructured to include: research purpose, method, key findings, and theoretical contribution. Currently it is too general.',
    'Several key references are missing from the literature review. Please ensure the most recent (2023-2026) and most cited papers in this specific domain are included.',
    'Please add a correlation matrix and descriptive statistics table. This is standard practice and helps readers understand your data.',
    'The formatting of tables should follow journal guidelines: include notes on significance levels, standard errors in parentheses, and sample size.',
    'Please number all figures and tables, and provide English translations for all Chinese-language table/figure titles.',
    'Several paragraphs are too long (>250 words). Break them into shorter, more focused paragraphs.',
    'Please use consistent terminology throughout the manuscript. Key constructs should be referred to by the same term every time.',
    'The reference list should be formatted consistently. Chinese-language references must include English translations.',
    'Check for grammatical errors, particularly subject-verb agreement and tense consistency.',
    'Please add page numbers and line numbers to facilitate the review process.',
    'The conclusion section should do more than summarize findings. It should discuss theoretical contributions, practical implications, limitations, and future research directions.',
    'Please ensure all acronyms are defined at first use.',
    '图表的标题需要有中英文双语对照。',
    '请检查参考文献格式是否统一，中文文献需附英文翻译。',
    '请统一全文的术语使用——同一个构念不要用多个不同的中文译名。',
    '引言部分建议增加数据或具体案例作为开篇，增强冲击力。',
  ];

  const shuffled = todos.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6 + Math.floor(Math.random() * 4));
}

function generateCriticalRevision(reviewer: ReviewerProfile, worstDim: DimensionScore, isCase: boolean): string {
  if (reviewer.type === 'theory') {
    return `The single most important revision is to substantially strengthen the theoretical foundation. The manuscript currently reads as a "variables study" rather than a "theory-driven study." Every hypothesis/proposition must be derived from theory, not intuition. Revise the theory section to clearly articulate: (1) Which specific theory/theories are you building on? (2) What is the logical chain from theoretical premise to hypothesis? (3) What does your study add to these theories? Without this, the paper cannot make a credible theoretical contribution.`;
  }
  if (reviewer.type === 'method') {
    return isCase ?
      `The most critical revision is to fundamentally restructure the case analysis around theoretical propositions rather than narrative description. The paper currently tells an interesting story but does not build theory from it. Use structured coding procedures, explicitly link evidence to propositions, and draw a process model or theoretical framework diagram that emerges from the case evidence.` :
      `The most critical revision is to address endogeneity concerns and add rigorous robustness checks. The current empirical strategy does not convincingly establish causality. Implement at minimum: instrumental variable estimation (with proper diagnostics), alternative dependent variable measures, and subsample analyses. Report all diagnostic tests transparently. The credibility of your entire empirical contribution rests on this.`;
  }
  return `The most critical revision is to clarify the theoretical contribution and practical relevance. The manuscript needs to more clearly specify: (1) what new theoretical insight it offers beyond existing literature, and (2) under what boundary conditions the findings apply. Strengthen the Discussion section by distinguishing your contribution from prior work and providing specific, actionable implications for practice.`;
}

// ===== EDITOR DECISIONS =====
export function generateAERecommendation(reports: ReviewerReport[], dims: DimensionScore[]): EditorSummary {
  const verdicts = reports.map(r => r.overallRecommendation);
  const scores = reports.map(r => r.overallScore);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const rejectCount = verdicts.filter(v => v === 'Reject').length;
  const rrCount = verdicts.filter(v => v === 'Reject and Resubmit').length;
  const majorCount = verdicts.filter(v => v === 'Major Revision').length;
  const minorCount = verdicts.filter(v => v === 'Minor Revision').length;

  let agreement: EditorSummary['reviewerAgreement'];
  let agreementDetail: string;
  if (verdicts.every(v => v === verdicts[0])) {
    agreement = 'high';
    agreementDetail = `All ${reports.length} reviewers are in agreement (${verdicts[0]}). This strengthens the reliability of the review.`;
  } else if (Math.abs(scores[0] - scores[1]) < 10 && verdicts.filter(v => v.includes('Reject')).length <= 1) {
    agreement = 'moderate';
    agreementDetail = 'Reviewers generally agree on the main issues but differ in their final recommendation. Reviewer concerns are largely convergent.';
  } else {
    agreement = 'conflict';
    agreementDetail = `Reviewers disagree significantly. ${rejectCount > 0 ? `${rejectCount} reviewer(s) recommend rejection while others see potential.` : 'Recommendations span from Major Revision to Minor Revision.'} The AE must carefully weigh these different perspectives.`;
  }

  let aeRecommendation: DecisionType;
  if (rejectCount >= 2) aeRecommendation = 'Reject';
  else if (rejectCount === 1 && rrCount >= 1) aeRecommendation = 'Reject and Resubmit';
  else if (rrCount >= 2) aeRecommendation = 'Reject and Resubmit';
  else if (majorCount >= 2) aeRecommendation = 'Major Revision';
  else if (minorCount >= 2) aeRecommendation = 'Minor Revision';
  else if (avgScore >= 70) aeRecommendation = 'Major Revision';
  else if (avgScore >= 50) aeRecommendation = 'Reject and Resubmit';
  else aeRecommendation = 'Reject';

  const maxPotential = dims.filter(d => d.score >= 65).map(d => d.dimension.split('（')[0]).join('、') || '当前各维度均有较大提升空间';
  const maxRejectRisk = dims.filter(d => d.score < 45).map(d => d.dimension.split('（')[0]).join('、') || '理论贡献不足和方法设计缺陷';

  return {
    reviewerAgreement: agreement,
    agreementDetail,
    maxPotential,
    maxRejectRisk,
    aeRecommendation,
    aeRationale: `Based on ${reports.length} referee reports and my own reading of the manuscript, I recommend ${aeRecommendation}. ${agreementDetail}`,
  };
}

export function generateFinalDecision(
  aeSummary: EditorSummary, dims: DimensionScore[]
): FinalDecision {
  const decision = aeSummary.aeRecommendation;
  const mainReasons: string[] = [];
  const weakDims = dims.filter(d => d.score < 50).sort((a, b) => a.score - b.score);

  if (decision === 'Desk Reject' || decision === 'Reject') {
    mainReasons.push('Research question lacks sufficient theoretical tension or novelty');
    mainReasons.push('Theoretical contribution is not clearly established relative to existing literature');
    if (weakDims.length > 0) {
      mainReasons.push(`Key weaknesses in: ${weakDims.slice(0, 3).map(d => d.dimension.split('（')[0]).join(', ')}`);
    }
  } else if (decision === 'Reject and Resubmit') {
    mainReasons.push('The topic has potential but the current manuscript requires fundamental restructuring');
    mainReasons.push('Theoretical framework needs to be rebuilt with clearer connections to the management literature');
    mainReasons.push('Methodological rigor must be substantially improved before the paper can be reconsidered');
  } else if (decision === 'Major Revision') {
    mainReasons.push('The research addresses a relevant question with potential for meaningful contribution');
    mainReasons.push('Several significant issues must be resolved before the paper can be accepted');
    mainReasons.push('The revision will require substantial effort in both theory development and empirical analysis');
  } else {
    mainReasons.push('The manuscript is well-structured with clear theoretical grounding');
    mainReasons.push('Reviewers identified minor issues that can be addressed in a focused revision');
  }

  const rnrOpportunity = ['Major Revision', 'Minor Revision', 'Reject and Resubmit', 'Conditional Accept'].includes(decision);
  let rnrExplanation: string | undefined;
  if (decision === 'Reject and Resubmit') {
    rnrExplanation = 'This is a Reject and Resubmit (R&R), NOT a Major Revision. The distinction is important: R&R means the current version is not publishable in its present form and requires fundamental restructuring. The revised manuscript will be treated as a new submission. If you are on the job market, note that R&R carries significantly less weight than Major Revision on your CV.';
  }

  const revisionDifficulty: FinalDecision['revisionDifficulty'] =
    decision === 'Minor Revision' ? 'low' :
    decision === 'Major Revision' ? 'high' :
    decision === 'Reject and Resubmit' ? 'extreme' : 'medium';

  let suggestedRevisionPeriod = '';
  if (decision === 'Minor Revision') suggestedRevisionPeriod = '2-4周';
  else if (decision === 'Major Revision') suggestedRevisionPeriod = '6-12周';
  else if (decision === 'Reject and Resubmit') suggestedRevisionPeriod = '3-6个月（作为新稿件重新提交）';
  else suggestedRevisionPeriod = 'N/A';

  const requiredRevisions = weakDims.slice(0, 5).map(d => d.suggestion).filter(Boolean);

  const revisionPlan = generateRevisionPlan(decision);

  return {
    decision, mainReasons, rnrOpportunity, rnrExplanation,
    requiredRevisions, revisionDifficulty, suggestedRevisionPeriod, revisionPlan,
  };
}

function generateRevisionPlan(decision: DecisionType): RevisionPlan | undefined {
  if (decision === 'Major Revision') {
    return {
      rounds: [
        { round: 1, focus: '研究问题与理论框架重构', tasks: ['重新明确研究问题的理论张力', '重构理论框架和假设推导逻辑', '重写文献综述——从罗列转为评述', '明确理论贡献的具体内容'] },
        { round: 2, focus: '方法与数据证据强化', tasks: ['补充内生性处理或识别策略', '增加稳健性检验（至少3种方法）', '完善变量定义和测度说明', '补充机制检验或过程追踪'] },
        { round: 3, focus: '机制模型与语言润色', tasks: ['绘制清晰的机制模型图', '润色全文语言表达', '统一术语和格式', '准备Response Letter'] },
      ],
    };
  }
  if (decision === 'Reject and Resubmit') {
    return {
      rounds: [
        { round: 1, focus: '重写引言与核心问题', tasks: ['重新构思研究问题的理论定位', '重写引言部分（从hook到贡献）', '重新进行文献检索和综述'] },
        { round: 2, focus: '重构理论基础', tasks: ['选择并深度锚定1-2个核心理论', '重建假设/命题推导逻辑链', '构建理论框架图示'] },
        { round: 3, focus: '重做研究设计', tasks: ['如果是实证：重新设计识别策略', '如果是案例：重构案例选择和编码方案', '补充数据或更换数据来源'] },
        { round: 4, focus: '补数据与证据链', tasks: ['补足缺失的数据或案例证据', '完善稳健性/效度检验', '强化机制证据链'] },
        { round: 5, focus: '重写讨论与贡献', tasks: ['重新撰写Discussion部分', '明确理论贡献的三条具体内容', '讨论边界条件和实践启示'] },
      ],
    };
  }
  if (decision === 'Desk Reject') {
    return {
      rounds: [
        { round: 1, focus: '判断是否适合该期刊', tasks: ['对照期刊Aims & Scope重新评估', '检查已发表论文的话题范围', '考虑是否需要改投更匹配的期刊'] },
        { round: 2, focus: '重新定位研究问题', tasks: ['确保研究问题是管理学的核心问题', '增强问题的理论张力', '明确研究对管理实践的启示'] },
        { round: 3, focus: '换理论或换方法', tasks: ['考虑是否需要更换理论视角', '评估研究方法的严谨性是否达标', '如果需要，补充数据或案例'] },
        { round: 4, focus: '重新组织论文结构', tasks: ['确保符合目标期刊的标准结构', '完善各部分的逻辑衔接', '逐章逐节打磨'] },
      ],
    };
  }
  return undefined;
}
