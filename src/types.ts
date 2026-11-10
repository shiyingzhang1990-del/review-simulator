export type JournalType =
  | 'MS_OR' | 'AMJ' | 'SMJ' | 'MISQ_ISR' | 'JBV'
  | 'TAR_JAE_JAR' | 'GLWJ_ZGGYJJ' | 'NKGL_GLKXXB' | 'custom';

export type ResearchMethod =
  | 'multi_case' | 'longitudinal_case' | 'single_case'
  | 'archival' | 'experiment' | 'survey'
  | 'theory_model' | 'mixed';

export type PaperTopic =
  | 'digital_transformation' | 'ai' | 'innovation_entrepreneurship'
  | 'platform_ecosystem' | 'org_governance' | 'corp_governance'
  | 'supply_chain' | 'accounting_disclosure' | 'strategic_mgmt'
  | 'org_behavior' | 'other';

export type StrictnessLevel = 'gentle' | 'normal' | 'strict' | 'top_tier';

export type DecisionType =
  | 'Desk Reject' | 'Reject' | 'Reject and Resubmit'
  | 'Major Revision' | 'Minor Revision'
  | 'Conditional Accept' | 'Accept';

export type ReviewStage =
  | 'manuscript_submitted'
  | 'format_check'
  | 'assigned_area_editor'
  | 'area_editor_screening'
  | 'assigned_associate_editor'
  | 'ae_inviting_reviewers'
  | 'with_reviewers'
  | 'awaiting_scores'
  | 'ae_recommendation'
  | 'area_editor_decision'
  | 'decision_letter';

export type StageStatus = 'waiting' | 'active' | 'done' | 'risk' | 'reject';

export interface StageInfo {
  stage: ReviewStage;
  label: string;
  status: StageStatus;
  timeEstimate: string;
  risk?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface DimensionScore {
  dimension: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  mainIssue: string;
  suggestion: string;
  impactOnDecision: string;
}

export interface ReviewerProfile {
  id: number;
  name: string;
  institution: string;
  expertise: string[];
  type: 'theory' | 'method' | 'domain';
  strictness: number; // 0-1
}

export interface ReviewerReport {
  reviewer: ReviewerProfile;
  overallRecommendation: DecisionType;
  summary: string;
  majorComments: MajorComment[];
  minorComments: string[];
  mostCriticalRevision: string;
  dimensionScores: Record<string, number>;
  overallScore: number;
}

export interface MajorComment {
  problem: string;
  whyImportant: string;
  howToFix: string;
  rejectRiskIfNotFixed: string;
}

export interface EditorSummary {
  reviewerAgreement: 'high' | 'moderate' | 'low' | 'conflict';
  agreementDetail: string;
  maxPotential: string;
  maxRejectRisk: string;
  aeRecommendation: DecisionType;
  aeRationale: string;
}

export interface FinalDecision {
  decision: DecisionType;
  mainReasons: string[];
  rnrOpportunity: boolean;
  rnrExplanation?: string;
  requiredRevisions?: string[];
  revisionDifficulty: 'low' | 'medium' | 'high' | 'extreme';
  suggestedRevisionPeriod: string;
  revisionPlan?: RevisionPlan;
}

export interface RevisionPlan {
  rounds: { round: number; focus: string; tasks: string[] }[];
}

export interface PaperMetadata {
  title: string;
  authorCount: number;
  wordCount: number;
  hasAbstract: boolean;
  hasKeywords: boolean;
  hasIntroduction: boolean;
  hasLiteratureReview: boolean;
  hasResearchDesign: boolean;
  hasDataSection: boolean;
  hasAnalysis: boolean;
  hasDiscussion: boolean;
  hasConclusion: boolean;
  hasReferences: boolean;
  hasAuthorInfoLeaked: boolean;
  hasFigureTableNumbers: boolean;
  aiTraceScore: number;
  formatScore: number;
}

export interface JournalConfig {
  type: JournalType;
  label: string;
  category: string;
  weights: Record<string, number>;
  styleNote: string;
}
