import mammoth from 'mammoth';
import { PaperMetadata } from '../types';

export async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseTxt(file: File): Promise<string> {
  return await file.text();
}

export async function parseFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return parseDocx(file);
  if (ext === 'txt' || ext === 'md') return parseTxt(file);
  throw new Error('不支持的文件格式：' + ext);
}

export function extractMetadata(text: string): PaperMetadata {
  const clean = text.replace(/\s/g, '');
  const lines = text.split('\n').filter(l => l.trim());

  const hasAbstract = /摘要|ABSTRACT|Abstract|内容提要/.test(text);
  const hasKeywords = /关键词|Keywords|KEYWORDS/.test(text);
  const hasIntroduction = /引言|问题的提出|绪论|INTRODUCTION|Introduction/.test(text);
  const hasLiteratureReview = /文献综述|相关研究|文献回顾|理论背景|LITERATURE|Literature Review|Related Work|理论基础/.test(text);
  const hasResearchDesign = /研究设计|研究方法|数据.*来源|样本|变量.*定义|模型设定|METHOD|Method|Data|Sample/.test(text);
  const hasDataSection = /数据|样本|描述性统计|描述.*统计|Descriptive Statistic/.test(text);
  const hasAnalysis = /实证.*结果|实证.*分析|结果.*分析|回归.*结果|案例分析|RESULTS|Result|Analysis/.test(text);
  const hasDiscussion = /讨论|DISCUSSION|Discussion/.test(text);
  const hasConclusion = /结论|启示|建议|CONCLUSION|Conclusion/.test(text);
  const hasReferences = /参考文献|REFERENCES|References|引用文献/.test(text);
  const hasAuthorInfoLeaked = /作者[：:：]|Author[：:：]|作者简介|通讯作者|作者单位|Author Affiliation/.test(text);
  const hasFigureTableNumbers = /图\d|表\d|Figure \d|Table \d|Fig\.\s*\d/.test(text);

  // AI trace detection
  let aiTraceScore = 0;
  const aiPatterns = [
    /值得注意的是|需要指出的是|不可否认|毋庸置疑|显而易见|极大地|具有.*重要.*意义|综上所述.*我们.*可以.*得出/g,
    /值得注意的是/g, /需要指出的是/g, /不可否认/g, /毋庸置疑/g,
    /在这一背景下|随着.*的.*发展|在.*新时代/g,
    /首先.*其次.*再次.*最后/g,
  ];
  aiPatterns.forEach(p => {
    const matches = text.match(p);
    if (matches) aiTraceScore += matches.length * 3;
  });
  aiTraceScore = Math.min(100, aiTraceScore);

  // Format score
  let formatScore = 100;
  if (!hasAbstract) formatScore -= 15;
  if (!hasKeywords) formatScore -= 10;
  if (!hasIntroduction) formatScore -= 10;
  if (!hasLiteratureReview) formatScore -= 10;
  if (!hasResearchDesign) formatScore -= 10;
  if (!hasDataSection && !hasAnalysis) formatScore -= 10;
  if (!hasConclusion && !hasDiscussion) formatScore -= 8;
  if (!hasReferences) formatScore -= 15;
  if (hasAuthorInfoLeaked) formatScore -= 12;
  if (clean.length < 8000) formatScore -= 10;
  if (clean.length > 25000) formatScore -= 5;
  if (aiTraceScore > 40) formatScore -= 15;

  return {
    title: lines[0]?.trim().substring(0, 100) || '',
    authorCount: 0,
    wordCount: clean.length,
    hasAbstract, hasKeywords, hasIntroduction,
    hasLiteratureReview, hasResearchDesign, hasDataSection,
    hasAnalysis, hasDiscussion, hasConclusion, hasReferences,
    hasAuthorInfoLeaked, hasFigureTableNumbers,
    aiTraceScore, formatScore: Math.max(0, formatScore),
  };
}
