import { useState, useRef, useCallback } from 'react';
import {
  JournalType, ResearchMethod, PaperTopic, StrictnessLevel,
  DecisionType, StageInfo, DimensionScore, ReviewerReport,
  EditorSummary, FinalDecision, PaperMetadata,
} from './types';
import { parseFile, extractMetadata } from './utils/parser';
import {
  JOURNAL_CONFIGS, getStages, scoreFromMetadata,
  evaluateDimensions, generateReviewers,
  generateReviewerReport, generateAERecommendation,
  generateFinalDecision,
} from './utils/reviewEngine';
import {
  buildManagingEditorPrompt, buildAreaEditorPrompt,
  buildRefereePrompt, buildAESummaryPrompt,
  buildFinalDecisionPrompt, callLLM,
} from './utils/prompts';

type Tab = 'input' | 'workflow' | 'scores' | 'reviews' | 'decision' | 'plan';

const journalOptions: { value: JournalType; label: string }[] = [
  { value: 'MS_OR', label: 'Management Science / Operations Research 类' },
  { value: 'AMJ', label: 'Academy of Management Journal 类' },
  { value: 'SMJ', label: 'Strategic Management Journal 类' },
  { value: 'MISQ_ISR', label: 'MIS Quarterly / ISR 类' },
  { value: 'JBV', label: 'Journal of Business Venturing 类' },
  { value: 'TAR_JAE_JAR', label: 'The Accounting Review / JAE / JAR 类' },
  { value: 'GLWJ_ZGGYJJ', label: '管理世界 / 中国工业经济类' },
  { value: 'NKGL_GLKXXB', label: '南开管理评论 / 管理科学学报类' },
  { value: 'custom', label: '自定义期刊' },
];

const methodOptions: { value: ResearchMethod; label: string }[] = [
  { value: 'multi_case', label: '多案例研究' },
  { value: 'longitudinal_case', label: '纵向案例研究' },
  { value: 'single_case', label: '单案例研究' },
  { value: 'archival', label: '实证档案研究' },
  { value: 'experiment', label: '实验研究' },
  { value: 'survey', label: '问卷研究' },
  { value: 'theory_model', label: '理论模型' },
  { value: 'mixed', label: '混合方法' },
];

const topicOptions: { value: PaperTopic; label: string }[] = [
  { value: 'digital_transformation', label: '数字化转型' },
  { value: 'ai', label: '人工智能' },
  { value: 'innovation_entrepreneurship', label: '创新创业' },
  { value: 'platform_ecosystem', label: '平台生态' },
  { value: 'org_governance', label: '组织治理' },
  { value: 'corp_governance', label: '公司治理' },
  { value: 'supply_chain', label: '供应链' },
  { value: 'accounting_disclosure', label: '会计与信息披露' },
  { value: 'strategic_mgmt', label: '战略管理' },
  { value: 'org_behavior', label: '组织行为' },
  { value: 'other', label: '其他' },
];

const strictOptions: { value: StrictnessLevel; label: string }[] = [
  { value: 'gentle', label: '温和' },
  { value: 'normal', label: '正常' },
  { value: 'strict', label: '严格' },
  { value: 'top_tier', label: '顶刊极严' },
];

