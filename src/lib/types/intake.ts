/** ── Intake Wizard Types ────────────────────────────────────── */

export type CompanySize = 'solo' | 'small' | 'medium' | 'enterprise';
export type Timeline = 'asap' | 'this_week' | 'this_month' | 'no_rush';
export type BudgetRange = 'under_500' | '500_2500' | '2500_10000' | '10000_plus' | 'unsure';
export type ComplianceReq = 'hipaa' | 'soc2' | 'pci' | 'none' | 'unsure';
export type ApprovalLevel = 'just_me' | 'manager' | 'legal_it';

export type RequestCategory =
	| 'style_visual'
	| 'feature_addition'
	| 'internal_tool'
	| 'full_retool'
	| 'integration_api';

export interface IntakeFormData {
	// Step 1: Identity & Context
	companyName: string;
	role: string;
	companySize: CompanySize | '';
	industry: string;

	// Step 2: Current State
	existingUrl: string;
	techStack: string;
	hostingProvider: string;
	hasCodebaseAccess: boolean | null;
	codebaseUrl: string;
	hasBrandAssets: boolean | null;

	// Step 3: What You Want
	categories: RequestCategory[];
	description: string;
	referenceUrls: string[];

	// Step 4: Priority & Constraints
	timeline: Timeline | '';
	budget: BudgetRange | '';
	compliance: ComplianceReq[];
	approvalLevel: ApprovalLevel | '';

	// Step 5: Review (no extra fields — uses all above)
}

export const EMPTY_INTAKE: IntakeFormData = {
	companyName: '',
	role: '',
	companySize: '',
	industry: '',
	existingUrl: '',
	techStack: '',
	hostingProvider: '',
	hasCodebaseAccess: null,
	codebaseUrl: '',
	hasBrandAssets: null,
	categories: [],
	description: '',
	referenceUrls: [''],
	timeline: '',
	budget: '',
	compliance: [],
	approvalLevel: ''
};

export const STEP_LABELS = [
	'Identity & Context',
	'Current State',
	'What You Want',
	'Priority & Constraints',
	'Review & Submit'
] as const;

export const INDUSTRIES = [
	'Technology',
	'Healthcare',
	'Finance',
	'Retail / E-Commerce',
	'Food Service',
	'Logistics',
	'Education',
	'Real Estate',
	'Manufacturing',
	'Media & Entertainment',
	'Other'
] as const;

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
	style_visual: 'Style & Visual Changes',
	feature_addition: 'Feature Addition',
	internal_tool: 'Internal Tool / Workflow',
	full_retool: 'Full Retool / Rebuild',
	integration_api: 'Integration & API'
};

