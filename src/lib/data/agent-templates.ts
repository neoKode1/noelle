/**
 * Agent Template Registry — ported from +12 Monkeys template_registry.py
 * 20 built-in templates covering common agent use cases. Zero runtime deps.
 */
import type { AgentTemplate } from '$lib/types/agent';

const TEMPLATES: AgentTemplate[] = [
	// 1. Customer Service Agent
	{
		id: 'customer-service', name: 'Customer Service Agent', category: 'customer-service', framework: 'crewai',
		description: 'Multi-role agent team for customer support — triage, specialist handling, and escalation.',
		agents: [
			{ role: 'triage', goal: 'Classify and route incoming requests', backstory: 'Expert at understanding customer intent', tools: ['search_kb'] },
			{ role: 'specialist', goal: 'Handle domain-specific queries with detailed answers', backstory: 'Deep product knowledge specialist', tools: ['search_kb', 'lookup_order'] },
			{ role: 'escalation', goal: 'Escalate complex issues to human agents', backstory: 'Knows when AI can\'t solve it', tools: ['create_ticket'] },
		],
		mcpServers: [
			{ name: 'salesforce', command: 'npx', args: ['-y', '@salesforce/mcp-server'], requiredEnv: ['SALESFORCE_INSTANCE_URL', 'SALESFORCE_ACCESS_TOKEN'], category: 'crm' },
			{ name: 'slack', command: 'npx', args: ['-y', '@slack/mcp-server'], requiredEnv: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'], category: 'communication' },
		],
		requiredFields: [
			{ name: 'company_name', label: 'Company Name', required: true, description: 'Your company name for the agent persona' },
			{ name: 'support_channels', label: 'Support Channels', fieldType: 'multiselect', options: ['chat', 'email', 'slack'], required: true },
		],
		optionalFields: [
			{ name: 'knowledge_base_url', label: 'Knowledge Base URL', description: 'URL to your FAQ / help center' },
			{ name: 'escalation_email', label: 'Escalation Email', description: 'Where to send escalated tickets' },
		],
		estimatedCost: '$50-100/month', tags: ['customer-service', 'crewai', 'multi-agent', 'support'], deploymentDefault: 'cloud',
	},
	// 2. Research Agent
	{
		id: 'research', name: 'Research Agent', category: 'research', framework: 'langgraph',
		description: 'Iterative research pipeline — searches the web, extracts data, synthesizes findings into reports.',
		agents: [
			{ role: 'planner', goal: 'Break research question into sub-queries', backstory: 'Expert at decomposing complex topics', tools: ['web_search'] },
			{ role: 'researcher', goal: 'Execute searches and extract key findings', backstory: 'Data extraction and synthesis specialist', tools: ['web_search', 'scrape'] },
			{ role: 'synthesizer', goal: 'Combine findings into a coherent report', backstory: 'Skilled technical writer', tools: [] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'research_domain', label: 'Research Domain', description: 'Primary area of research (e.g. technology, finance, science)', required: true },
		],
		optionalFields: [
			{ name: 'output_format', label: 'Output Format', fieldType: 'select', options: ['markdown', 'pdf', 'json'] },
			{ name: 'max_sources', label: 'Max Sources', fieldType: 'number' },
		],
		estimatedCost: '$30-80/month', tags: ['research', 'langgraph', 'web-search', 'analysis'], deploymentDefault: 'local',
	},
	// 3. Data Analysis Agent
	{
		id: 'data-analysis', name: 'Data Analysis Agent', category: 'data-analysis', framework: 'langgraph',
		description: 'Connects to databases, runs queries, and produces insights with visualisation suggestions.',
		agents: [
			{ role: 'planner', goal: 'Translate natural language to a query plan', backstory: 'Expert at query planning', tools: [] },
			{ role: 'executor', goal: 'Execute SQL/NoSQL queries safely', backstory: 'Database specialist', tools: ['run_query'] },
		],
		mcpServers: [
			{ name: 'postgres', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], requiredEnv: ['DATABASE_URL'], category: 'data' },
		],
		requiredFields: [
			{ name: 'db_type', label: 'Database Type', fieldType: 'select', options: ['postgres', 'mongodb', 'mysql', 'sqlite'], required: true },
		],
		optionalFields: [
			{ name: 'read_only', label: 'Read-only Mode', fieldType: 'select', options: ['true', 'false'], description: 'Restrict to SELECT queries only' },
		],
		estimatedCost: '$20-60/month', tags: ['data', 'langgraph', 'sql', 'analytics'], deploymentDefault: 'local',
	},
	// 4. Code Generation Agent
	{
		id: 'code-generation', name: 'Code Generation Agent', category: 'code-generation', framework: 'langgraph',
		description: 'Iterative code-writing agent — generates, reviews, and tests code based on specifications.',
		agents: [
			{ role: 'planner', goal: 'Break specification into implementation tasks', backstory: 'Senior engineer and architect', tools: [] },
			{ role: 'coder', goal: 'Write clean, tested code', backstory: 'Expert software developer', tools: ['file_write', 'run_tests'] },
			{ role: 'reviewer', goal: 'Review code for quality, security, and correctness', backstory: 'Code quality specialist', tools: ['file_read'] },
		],
		mcpServers: [
			{ name: 'github', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], requiredEnv: ['GITHUB_TOKEN'], category: 'dev-tools' },
		],
		requiredFields: [
			{ name: 'language', label: 'Programming Language', fieldType: 'select', options: ['python', 'typescript', 'javascript', 'go', 'rust'], required: true },
		],
		optionalFields: [
			{ name: 'test_framework', label: 'Test Framework', description: 'e.g. pytest, jest, go test' },
			{ name: 'style_guide', label: 'Style Guide URL', description: 'Link to your code style guide' },
		],
		estimatedCost: '$40-120/month', tags: ['code', 'langgraph', 'github', 'development'], deploymentDefault: 'local',
	},
	// 5. Multi-Agent Team
	{
		id: 'multi-agent-team', name: 'Multi-Agent Team', category: 'multi-agent', framework: 'autogen',
		description: 'Collaborative agent group chat — coordinator, workers, and critic iterate together.',
		agents: [
			{ role: 'coordinator', goal: 'Manage group conversation and task delegation', backstory: 'Experienced project manager', tools: [] },
			{ role: 'worker', goal: 'Execute primary tasks assigned by coordinator', backstory: 'Versatile specialist', tools: [] },
			{ role: 'critic', goal: 'Review outputs and suggest improvements', backstory: 'Quality assurance expert', tools: [] },
		],
		mcpServers: [],
		requiredFields: [
			{ name: 'team_goal', label: 'Team Goal', required: true, description: 'What should this agent team accomplish?' },
		],
		optionalFields: [
			{ name: 'max_rounds', label: 'Max Conversation Rounds', fieldType: 'number' },
			{ name: 'human_in_loop', label: 'Human-in-the-loop', fieldType: 'select', options: ['true', 'false'] },
		],
		estimatedCost: '$30-100/month', tags: ['multi-agent', 'autogen', 'collaboration', 'team'], deploymentDefault: 'local',
	},
	// 6. Sales & Lead Generation Agent
	{
		id: 'sales-lead-gen', name: 'Sales & Lead Generation Agent', category: 'sales', framework: 'langgraph',
		description: 'AI-powered lead prospecting — monitors domains, generates personalized outreach, and tracks pipeline.',
		agents: [
			{ role: 'prospector', goal: 'Discover and qualify new leads from web sources', backstory: 'Expert at finding high-intent prospects', tools: ['web_search', 'domain_lookup'] },
			{ role: 'outreach_writer', goal: 'Generate personalized email and proposal copy', backstory: 'Skilled copywriter who personalizes at scale', tools: ['email_draft'] },
			{ role: 'pipeline_tracker', goal: 'Track lead status and follow-up schedules', backstory: 'CRM specialist who never lets a lead slip', tools: ['crm_update'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'target_industry', label: 'Target Industry', required: true, description: 'Industry vertical to prospect (e.g. SaaS, e-commerce, agencies)' },
			{ name: 'outreach_channel', label: 'Outreach Channel', fieldType: 'select', options: ['email', 'linkedin', 'both'], required: true },
		],
		optionalFields: [
			{ name: 'crm_integration', label: 'CRM Integration', fieldType: 'select', options: ['hubspot', 'pipedrive', 'salesforce', 'none'] },
			{ name: 'daily_lead_target', label: 'Daily Lead Target', fieldType: 'number' },
		],
		estimatedCost: '$40-100/month', tags: ['sales', 'lead-gen', 'outreach', 'prospecting', 'marketing', 'crm'], deploymentDefault: 'cloud',
	},
	// 7. Content Repurposer Agent
	{
		id: 'content-repurposer', name: 'Content Repurposer Agent', category: 'content', framework: 'crewai',
		description: 'Transforms long-form content into multi-platform assets — podcasts to TikToks, blogs to newsletters.',
		agents: [
			{ role: 'ingester', goal: 'Transcribe and parse source content into structured segments', backstory: 'Expert at identifying key themes and quotable moments', tools: ['transcribe', 'summarize'] },
			{ role: 'adapter', goal: 'Reformat content for each target platform', backstory: 'Multi-platform content strategist', tools: ['format_post', 'generate_image_prompt'] },
			{ role: 'scheduler', goal: 'Create a publishing calendar and queue assets', backstory: 'Social media scheduling expert', tools: ['schedule_post'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'source_type', label: 'Source Content Type', fieldType: 'select', options: ['podcast', 'blog', 'video', 'webinar', 'newsletter'], required: true },
			{ name: 'target_platforms', label: 'Target Platforms', fieldType: 'multiselect', options: ['tiktok', 'instagram', 'linkedin', 'twitter', 'newsletter', 'youtube-shorts'], required: true },
		],
		optionalFields: [
			{ name: 'brand_voice', label: 'Brand Voice Guide', description: 'Describe your brand tone (e.g. professional, casual, witty)' },
			{ name: 'posting_frequency', label: 'Posts Per Week', fieldType: 'number' },
		],
		estimatedCost: '$30-80/month', tags: ['content', 'repurpose', 'creator', 'social-media', 'podcast', 'video'], deploymentDefault: 'cloud',
	},
	// 8. E-commerce Review Analyzer
	{
		id: 'ecommerce-analyzer', name: 'E-commerce Review Analyzer', category: 'ecommerce', framework: 'langgraph',
		description: 'Scrapes and analyzes product reviews across platforms — sentiment, trends, SWOT, and competitive insights.',
		agents: [
			{ role: 'scraper', goal: 'Collect reviews from target platforms', backstory: 'Data collection specialist', tools: ['web_search', 'scrape'] },
			{ role: 'analyst', goal: 'Run sentiment analysis and identify recurring themes', backstory: 'Consumer insights analyst', tools: ['analyze_sentiment'] },
			{ role: 'reporter', goal: 'Generate actionable reports with SWOT and recommendations', backstory: 'E-commerce strategist', tools: [] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'product_url', label: 'Product URL or ASIN', required: true, description: 'URL or identifier of the product to analyze' },
			{ name: 'platforms', label: 'Review Platforms', fieldType: 'multiselect', options: ['amazon', 'shopify', 'trustpilot', 'google', 'yelp'], required: true },
		],
		optionalFields: [
			{ name: 'competitor_urls', label: 'Competitor URLs', description: 'Comma-separated competitor product URLs for comparison' },
			{ name: 'report_frequency', label: 'Report Frequency', fieldType: 'select', options: ['daily', 'weekly', 'monthly'] },
		],
		estimatedCost: '$25-70/month', tags: ['e-commerce', 'reviews', 'sentiment', 'analytics', 'amazon', 'shopify'], deploymentDefault: 'cloud',
	},
	// 9. Operations & SOP Generator
	{
		id: 'operations-sop', name: 'Operations & SOP Generator', category: 'operations', framework: 'langgraph',
		description: 'Auto-generates and maintains SOPs from workflows — tracks expenses, optimizes subscriptions, documents processes.',
		agents: [
			{ role: 'observer', goal: 'Capture and document workflow steps from screen recordings or API logs', backstory: 'Process documentation specialist', tools: ['capture_workflow'] },
			{ role: 'optimizer', goal: 'Analyze expenses, subscriptions, and identify cost-saving opportunities', backstory: 'Operations efficiency expert', tools: ['analyze_expenses'] },
			{ role: 'documenter', goal: 'Generate formatted SOPs with step-by-step instructions', backstory: 'Technical writer who creates clear documentation', tools: ['generate_doc'] },
		],
		mcpServers: [
			{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/sop-workspace'], requiredEnv: [], category: 'tools' },
		],
		requiredFields: [
			{ name: 'department', label: 'Department', fieldType: 'select', options: ['engineering', 'marketing', 'sales', 'support', 'operations', 'finance'], required: true },
			{ name: 'process_name', label: 'Process Name', required: true, description: 'Name of the workflow or process to document' },
		],
		optionalFields: [
			{ name: 'accounting_integration', label: 'Accounting Integration', fieldType: 'select', options: ['quickbooks', 'xero', 'freshbooks', 'none'] },
			{ name: 'output_format', label: 'Output Format', fieldType: 'select', options: ['markdown', 'pdf', 'notion', 'confluence'] },
		],
		estimatedCost: '$20-60/month', tags: ['operations', 'sop', 'process', 'documentation', 'expense', 'optimization'], deploymentDefault: 'local',
	},
	// 10. Healthcare Practice Manager
	{
		id: 'healthcare-practice', name: 'Healthcare Practice Manager', category: 'healthcare', framework: 'crewai',
		description: 'HIPAA-aware practice assistant — scheduling, session notes, billing integration for solo practitioners.',
		agents: [
			{ role: 'scheduler', goal: 'Manage appointments, reminders, and availability', backstory: 'Healthcare scheduling coordinator', tools: ['calendar_manage'] },
			{ role: 'note_taker', goal: 'Generate structured session notes from practitioner input', backstory: 'Clinical documentation specialist', tools: ['generate_notes'] },
			{ role: 'billing_assistant', goal: 'Track billing, generate invoices, and manage insurance claims', backstory: 'Medical billing expert', tools: ['billing_process'] },
		],
		mcpServers: [],
		requiredFields: [
			{ name: 'practice_type', label: 'Practice Type', fieldType: 'select', options: ['therapy', 'counseling', 'psychiatry', 'physical-therapy', 'general-practice', 'dental'], required: true },
			{ name: 'billing_method', label: 'Billing Method', fieldType: 'select', options: ['stripe', 'square', 'insurance', 'manual'], required: true },
		],
		optionalFields: [
			{ name: 'ehr_integration', label: 'EHR Integration', fieldType: 'select', options: ['simple-practice', 'theranest', 'jane-app', 'none'] },
			{ name: 'hipaa_mode', label: 'HIPAA Strict Mode', fieldType: 'select', options: ['true', 'false'], description: 'Enable strict data handling and encryption' },
		],
		estimatedCost: '$40-100/month', tags: ['healthcare', 'hipaa', 'therapy', 'practice-management', 'billing', 'scheduling'], deploymentDefault: 'cloud',
	},
	// 11. Real Estate Marketing Agent
	{
		id: 'real-estate-marketing', name: 'Real Estate Marketing Agent', category: 'real-estate', framework: 'crewai',
		description: 'Generates complete listing marketing kits — social posts, property websites, virtual tour scripts, and QR materials.',
		agents: [
			{ role: 'listing_analyst', goal: 'Parse property details and identify key selling points', backstory: 'Real estate market analyst', tools: ['analyze_listing'] },
			{ role: 'content_creator', goal: 'Generate marketing copy, social posts, and video scripts', backstory: 'Real estate marketing copywriter', tools: ['generate_copy', 'generate_image_prompt'] },
			{ role: 'campaign_builder', goal: 'Assemble multi-channel marketing campaigns', backstory: 'Digital marketing strategist for real estate', tools: ['build_campaign'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'listing_address', label: 'Property Address', required: true, description: 'Full address of the listing' },
			{ name: 'listing_price', label: 'Listing Price', required: true, description: 'Asking price for the property' },
			{ name: 'property_type', label: 'Property Type', fieldType: 'select', options: ['single-family', 'condo', 'townhouse', 'multi-family', 'commercial', 'land'], required: true },
		],
		optionalFields: [
			{ name: 'mls_id', label: 'MLS ID', description: 'MLS listing identifier for data enrichment' },
			{ name: 'target_platforms', label: 'Marketing Platforms', fieldType: 'multiselect', options: ['instagram', 'facebook', 'zillow', 'realtor.com', 'tiktok'] },
		],
		estimatedCost: '$30-80/month', tags: ['real-estate', 'marketing', 'listings', 'social-media', 'property'], deploymentDefault: 'cloud',
	},
	// 12. Education Content Builder
	{
		id: 'education-builder', name: 'Education Content Builder', category: 'education', framework: 'langgraph',
		description: 'Creates interactive learning experiences — quizzes, lesson plans, video walkthroughs, and progress tracking.',
		agents: [
			{ role: 'curriculum_designer', goal: 'Structure learning objectives and lesson sequences', backstory: 'Instructional design specialist', tools: ['design_curriculum'] },
			{ role: 'content_generator', goal: 'Create lessons, quizzes, and interactive exercises', backstory: 'Educational content creator', tools: ['generate_lesson', 'generate_quiz'] },
			{ role: 'assessment_builder', goal: 'Design assessments and track learner progress', backstory: 'Education assessment expert', tools: ['build_assessment'] },
		],
		mcpServers: [
			{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/edu-workspace'], requiredEnv: [], category: 'tools' },
		],
		requiredFields: [
			{ name: 'subject', label: 'Subject Area', required: true, description: 'Subject to create content for (e.g. Mathematics, History, Programming)' },
			{ name: 'grade_level', label: 'Grade / Skill Level', fieldType: 'select', options: ['elementary', 'middle-school', 'high-school', 'college', 'professional', 'self-paced'], required: true },
		],
		optionalFields: [
			{ name: 'lesson_count', label: 'Number of Lessons', fieldType: 'number' },
			{ name: 'include_video', label: 'Include Video Scripts', fieldType: 'select', options: ['true', 'false'], description: 'Generate video walkthrough scripts' },
			{ name: 'lms_integration', label: 'LMS Integration', fieldType: 'select', options: ['canvas', 'moodle', 'google-classroom', 'none'] },
		],
		estimatedCost: '$25-70/month', tags: ['education', 'learning', 'curriculum', 'quizzes', 'interactive', 'edtech'], deploymentDefault: 'local',
	},
	// 13. STEM Lab Simulator
	{
		id: 'stem-lab-simulator', name: 'STEM Lab Simulator', category: 'education', framework: 'langgraph',
		description: 'Virtual lab environment — physics, chemistry, and biology experiment simulations with adaptive problem-solving walkthroughs.',
		agents: [
			{ role: 'experiment_designer', goal: 'Design virtual experiments with realistic parameters and safety constraints', backstory: 'PhD-level science educator who builds engaging lab experiences', tools: ['design_experiment'] },
			{ role: 'simulation_engine', goal: 'Run step-by-step simulations and calculate outcomes', backstory: 'Computational scientist specializing in physics and chemistry models', tools: ['run_simulation', 'calculate'] },
			{ role: 'tutor', goal: 'Provide hints, explain results, and adapt difficulty based on student performance', backstory: 'Adaptive learning specialist who meets students at their level', tools: ['assess_understanding', 'generate_hint'] },
		],
		mcpServers: [
			{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/stem-lab'], requiredEnv: [], category: 'tools' },
		],
		requiredFields: [
			{ name: 'subject', label: 'STEM Subject', fieldType: 'select', options: ['physics', 'chemistry', 'biology', 'earth-science', 'environmental-science'], required: true },
			{ name: 'level', label: 'Education Level', fieldType: 'select', options: ['middle-school', 'high-school', 'ap-level', 'college-intro', 'college-advanced'], required: true },
		],
		optionalFields: [
			{ name: 'lab_safety_mode', label: 'Lab Safety Prompts', fieldType: 'select', options: ['true', 'false'], description: 'Include safety reminders and proper procedure guidance' },
			{ name: 'difficulty_adaptation', label: 'Adaptive Difficulty', fieldType: 'select', options: ['true', 'false'], description: 'Automatically adjust problem difficulty based on student responses' },
			{ name: 'max_experiments', label: 'Max Experiments Per Session', fieldType: 'number' },
		],
		estimatedCost: '$20-50/month', tags: ['stem', 'education', 'lab', 'simulation', 'physics', 'chemistry', 'biology', 'adaptive-learning'], deploymentDefault: 'local',
	},
	// 14. STEM Coding Tutor
	{
		id: 'stem-coding-tutor', name: 'STEM Coding Tutor', category: 'education', framework: 'crewai',
		description: 'Interactive coding instructor — real-time feedback, auto-grading, project scaffolding for CS, robotics, and data science.',
		agents: [
			{ role: 'instructor', goal: 'Deliver structured coding lessons with clear explanations and examples', backstory: 'Senior CS educator with 15 years teaching experience', tools: ['generate_lesson', 'create_example'] },
			{ role: 'code_reviewer', goal: 'Review student code in real-time, provide hints without giving answers', backstory: 'Code review expert who teaches through guided discovery', tools: ['analyze_code', 'run_tests'] },
			{ role: 'project_coach', goal: 'Scaffold hands-on projects and track milestone completion', backstory: 'Project-based learning specialist', tools: ['scaffold_project', 'track_progress'] },
		],
		mcpServers: [
			{ name: 'github', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'], requiredEnv: ['GITHUB_TOKEN'], category: 'dev-tools' },
		],
		requiredFields: [
			{ name: 'language', label: 'Programming Language', fieldType: 'select', options: ['python', 'javascript', 'scratch', 'java', 'c++', 'r', 'matlab'], required: true },
			{ name: 'track', label: 'Learning Track', fieldType: 'select', options: ['intro-cs', 'data-science', 'web-dev', 'robotics', 'machine-learning', 'algorithms', 'cybersecurity'], required: true },
		],
		optionalFields: [
			{ name: 'skill_level', label: 'Starting Skill Level', fieldType: 'select', options: ['beginner', 'intermediate', 'advanced'] },
			{ name: 'auto_grade', label: 'Auto-Grading', fieldType: 'select', options: ['true', 'false'], description: 'Automatically grade exercises with test cases' },
			{ name: 'project_count', label: 'Number of Projects', fieldType: 'number' },
		],
		estimatedCost: '$25-60/month', tags: ['stem', 'coding', 'tutor', 'cs-education', 'auto-grading', 'robotics', 'data-science'], deploymentDefault: 'local',
	},
	// 15. Grant Writing Assistant
	{
		id: 'grant-writing-assistant', name: 'Grant Writing Assistant', category: 'research', framework: 'langgraph',
		description: 'Multi-agent grant proposal pipeline — drafts narratives, builds budgets, checks compliance for NSF/NIH/DOD/EU formats.',
		agents: [
			{ role: 'narrative_writer', goal: 'Draft compelling research narratives, specific aims, and impact statements', backstory: 'Former program officer who has reviewed 1000+ proposals', tools: ['web_search', 'draft_section'] },
			{ role: 'budget_builder', goal: 'Build detailed budgets with justifications matching funder requirements', backstory: 'Research administrator and budget specialist', tools: ['calculate_budget', 'generate_justification'] },
			{ role: 'compliance_checker', goal: 'Verify proposal meets all funder guidelines, page limits, and formatting rules', backstory: 'Grants compliance officer with deep knowledge of federal requirements', tools: ['check_compliance', 'validate_format'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
			{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/grant-workspace'], requiredEnv: [], category: 'tools' },
		],
		requiredFields: [
			{ name: 'funding_agency', label: 'Funding Agency', fieldType: 'select', options: ['nsf', 'nih', 'dod', 'doe', 'darpa', 'eu-horizon', 'private-foundation', 'other'], required: true },
			{ name: 'research_area', label: 'Research Area', required: true, description: 'Primary research domain (e.g. computational biology, materials science)' },
		],
		optionalFields: [
			{ name: 'budget_ceiling', label: 'Budget Ceiling ($)', fieldType: 'number', description: 'Maximum total budget for the proposal' },
			{ name: 'duration_years', label: 'Project Duration (years)', fieldType: 'number' },
			{ name: 'include_biosketch', label: 'Generate Biosketch Template', fieldType: 'select', options: ['true', 'false'] },
		],
		estimatedCost: '$30-80/month', tags: ['research', 'grant-writing', 'nsf', 'nih', 'proposals', 'academic', 'funding'], deploymentDefault: 'local',
	},
	// 16. Systematic Literature Review
	{
		id: 'systematic-lit-review', name: 'Systematic Literature Review', category: 'research', framework: 'langgraph',
		description: 'Automated systematic review pipeline — paper discovery, screening, data extraction, PRISMA flow, and bias assessment.',
		agents: [
			{ role: 'searcher', goal: 'Execute comprehensive searches across academic databases and generate keyword strategies', backstory: 'Information scientist and systematic review methodologist', tools: ['web_search', 'search_pubmed', 'search_arxiv'] },
			{ role: 'screener', goal: 'Apply inclusion/exclusion criteria and screen abstracts and full texts', backstory: 'Research assistant trained in systematic review protocols', tools: ['screen_paper', 'extract_metadata'] },
			{ role: 'synthesizer', goal: 'Extract data, assess bias, generate PRISMA diagrams and summary tables', backstory: 'Meta-analysis expert who synthesizes evidence across studies', tools: ['extract_data', 'assess_bias', 'generate_prisma'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'research_question', label: 'Research Question', required: true, description: 'The primary research question using PICO/PECO format' },
			{ name: 'databases', label: 'Databases to Search', fieldType: 'multiselect', options: ['pubmed', 'arxiv', 'scopus', 'web-of-science', 'cochrane', 'ieee', 'google-scholar'], required: true },
		],
		optionalFields: [
			{ name: 'date_range', label: 'Publication Date Range', description: 'e.g. 2020-2026' },
			{ name: 'max_papers', label: 'Max Papers to Screen', fieldType: 'number' },
			{ name: 'review_type', label: 'Review Type', fieldType: 'select', options: ['systematic-review', 'scoping-review', 'meta-analysis', 'rapid-review'] },
		],
		estimatedCost: '$30-90/month', tags: ['research', 'literature-review', 'systematic-review', 'prisma', 'meta-analysis', 'academic'], deploymentDefault: 'local',
	},
	// 17. Portfolio Risk Analyzer
	{
		id: 'portfolio-risk-analyzer', name: 'Portfolio Risk Analyzer', category: 'finance', framework: 'langgraph',
		description: 'Real-time portfolio monitoring — VaR calculations, sector exposure analysis, stress testing, and rebalancing recommendations.',
		agents: [
			{ role: 'market_monitor', goal: 'Track real-time market data, news, and macro indicators', backstory: 'Quantitative analyst with expertise in market microstructure', tools: ['fetch_market_data', 'web_search'] },
			{ role: 'risk_analyst', goal: 'Calculate VaR, stress tests, correlation matrices, and drawdown scenarios', backstory: 'Risk management specialist with CFA expertise', tools: ['calculate_var', 'stress_test', 'correlation_analysis'] },
			{ role: 'advisor', goal: 'Generate rebalancing recommendations and portfolio health reports', backstory: 'Senior portfolio strategist who communicates complex risk in plain language', tools: ['generate_report', 'recommend_rebalance'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'portfolio_type', label: 'Portfolio Type', fieldType: 'select', options: ['equity', 'fixed-income', 'crypto', 'mixed', 'etf-only', 'options'], required: true },
			{ name: 'risk_tolerance', label: 'Risk Tolerance', fieldType: 'select', options: ['conservative', 'moderate', 'aggressive'], required: true },
		],
		optionalFields: [
			{ name: 'benchmark', label: 'Benchmark Index', fieldType: 'select', options: ['sp500', 'nasdaq', 'dow', 'russell2000', 'msci-world', 'custom'] },
			{ name: 'market_data_source', label: 'Market Data API', fieldType: 'select', options: ['yahoo-finance', 'alpha-vantage', 'polygon', 'twelve-data'] },
			{ name: 'report_frequency', label: 'Report Frequency', fieldType: 'select', options: ['real-time', 'daily', 'weekly', 'monthly'] },
		],
		estimatedCost: '$50-150/month', tags: ['finance', 'portfolio', 'risk', 'var', 'trading', 'investing', 'quantitative'], deploymentDefault: 'cloud',
	},
	// 18. Compliance & Fraud Detection
	{
		id: 'compliance-fraud-detection', name: 'Compliance & Fraud Detection', category: 'finance', framework: 'crewai',
		description: 'Financial compliance automation — transaction monitoring, AML/KYC screening, anomaly detection, and regulatory report generation.',
		agents: [
			{ role: 'transaction_monitor', goal: 'Screen transactions for suspicious patterns and threshold violations', backstory: 'Anti-money laundering analyst with banking compliance expertise', tools: ['scan_transactions', 'flag_anomaly'] },
			{ role: 'kyc_screener', goal: 'Verify customer identities against watchlists and sanctions databases', backstory: 'KYC/AML compliance officer', tools: ['screen_entity', 'check_sanctions'] },
			{ role: 'report_generator', goal: 'Generate SARs, CTRs, and regulatory compliance reports', backstory: 'Regulatory reporting specialist for FinCEN and SEC', tools: ['generate_sar', 'generate_report'] },
		],
		mcpServers: [
			{ name: 'postgres', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'], requiredEnv: ['DATABASE_URL'], category: 'data' },
		],
		requiredFields: [
			{ name: 'regulation_framework', label: 'Regulatory Framework', fieldType: 'multiselect', options: ['aml-bsa', 'kyc', 'sox', 'gdpr', 'pci-dss', 'dodd-frank', 'mifid-ii'], required: true },
			{ name: 'institution_type', label: 'Institution Type', fieldType: 'select', options: ['bank', 'credit-union', 'fintech', 'broker-dealer', 'insurance', 'crypto-exchange'], required: true },
		],
		optionalFields: [
			{ name: 'alert_threshold', label: 'Alert Threshold ($)', fieldType: 'number', description: 'Transaction amount threshold for automatic flagging' },
			{ name: 'sanctions_lists', label: 'Sanctions Lists', fieldType: 'multiselect', options: ['ofac-sdn', 'un-sanctions', 'eu-sanctions', 'pep-lists'] },
		],
		estimatedCost: '$60-200/month', tags: ['finance', 'compliance', 'fraud', 'aml', 'kyc', 'regulatory', 'fintech'], deploymentDefault: 'cloud',
	},
	// 19. Mission Planning & Threat Intel
	{
		id: 'mission-planning-intel', name: 'Mission Planning & Threat Intel', category: 'intelligence', framework: 'langgraph',
		description: 'OSINT-driven intelligence agent — threat assessment briefs, logistics planning, COA analysis, and after-action report generation.',
		agents: [
			{ role: 'osint_collector', goal: 'Gather and correlate open-source intelligence from multiple feeds', backstory: 'Intelligence analyst specializing in OSINT collection and fusion', tools: ['web_search', 'scrape', 'monitor_feeds'] },
			{ role: 'threat_assessor', goal: 'Analyze threats, generate risk matrices, and produce threat assessment briefs', backstory: 'Threat intelligence expert with DoD analytical framework experience', tools: ['assess_threat', 'generate_risk_matrix'] },
			{ role: 'mission_planner', goal: 'Develop courses of action, logistics plans, and after-action reports', backstory: 'Military operations planner experienced in MDMP and JOPG processes', tools: ['plan_coa', 'logistics_calc', 'generate_aar'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
			{ name: 'filesystem', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp/mission-workspace'], requiredEnv: [], category: 'tools' },
		],
		requiredFields: [
			{ name: 'domain', label: 'Operations Domain', fieldType: 'select', options: ['land', 'maritime', 'air', 'cyber', 'space', 'multi-domain'], required: true },
			{ name: 'classification_level', label: 'Classification Level', fieldType: 'select', options: ['unclassified', 'cui', 'fouo'], required: true, description: 'Only unclassified data processing — no classified material' },
		],
		optionalFields: [
			{ name: 'osint_sources', label: 'OSINT Sources', fieldType: 'multiselect', options: ['news-feeds', 'social-media', 'satellite-imagery', 'maritime-ais', 'flight-tracking', 'government-reports'] },
			{ name: 'output_format', label: 'Output Format', fieldType: 'select', options: ['nato-stanag', 'joint-pub', 'custom-brief', 'markdown'] },
			{ name: 'aor', label: 'Area of Responsibility', description: 'Geographic region or area of interest' },
		],
		estimatedCost: '$40-120/month', tags: ['military', 'defense', 'osint', 'threat-intel', 'mission-planning', 'logistics', 'c2'], deploymentDefault: 'local',
	},
	// 20. Clinical Decision Support
	{
		id: 'clinical-decision-support', name: 'Clinical Decision Support', category: 'clinical', framework: 'crewai',
		description: 'Evidence-based clinical assistant — differential diagnosis, lab interpretation, drug interaction checks, and clinical note summarization.',
		agents: [
			{ role: 'diagnostician', goal: 'Generate differential diagnoses ranked by probability based on symptoms and history', backstory: 'Board-certified internist with diagnostic reasoning expertise', tools: ['differential_dx', 'web_search'] },
			{ role: 'pharmacist', goal: 'Check drug interactions, contraindications, and dosing recommendations', backstory: 'Clinical pharmacist specializing in polypharmacy and drug safety', tools: ['check_interactions', 'lookup_drug'] },
			{ role: 'note_summarizer', goal: 'Summarize clinical notes, lab results, and generate structured reports', backstory: 'Medical scribe and clinical documentation improvement specialist', tools: ['summarize_note', 'interpret_labs'] },
		],
		mcpServers: [
			{ name: 'web-search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'], requiredEnv: ['BRAVE_API_KEY'], category: 'search' },
		],
		requiredFields: [
			{ name: 'specialty', label: 'Medical Specialty', fieldType: 'select', options: ['internal-medicine', 'emergency', 'pediatrics', 'cardiology', 'oncology', 'neurology', 'psychiatry', 'radiology', 'general-surgery'], required: true },
			{ name: 'ehr_system', label: 'EHR System', fieldType: 'select', options: ['epic', 'cerner', 'allscripts', 'meditech', 'athenahealth', 'standalone'], required: true },
		],
		optionalFields: [
			{ name: 'formulary', label: 'Drug Formulary', fieldType: 'select', options: ['cms-medicare', 'va-national', 'tricare', 'custom', 'none'] },
			{ name: 'evidence_sources', label: 'Evidence Sources', fieldType: 'multiselect', options: ['uptodate', 'pubmed', 'cochrane', 'dynamed', 'epocrates'] },
			{ name: 'hipaa_strict', label: 'HIPAA Strict Mode', fieldType: 'select', options: ['true', 'false'], description: 'Enable strict PHI handling and audit logging' },
		],
		estimatedCost: '$50-150/month', tags: ['medical', 'clinical', 'diagnosis', 'drug-interactions', 'ehr', 'hipaa', 'decision-support'], deploymentDefault: 'cloud',
	},
];

export default TEMPLATES;

/** Return all 20 templates */
export function listTemplates(): AgentTemplate[] {
	return TEMPLATES;
}

/** Look up a template by its id */
export function getTemplate(id: string): AgentTemplate | undefined {
	return TEMPLATES.find((t) => t.id === id);
}

/** Filter templates by category */
export function getTemplatesByCategory(category: string): AgentTemplate[] {
	return TEMPLATES.filter((t) => t.category === category);
}

/** Filter templates by framework (langgraph | crewai | autogen) */
export function getTemplatesByFramework(framework: string): AgentTemplate[] {
	return TEMPLATES.filter((t) => t.framework === framework);
}

/** All unique categories present in the registry */
export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))];