export default function App() {
  // Input state
  const [title, setTitle] = useState('');
  const [authorCount, setAuthorCount] = useState(3);
  const [journalType, setJournalType] = useState<JournalType>('NKGL_GLKXXB');
  const [method, setMethod] = useState<ResearchMethod>('archival');
  const [topic, setTopic] = useState<PaperTopic>('corp_governance');
  const [strictness, setStrictness] = useState<StrictnessLevel>('normal');
  const [paperText, setPaperText] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('input');

  // Simulation state
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<StageInfo[]>(getStages());
  const [currentStage, setCurrentStage] = useState(-1);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<PaperMetadata | null>(null);
  const [dimensions, setDimensions] = useState<DimensionScore[]>([]);
  const [reports, setReports] = useState<ReviewerReport[]>([]);
  const [aeSummary, setAeSummary] = useState<EditorSummary | null>(null);
  const [finalDecision, setFinalDecision] = useState<FinalDecision | null>(null);
  const [formatPassed, setFormatPassed] = useState<boolean | null>(null);
  const [deskRejected, setDeskRejected] = useState(false);
  const [meComment, setMeComment] = useState('');
  const [aeComment, setAeComment] = useState('');

  // AI mode
  const [useAI, setUseAI] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('review_sim_api_key') || '');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('anthropic');
  const [showSettings, setShowSettings] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, type: 'info' | 'act' | 'dec' = 'info') => {
    const now = new Date().toLocaleTimeString();
    const cls = type === 'act' ? 'log-act' : type === 'dec' ? 'log-dec' : '';
    setLogLines(prev => [...prev, `<span class="log-time">[${now}]</span> <span class="${cls}">${msg}</span>`]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 100);
  }, []);

  // File handling
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await parseFile(file);
      setPaperText(text);
      setFileName(file.name);
      setTitle(file.name.replace(/\.[^.]+$/, ''));
      addLog(`文件已加载: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    } catch (err: any) {
      alert('文件解析失败: ' + err.message);
    }
  }

  // Save API key
  function saveApiKey() {
    localStorage.setItem('review_sim_api_key', apiKey);
    setShowSettings(false);
  }

  // Main simulation
  async function runSimulation() {
    const text = paperText.trim();
    if (!text || text.length < 200) {
      alert('请先上传论文文件或粘贴论文全文（至少200字）');
      return;
    }

    setRunning(true);
    setLogLines([]);
    setActiveTab('workflow');
    setReports([]);
    setAeSummary(null);
    setFinalDecision(null);
    setFormatPassed(null);
    setDeskRejected(false);

    const newStages = getStages();
    setStages(newStages);
    setCurrentStage(0);

    const updateStage = (idx: number, status: StageInfo['status']) => {
      setStages(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
      setCurrentStage(idx);
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      // Stage 1: Parse metadata
      addLog('══════ 审稿模拟开始 ══════', 'info');
      addLog(`论文标题: ${title || '(未输入)'}`, 'info');
      addLog(`目标期刊: ${JOURNAL_CONFIGS[journalType].label}`, 'info');
      addLog(`研究方法: ${method} | 主题: ${topic} | 严格度: ${strictness}`, 'info');
      updateStage(0, 'done');
      await sleep(400);

      // Stage 2: Managing Editor Format Check
      addLog('', 'info');
      addLog('▶ Managing Editor 格式审查', 'act');
      updateStage(1, 'active');
      await sleep(600);

      const meta = extractMetadata(text);
      setMetadata(meta);
      const fmtScore = scoreFromMetadata(meta, strictness);

      let meMsg = '';
      let passed = true;
      if (!meta.hasAbstract) { meMsg += '• 缺少摘要部分\n'; passed = false; }
      if (!meta.hasKeywords) { meMsg += '• 缺少关键词\n'; passed = false; }
      if (!meta.hasReferences) { meMsg += '• 缺少参考文献\n'; passed = false; }
      if (meta.hasAuthorInfoLeaked) { meMsg += '• 检测到作者信息残留（双盲审查要求隐藏作者信息）\n'; passed = false; }
      if (meta.formatScore < 40) { meMsg += '• 格式规范性严重不足\n'; passed = false; }
      if (meta.aiTraceScore > 60) { meMsg += '• AI写作痕迹过高（估计 ' + meta.aiTraceScore + '%）\n'; passed = false; }
      if (meta.wordCount < 5000) { meMsg += '• 论文字数偏少（约' + meta.wordCount + '字）\n'; passed = false; }

      if (passed) {
        meMsg = '格式审查通过。双盲合规，基本结构完整，进入学术编辑环节。';
        addLog('  ✓ 格式审查通过', 'info');
      } else {
        meMsg = '格式审查发现问题（继续模拟）：\n' + meMsg;
        addLog('  ⚠ 格式审查发现问题（继续模拟流程）', 'dec');
        addLog(meMsg, 'dec');
      }
      setMeComment(meMsg);
      setFormatPassed(passed);
      updateStage(1, 'done');
      await sleep(400);

      // Stage 3: Area Editor initial screening
      addLog('', 'info');
      addLog('▶ Area Editor 初审', 'act');
      updateStage(2, 'done');
      updateStage(3, 'active');
      await sleep(600);

      const dims = evaluateDimensions(text, meta, journalType, method, topic, strictness);
      setDimensions(dims);
      const avgDimScore = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);
      addLog(`  → 维度综合评分: ${avgDimScore}/100`, 'info');

      // Desk reject check
      const worstDims = dims.filter(d => d.score < 40);
      const drRisk = (worstDims.length >= 6 && avgDimScore < 40) || avgDimScore < 25;

      if (drRisk) {
        addLog('  ⚠ Area Editor Desk Reject!（但仍生成审稿意见供参考）', 'dec');
        const reasons = worstDims.slice(0, 3).map(d => d.dimension.split('（')[0]).join('、');
        setAeComment(`研究问题不够聚焦，${reasons}等方面存在明显不足。论文在理论贡献和研究设计方面未达到送审标准。`);
        addLog(`    原因: ${reasons}等方面存在明显不足`, 'dec');
        setDeskRejected(true);
      }

      addLog('  ✓ 通过初审，进入送审环节', 'info');
      updateStage(3, 'done');
      await sleep(400);

      // Stage 4-6: Assign AE, find reviewers
      updateStage(4, 'done');
      addLog('', 'info');
      addLog('▶ Associate Editor 寻找审稿人', 'act');
      updateStage(5, 'active');
      await sleep(600);

      const reviewers = generateReviewers(method, topic);
      addLog(`  → 邀请了 ${reviewers.length} 位审稿人`, 'info');
      reviewers.forEach(r => {
        addLog(`    ${r.name} (${r.institution}) - ${r.type === 'theory' ? '理论型' : r.type === 'method' ? '方法型' : '领域型'}`, 'info');
      });
      updateStage(5, 'done');
      await sleep(400);

      // Stage 7-8: Reviewers review
      addLog('', 'info');
      addLog('▶ With Reviewers — 同行评审中...', 'act');
      updateStage(6, 'active');
      updateStage(7, 'active');
      await sleep(1000);

      addLog('  → Awaiting Reviewer Scores...', 'info');
      await sleep(800);

      const generatedReports: ReviewerReport[] = [];
      for (let i = 0; i < reviewers.length; i++) {
        addLog(`  ✓ Reviewer #${i + 1} (${reviewers[i].name}) 提交了审稿报告`, 'info');

        if (useAI && apiKey) {
          try {
            const prompt = buildRefereePrompt(reviewers[i], text);
            const aiResponse = await callLLM(prompt, apiKey, aiProvider);
            // Parse AI response (simplified - in production would need more robust parsing)
            const report = generateReviewerReport(reviewers[i], dims, text, method, strictness);
            report.summary = aiResponse.substring(0, 500);
            generatedReports.push(report);
          } catch (err) {
            addLog(`    AI调用失败，使用规则引擎生成报告`, 'info');
            generatedReports.push(generateReviewerReport(reviewers[i], dims, text, method, strictness));
          }
        } else {
          generatedReports.push(generateReviewerReport(reviewers[i], dims, text, method, strictness));
        }
      }

      setReports(generatedReports);
      updateStage(6, 'done');
      updateStage(7, 'done');
      await sleep(400);

      // Stage 9: AE Recommendation
      addLog('', 'info');
      addLog('▶ Associate Editor 综合评审', 'act');
      updateStage(8, 'active');
      await sleep(600);

      const aeRec = generateAERecommendation(generatedReports, dims);
      setAeSummary(aeRec);
      addLog(`  → AE综合建议: ${aeRec.aeRecommendation}`, 'dec');
      addLog(`    审稿意见一致性: ${aeRec.reviewerAgreement === 'high' ? '高度一致' : aeRec.reviewerAgreement === 'moderate' ? '中等一致' : '存在分歧'}`, 'info');
      updateStage(8, 'done');
      await sleep(400);

      // Stage 10-11: Final Decision
      addLog('', 'info');
      addLog('▶ Area Editor 最终决定', 'act');
      updateStage(9, 'active');
      await sleep(600);

      const finalDec = generateFinalDecision(aeRec, dims);
      setFinalDecision(finalDec);
      addLog(`  → 最终决定: ${finalDec.decision}`, 'dec');
      updateStage(9, 'done');
      updateStage(10, 'done');

      addLog('', 'info');
      addLog('══════ 审稿流程结束 ══════', 'info');

      setRunning(false);
      setActiveTab('decision');

    } catch (err: any) {
      addLog(`[错误] ${err.message}`, 'dec');
      setRunning(false);
    }
  }

  // Export
  function exportHTML() {
    const content = document.getElementById('export-content')?.innerHTML;
    if (!content) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>模拟审稿报告</title>
<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:20px;line-height:1.7}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:18px 22px;margin-bottom:12px}
h2{color:#1e3a5f;border-bottom:2px solid #f0e6c0;padding-bottom:8px}
.verdict{display:inline-block;padding:3px 12px;border-radius:14px;font-weight:700;font-size:0.85rem}
@media print{body{padding:0}}</style></head><body><h1>管理学期刊模拟审稿报告</h1>
<p style="color:#6b7280;">此报告为投稿前模拟审稿工具生成，不代表真实期刊或真实编辑部意见。</p>${content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'review-report.html'; a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    const content = document.getElementById('export-content')?.innerText;
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => alert('已复制到剪贴板'));
  }

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <h1>管理学期刊模拟审稿系统</h1>
        <p>Management Journal Review Simulator — 投稿前自查工具</p>
        <span className="disclaimer">⚠ 这是一个投稿前模拟审稿工具，不代表真实期刊或真实编辑部意见</span>
      </header>

      {/* Input Area */}
      <section className="section" id="input-area">
        <h2 className="section-title">论文输入区</h2>
        <div className="card">
          <div className="g2">
            <div>
              <div className="form-row">
                <label>论文标题</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入论文标题" />
              </div>
              <div className="form-row">
                <label>作者数量</label>
                <input type="number" value={authorCount} onChange={e => setAuthorCount(Number(e.target.value))} min={1} max={10} style={{width:100}} />
              </div>
              <div className="form-row">
                <label>上传论文文件</label>
                <input type="file" accept=".txt,.md,.docx" onChange={handleFile} />
                <span className="hint">支持 .txt / .md / .docx</span>
                {fileName && <div className="file-badge" style={{marginTop:8}}>📄 {fileName} <button onClick={() => { setFileName(''); setPaperText(''); }} style={{border:'none',background:'none',cursor:'pointer'}}>✕</button></div>}
              </div>
              <div className="form-row">
                <label>或直接粘贴论文全文</label>
                <textarea value={paperText} onChange={e => setPaperText(e.target.value)} placeholder="在此粘贴论文全文..."></textarea>
              </div>
            </div>
            <div>
              <div className="form-row">
                <label>目标期刊类型</label>
                <select value={journalType} onChange={e => setJournalType(e.target.value as JournalType)}>
                  {journalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>研究方法</label>
                <select value={method} onChange={e => setMethod(e.target.value as ResearchMethod)}>
                  {methodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>论文主题</label>
                <select value={topic} onChange={e => setTopic(e.target.value as PaperTopic)}>
                  {topicOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>审稿严格程度</label>
                <select value={strictness} onChange={e => setStrictness(e.target.value as StrictnessLevel)}>
                  {strictOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>
                  <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} style={{width:'auto',marginRight:6}} />
                  AI 增强模式（使用 LLM 生成更真实的审稿意见）
                </label>
                {useAI && (
                  <div style={{marginTop:8}}>
                    <button className="btn btn-sm btn-outline" onClick={() => setShowSettings(true)}>⚙ API设置</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:18}}>
            <button className="btn btn-accent" onClick={runSimulation} disabled={running} style={{fontSize:'1.05rem',padding:'12px 40px'}}>
              {running ? <><span className="spinner" /> 模拟审稿中...</> : '▶ 开始模拟审稿'}
            </button>
          </div>
        </div>
      </section>

      {/* Results tabs */}
      {stages.some(s => s.status !== 'waiting') && (
        <>
          <div className="tab-row">
            {(['workflow','scores','reviews','decision','plan'] as Tab[]).map(t => (
              <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {{input:'论文输入',workflow:'审稿流程',scores:'维度评分',reviews:'审稿意见',decision:'编辑决定',plan:'返修计划'}[t]}
              </button>
            ))}
          </div>

          {/* TAB: Workflow */}
          {activeTab === 'workflow' && (
            <section className="section">
              <h2 className="section-title">模拟流程进度</h2>
              <div className="card">
                <div className="workflow-bar">
                  {stages.slice(0, 10).map((s, i) => (
                    <div key={s.stage} className="wf-step">
                      <div className={`wf-dot ${s.status}`}>
                        {s.status === 'done' ? '✓' : s.status === 'reject' ? '✗' : i + 1}
                      </div>
                      <div style={{fontWeight:600}}>{s.label}</div>
                      <div style={{color:'var(--text-muted)',fontSize:'0.68rem'}}>{s.timeEstimate}</div>
                      {s.riskLevel === 'high' && <div style={{color:'var(--danger)',fontSize:'0.65rem'}}>⚠ {s.risk}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>流程日志</h3>
                <div className="log-console" ref={logRef} dangerouslySetInnerHTML={{ __html: logLines.join('\n') }} />
              </div>
            </section>
          )}

          {/* TAB: Scores */}
          {activeTab === 'scores' && dimensions.length > 0 && (
            <section className="section">
              <h2 className="section-title">审稿维度评分</h2>
              <div className="card">
                <div className="g2">
                  {dimensions.map(d => (
                    <div key={d.dimension} className="score-bar">
                      <div className="bar-h">
                        <span>{d.dimension}</span>
                        <span style={{color: d.score >= 70 ? 'var(--success)' : d.score >= 50 ? 'var(--warning)' : 'var(--danger)',fontWeight:700}}>{d.score}/100</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{
                          width: d.score + '%',
                          background: d.score >= 70 ? 'var(--success)' : d.score >= 50 ? 'var(--accent)' : 'var(--danger)'
                        }} />
                      </div>
                      <div style={{fontSize:'0.76rem',color:'var(--text-muted)',marginTop:2}}>
                        风险: <span style={{color: d.riskLevel === 'high' ? 'var(--danger)' : d.riskLevel === 'medium' ? 'var(--warning)' : 'var(--success)'}}>{d.riskLevel === 'high' ? '高' : d.riskLevel === 'medium' ? '中' : '低'}</span>
                        {' · '}{d.mainIssue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* TAB: Reviews */}
          {activeTab === 'reviews' && reports.length > 0 && (
            <section className="section">
              <h2 className="section-title">模拟审稿人意见</h2>
              {reports.map((report, i) => (
                <div key={i} className="review-block">
                  <div className="r-header">
                    <div>
                      <div className="r-name">Reviewer #{i + 1}: {report.reviewer.name}</div>
                      <div className="r-affil">{report.reviewer.institution}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>
                        {report.reviewer.type === 'theory' ? '理论型审稿人' : report.reviewer.type === 'method' ? '方法型审稿人' : '领域型审稿人'}
                        {' · '}专长: {report.reviewer.expertise.slice(0, 3).join(', ')}
                      </div>
                    </div>
                    <span className={`verdict-tag ${
                      report.overallRecommendation === 'Minor Revision' ? 'v-minor' :
                      report.overallRecommendation === 'Major Revision' ? 'v-major' :
                      report.overallRecommendation === 'Reject and Resubmit' ? 'v-rr' : 'v-reject'
                    }`}>{report.overallRecommendation}</span>
                  </div>

                  <div className="hl hl-info">
                    <strong>Overall Score: {report.overallScore}/100</strong>
                  </div>

                  <h4 style={{marginTop:14,color:'var(--primary)'}}>Summary</h4>
                  <p style={{fontSize:'0.88rem',color:'var(--text-muted)'}}>{report.summary}</p>

                  <h4 style={{marginTop:14,color:'var(--primary)'}}>Major Comments</h4>
                  {report.majorComments.map((c, j) => (
                    <div key={j} className="comment-item major">
                      <strong>#{j + 1}. {c.problem}</strong>
                      <div style={{fontSize:'0.84rem',color:'var(--text-muted)',marginTop:4}}>
                        <p><strong>Why important:</strong> {c.whyImportant}</p>
                        <p><strong>How to fix:</strong> {c.howToFix}</p>
                        <p style={{color:'var(--danger)'}}><strong>Risk if not fixed:</strong> {c.rejectRiskIfNotFixed}</p>
                      </div>
                    </div>
                  ))}

                  <h4 style={{marginTop:14,color:'var(--primary)'}}>Minor Comments</h4>
                  {report.minorComments.map((c, j) => (
                    <div key={j} className="comment-item minor" style={{fontSize:'0.85rem'}}>
                      {j + 1}. {c}
                    </div>
                  ))}

                  <h4 style={{marginTop:14,color:'var(--danger)'}}>Most Critical Revision</h4>
                  <div className="hl hl-err">{report.mostCriticalRevision}</div>
                </div>
              ))}
            </section>
          )}

          {/* TAB: Decision */}
          {activeTab === 'decision' && (
            <section className="section" id="export-content">
              <h2 className="section-title">编辑决定与报告</h2>

              {/* Managing Editor */}
              {meComment && (
                <div className="card">
                  <h3>Managing Editor 格式审查意见</h3>
                  <div className={`hl ${formatPassed ? 'hl-ok' : 'hl-err'}`}>
                    <strong>决定: {formatPassed ? 'PASS — 进入学术编辑环节' : 'FAIL — 退回作者修改'}</strong>
                  </div>
                  <pre style={{whiteSpace:'pre-wrap',fontSize:'0.86rem',marginTop:8}}>{meComment}</pre>
                </div>
              )}

              {/* Desk reject */}
              {deskRejected && (
                <div className="card">
                  <div className="decision-banner desk">
                    <h2>Desk Reject</h2>
                    <p>Area Editor 决定不送外审</p>
                  </div>
                  <div className="hl hl-err">{aeComment}</div>
                </div>
              )}

              {/* Final Decision */}
              {finalDecision && (
                <div className="card">
                  <div className={`decision-banner ${
                    finalDecision.decision === 'Accept' ? 'accept' :
                    finalDecision.decision === 'Minor Revision' ? 'minor' :
                    finalDecision.decision === 'Major Revision' ? 'major' :
                    finalDecision.decision === 'Reject and Resubmit' ? 'rr' : 'reject'
                  }`}>
                    <h2>Area Editor Final Decision: {finalDecision.decision}</h2>
                    {finalDecision.rnrExplanation && (
                      <div className="hl hl-warn" style={{textAlign:'left',marginTop:10}}>
                        <strong>关于 Reject and Resubmit 的说明：</strong>{finalDecision.rnrExplanation}
                      </div>
                    )}
                  </div>

                  <h4>Main Reasons</h4>
                  <ul style={{paddingLeft:18}}>
                    {finalDecision.mainReasons.map((r, i) => <li key={i} style={{marginBottom:4}}>{r}</li>)}
                  </ul>

                  {finalDecision.requiredRevisions && finalDecision.requiredRevisions.length > 0 && (
                    <>
                      <h4 style={{marginTop:12}}>Required Revisions</h4>
                      <ul style={{paddingLeft:18}}>
                        {finalDecision.requiredRevisions.map((r, i) => <li key={i} style={{marginBottom:4}}>{r}</li>)}
                      </ul>
                    </>
                  )}

                  <div className="g2" style={{marginTop:12}}>
                    <div><strong>返修难度:</strong> {finalDecision.revisionDifficulty}</div>
                    <div><strong>建议返修周期:</strong> {finalDecision.suggestedRevisionPeriod}</div>
                  </div>
                </div>
              )}

              {/* AE Summary */}
              {aeSummary && (
                <div className="card">
                  <h3>Associate Editor 汇总报告</h3>
                  <div className="hl hl-info">
                    <strong>AE建议: {aeSummary.aeRecommendation}</strong>
                  </div>
                  <p style={{marginTop:8}}><strong>审稿人一致性:</strong> {aeSummary.agreementDetail}</p>
                  <p><strong>最大潜力:</strong> {aeSummary.maxPotential}</p>
                  <p><strong>最大风险:</strong> {aeSummary.maxRejectRisk}</p>
                  <p><strong>理由:</strong> {aeSummary.aeRationale}</p>
                </div>
              )}

              {/* Export buttons */}
              <div className="btn-group" style={{marginTop:16}}>
                <button className="btn btn-outline btn-sm" onClick={exportHTML}>📥 导出HTML报告</button>
                <button className="btn btn-outline btn-sm" onClick={copyToClipboard}>📋 复制到剪贴板</button>
                <button className="btn btn-outline btn-sm" onClick={() => window.print()}>🖨 打印PDF</button>
              </div>
            </section>
          )}

          {/* TAB: Revision Plan */}
          {activeTab === 'plan' && finalDecision?.revisionPlan && (
            <section className="section">
              <h2 className="section-title">返修路线图</h2>
              <div className="card">
                <h3>{finalDecision.decision} — 返修计划</h3>
                <p style={{color:'var(--text-muted)',marginBottom:14}}>
                  建议返修周期: {finalDecision.suggestedRevisionPeriod} | 难度: {finalDecision.revisionDifficulty}
                </p>
                {finalDecision.revisionPlan.rounds.map((rnd, i) => (
                  <div key={i} className="rev-round">
                    <h4>第{rnd.round}轮: {rnd.focus}</h4>
                    <ul style={{paddingLeft:18}}>
                      {rnd.tasks.map((t, j) => <li key={j} style={{marginBottom:3}}>{t}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="modal">
            <h3>AI API 设置</h3>
            <p style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:12}}>
              API Key 仅保存在浏览器 localStorage，不上传至任何服务器。
            </p>
            <div className="form-row">
              <label>AI 提供商</label>
              <select value={aiProvider} onChange={e => setAiProvider(e.target.value as 'openai' | 'anthropic')}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div className="form-row">
              <label>API Key</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-... 或 anthropic-api-key" />
            </div>
            <div className="btn-group">
              <button className="btn btn-primary btn-sm" onClick={saveApiKey}>保存</button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowSettings(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
