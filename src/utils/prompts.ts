import { ReviewerProfile, ReviewerReport } from '../types';

export function buildManagingEditorPrompt(title: string, metadata: string): string {
  return `你是一位管理学顶级期刊的 Managing Editor。请对以下论文进行格式和投稿规范初筛。

论文标题：${title}

论文元数据：
${metadata}

请判断是否存在以下必须退回作者的格式问题：
- 作者信息未隐藏（双盲审查要求）
- 摘要缺失或字数不足
- 关键词不足
- 图表编号混乱
- 参考文献格式严重不规范
- 论文结构不完整（缺少引言/文献综述/研究设计/结论等关键部分）
- 存在明显的AI写作痕迹

请输出：
1. 格式审查结果
2. 主要问题列表
3. 是否通过格式审查（PASS / FAIL）

如果FAIL，说明需要修正的具体项目。
如果PASS，说明论文可以进入学术编辑环节。请用学术期刊编辑的语气回复。`;
}

export function buildAreaEditorPrompt(title: string, abstract: string, intro: string): string {
  return `你是一位管理学顶级期刊的 Area Editor。请根据以下论文信息，判断论文是否值得送审。

论文标题：${title}
摘要：${abstract}
引言开头：${intro}

请重点评估：
1. 研究问题是否有理论张力
2. 与期刊定位是否匹配
3. 理论贡献潜力
4. 方法可信度
5. 是否存在 Desk Reject 风险

请给出初步决定：Desk Reject / Send to AE / Need Clarification

请模拟真实编辑语气，不要泛泛表扬。编辑的语气应该是专业、简短、直击要害的。`;
}

export function buildRefereePrompt(
  reviewer: ReviewerProfile,
  paperText: string
): string {
  const typeInstructions: Record<string, string> = {
    theory: `你是理论型审稿人。请重点关注：
- 研究问题是否清楚且有理论张力
- 理论缺口是否成立
- 文献对话是否充分且批判性
- 理论贡献是否真正增量（不是"丰富"而是"拓展/修正/挑战"）
- 构念是否清晰、定义是否准确
- 假设/命题的推导是否有严密的逻辑链`,

    method: `你是方法型审稿人。请重点关注：
- 研究设计是否与研究问题匹配
- 数据来源是否充分可靠
- 样本选择是否有依据
- 证据链是否闭合完整
- 分析过程是否透明可复现
- 内生性/效度/稳健性问题是否得到充分处理
- 如果是案例研究：是否有理论抽样逻辑和复制逻辑`,

    domain: `你是领域型/实践型审稿人。请重点关注：
- 研究现象是否重要、是否与管理实践紧密相关
- 结论是否具有明确的管理启示和政策含义
- 是否真正解释了实践中的机制
- 边界条件是否被充分讨论
- 语言和结构是否清晰易读
- 研究是否对管理者和政策制定者有实际价值`,
  };

  return `你是一位管理学期刊的匿名审稿人（Reviewer）。

你的身份：
- 姓名：${reviewer.name}
- 机构：${reviewer.institution}
- 专长：${reviewer.expertise.join(', ')}
- 审稿类型：${reviewer.type === 'theory' ? '理论型' : reviewer.type === 'method' ? '方法型' : '领域型'}
- 审稿风格：严格但建设性

${typeInstructions[reviewer.type] || ''}

请对以下论文进行审稿。请以严格但建设性的语气撰写审稿报告。

论文内容：
${paperText.substring(0, 8000)}${paperText.length > 8000 ? '\n\n[... 论文内容过长，已截取前8000字 ...]' : ''}

请输出完整的审稿报告，包括：
1. Overall Recommendation (Accept / Minor Revision / Major Revision / Reject and Resubmit / Reject)
2. Summary（一段话总结论文的核心内容和贡献）
3. Major Comments（至少5条主要意见，每条包括：问题描述、为什么重要、如何修改、不修改的后果）
4. Minor Comments（至少5条次要意见，包括语言、结构、格式、引用等）
5. Most Critical Revision（最关键的1个修改点）

要求：
- 意见必须具体、专业、可操作，不能泛泛而谈
- 每条 Major Comment 都要说明为什么重要、如何修改、不修改会有什么拒稿风险
- 语气参照真实管理学审稿人——直接、专业、建设性
- 不要写"这是一篇有趣的论文"之类的泛泛套话
- 中文或英文皆可，根据论文语言决定`;
}

export function buildAESummaryPrompt(reports: ReviewerReport[]): string {
  const reportSummaries = reports.map((r, i) =>
    `Reviewer #${i + 1} (${r.reviewer.name}, ${r.reviewer.type}型):\nRecommendation: ${r.overallRecommendation}\nSummary: ${r.summary}\n`
  ).join('\n');

  return `你是一位 Associate Editor。请综合以下审稿人意见，撰写 AE Recommendation。

${reportSummaries}

请判断：
1. 审稿人意见是否一致？存在什么分歧？
2. 论文是否还有返修价值？
3. 最大潜力是什么？
4. 最大拒稿风险是什么？

请输出 AE Recommendation，包括：
- 审稿意见一致性评估
- 主要理由
- 优先修改事项
- 建议决定 (Accept / Minor Revision / Major Revision / Reject and Resubmit / Reject)`;
}

export function buildFinalDecisionPrompt(
  aeRecommendation: string,
  refereeSummary: string
): string {
  return `你是一位 Area Editor。请根据以下 AE Recommendation 和 Referee Reports 做最终决定。

AE Recommendation: ${aeRecommendation}
Referee Reports Summary: ${refereeSummary}

请输出正式编辑决定信，语气符合管理学期刊编辑信风格，包含：
1. Decision
2. Main Reasons
3. Required Revisions（如有）
4. Risk of Resubmission（如适用）
5. Suggested Revision Strategy
6. Closing Note

如果是 Reject and Resubmit，请特别说明为什么不是 Major Revision。
如果是 Major Revision，请说明必须完成哪些修改。
如果是 Desk Reject，请说明主要硬伤。`;
}

export async function callLLM(
  prompt: string, apiKey: string, provider: 'openai' | 'anthropic' = 'openai',
  model: string = 'gpt-4o'
): Promise<string> {
  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  } else {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return data.content[0].text;
  }
}
