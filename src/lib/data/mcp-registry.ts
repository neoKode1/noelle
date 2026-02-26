/**
 * MCP Server Registry — ported from +12 Monkeys mcp_registry.py
 * Static catalogue of all supported MCP servers. Zero runtime deps.
 */
import type { MCPServerEntry, MCPCategory } from '$lib/types/mcp';

const SERVERS: MCPServerEntry[] = [
	// ── Data & Databases ───────────────────────────────────────────────────
	{
		id: 'postgres', name: 'PostgreSQL',
		description: 'Query PostgreSQL databases — read schemas, run SQL, explore tables.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-postgres'],
		requiredEnv: ['DATABASE_URL'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-postgres',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
		icon: '🐘', tags: ['sql', 'database', 'relational'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'mongodb', name: 'MongoDB',
		description: 'Interact with MongoDB — list collections, query documents, aggregate.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-mongodb'],
		requiredEnv: ['MONGODB_URI'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-mongodb',
		icon: '🍃', tags: ['nosql', 'database', 'documents'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'sqlite', name: 'SQLite',
		description: 'Read and query local SQLite databases.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sqlite'],
		requiredEnv: ['SQLITE_PATH'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-sqlite',
		icon: '📦', tags: ['sql', 'database', 'local', 'embedded'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'google-drive', name: 'Google Drive',
		description: 'Search, list, and read files from Google Drive.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-gdrive'],
		requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-gdrive',
		icon: '📁', tags: ['files', 'cloud', 'google'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'fetch', name: 'Fetch',
		description: 'Fetch web pages and convert HTML to markdown for LLM-friendly consumption.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-fetch',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
		icon: '🌐', tags: ['web', 'http', 'scraping', 'markdown'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'time', name: 'Time',
		description: 'Get current time and perform timezone conversions across IANA timezones.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-time'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-time',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
		icon: '🕐', tags: ['time', 'timezone', 'datetime', 'clock'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'mysql', name: 'MySQL',
		description: 'Query MySQL databases — read schemas, run SQL, explore tables and views.',
		category: 'data', command: 'npx', args: ['-y', '@benborla29/mcp-server-mysql'],
		requiredEnv: ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'], optionalEnv: [],
		npmPackage: '@benborla29/mcp-server-mysql',
		documentationUrl: 'https://github.com/benborla/mcp-server-mysql',
		icon: '🐬', tags: ['sql', 'database', 'relational', 'mysql'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'redis', name: 'Redis',
		description: 'Interact with Redis — get/set keys, manage data structures, pub/sub.',
		category: 'data', command: 'npx', args: ['-y', '@modelcontextprotocol/server-redis'],
		requiredEnv: ['REDIS_URL'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-redis',
		icon: '🔴', tags: ['cache', 'key-value', 'database', 'redis'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'supabase', name: 'Supabase',
		description: 'Manage Supabase projects — query databases, manage auth, storage, and edge functions.',
		category: 'data', command: 'npx', args: ['-y', 'supabase-mcp-server'],
		requiredEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], optionalEnv: [],
		npmPackage: 'supabase-mcp-server',
		documentationUrl: 'https://github.com/supabase/mcp-server-supabase',
		icon: '⚡', tags: ['database', 'auth', 'storage', 'backend-as-a-service'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'snowflake', name: 'Snowflake',
		description: 'Query Snowflake data warehouse — run SQL, explore schemas, manage warehouses.',
		category: 'data', command: 'npx', args: ['-y', '@snowflake/mcp-server'],
		requiredEnv: ['SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_USER', 'SNOWFLAKE_PASSWORD'],
		optionalEnv: ['SNOWFLAKE_WAREHOUSE', 'SNOWFLAKE_DATABASE', 'SNOWFLAKE_SCHEMA'],
		npmPackage: '@snowflake/mcp-server',
		icon: '❄️', tags: ['data-warehouse', 'sql', 'analytics', 'cloud'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'pinecone', name: 'Pinecone',
		description: 'Manage Pinecone vector database — upsert, query, and delete vector embeddings.',
		category: 'data', command: 'npx', args: ['-y', '@pinecone-database/mcp-server'],
		requiredEnv: ['PINECONE_API_KEY'], optionalEnv: ['PINECONE_INDEX_NAME'],
		npmPackage: '@pinecone-database/mcp-server',
		icon: '🌲', tags: ['vector-database', 'embeddings', 'rag', 'similarity-search'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'neo4j', name: 'Neo4j',
		description: 'Query Neo4j graph database — run Cypher queries, explore nodes and relationships.',
		category: 'data', command: 'npx', args: ['-y', '@neo4j/mcp-server'],
		requiredEnv: ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'], optionalEnv: [],
		npmPackage: '@neo4j/mcp-server',
		icon: '🔵', tags: ['graph-database', 'cypher', 'knowledge-graph', 'relationships'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'salesforce', name: 'Salesforce',
		description: 'Query, create, and update Salesforce objects — leads, contacts, opportunities.',
		category: 'data', command: 'npx', args: ['-y', '@salesforce/mcp-server'],
		requiredEnv: ['SALESFORCE_INSTANCE_URL', 'SALESFORCE_ACCESS_TOKEN'], optionalEnv: [],
		npmPackage: '@salesforce/mcp-server',
		icon: '☁️', tags: ['crm', 'sales', 'enterprise'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'home-assistant', name: 'Home Assistant',
		description: 'Control smart home devices — lights, switches, sensors, automations, and scenes via Home Assistant.',
		category: 'data', command: 'npx', args: ['-y', 'homeassistant-mcp-server'],
		requiredEnv: ['HASS_URL', 'HASS_TOKEN'], optionalEnv: [],
		npmPackage: 'homeassistant-mcp-server',
		icon: '🏠', tags: ['iot', 'smart-home', 'automation', 'home-assistant', 'devices'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'spotify', name: 'Spotify',
		description: 'Control Spotify playback — search tracks, manage playlists, play/pause, and get recommendations.',
		category: 'data', command: 'npx', args: ['-y', 'spotify-mcp-server'],
		requiredEnv: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN'], optionalEnv: [],
		npmPackage: 'spotify-mcp-server',
		icon: '🎵', tags: ['music', 'audio', 'playback', 'spotify', 'media'], status: 'unknown', tools: [], isOfficial: false,
	},

	// ── Communication ──────────────────────────────────────────────────────
	{
		id: 'slack', name: 'Slack',
		description: 'Send messages, list channels, search conversations in Slack workspaces.',
		category: 'communication', command: 'npx', args: ['-y', '@modelcontextprotocol/server-slack'],
		requiredEnv: ['SLACK_BOT_TOKEN'], optionalEnv: ['SLACK_SIGNING_SECRET'],
		npmPackage: '@modelcontextprotocol/server-slack',
		icon: '💬', tags: ['chat', 'messaging', 'team'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'email', name: 'Email (SMTP/IMAP)',
		description: 'Send and read emails via SMTP and IMAP protocols.',
		category: 'communication', command: 'npx', args: ['-y', '@email/mcp-server'],
		requiredEnv: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'IMAP_HOST'], optionalEnv: [],
		npmPackage: '@email/mcp-server',
		icon: '📧', tags: ['email', 'smtp', 'imap'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'discord', name: 'Discord',
		description: 'Interact with Discord — send messages, manage channels, list guilds.',
		category: 'communication', command: 'npx', args: ['-y', '@discord/mcp-server'],
		requiredEnv: ['DISCORD_BOT_TOKEN'], optionalEnv: [],
		npmPackage: '@discord/mcp-server',
		icon: '🎮', tags: ['chat', 'gaming', 'community'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'twilio', name: 'Twilio',
		description: 'Send SMS/MMS, make calls, manage phone numbers via Twilio APIs.',
		category: 'communication', command: 'npx', args: ['-y', '@twilio/mcp-server'],
		requiredEnv: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], optionalEnv: ['TWILIO_PHONE_NUMBER'],
		npmPackage: '@twilio/mcp-server',
		icon: '📱', tags: ['sms', 'voice', 'phone', 'messaging'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'telegram', name: 'Telegram',
		description: 'Send messages, manage bots, and interact with Telegram chats and channels.',
		category: 'communication', command: 'npx', args: ['-y', 'telegram-mcp-server'],
		requiredEnv: ['TELEGRAM_BOT_TOKEN'], optionalEnv: [],
		npmPackage: 'telegram-mcp-server',
		icon: '✈️', tags: ['chat', 'bot', 'messaging', 'telegram'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'twitter', name: 'Twitter / X',
		description: 'Post tweets, search timelines, manage follows and lists on Twitter/X.',
		category: 'communication', command: 'npx', args: ['-y', 'twitter-mcp-server'],
		requiredEnv: ['TWITTER_API_KEY', 'TWITTER_API_SECRET', 'TWITTER_ACCESS_TOKEN', 'TWITTER_ACCESS_SECRET'], optionalEnv: [],
		npmPackage: 'twitter-mcp-server',
		icon: '🐦', tags: ['social-media', 'tweets', 'x', 'timeline'], status: 'unknown', tools: [], isOfficial: false,
	},

	// ── Dev Tools ──────────────────────────────────────────────────────────
	{
		id: 'github', name: 'GitHub',
		description: 'Manage repos, issues, PRs, search code, and more on GitHub.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'],
		requiredEnv: ['GITHUB_TOKEN'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-github',
		icon: '🐙', tags: ['git', 'code', 'issues', 'ci'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'filesystem', name: 'Filesystem',
		description: 'Read, write, and search files on the local filesystem (sandboxed).',
		category: 'dev-tools', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'],
		requiredEnv: ['ALLOWED_DIRECTORIES'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-filesystem',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
		icon: '📂', tags: ['files', 'local', 'io'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'git', name: 'Git',
		description: 'Local git repository operations — log, diff, status, commit, branch management.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@modelcontextprotocol/server-git'],
		requiredEnv: [], optionalEnv: ['GIT_REPO_PATH'],
		npmPackage: '@modelcontextprotocol/server-git',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
		icon: '🔀', tags: ['git', 'version-control', 'source-code'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'puppeteer', name: 'Puppeteer',
		description: 'Browser automation — navigate pages, take screenshots, extract content, fill forms.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-puppeteer',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
		icon: '🎭', tags: ['browser', 'automation', 'scraping', 'testing'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'playwright', name: 'Playwright',
		description: 'Cross-browser automation — test, scrape, and interact with web pages via Playwright.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@playwright/mcp-server'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@playwright/mcp-server',
		icon: '🎪', tags: ['browser', 'automation', 'testing', 'cross-browser'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'gitlab', name: 'GitLab',
		description: 'Manage GitLab repos, merge requests, issues, CI pipelines, and wikis.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@gitlab/mcp-server'],
		requiredEnv: ['GITLAB_TOKEN'], optionalEnv: ['GITLAB_URL'],
		npmPackage: '@gitlab/mcp-server',
		icon: '🦊', tags: ['git', 'code', 'ci-cd', 'merge-requests'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'sentry', name: 'Sentry',
		description: 'Query error reports, manage issues, view performance data in Sentry.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@sentry/mcp-server'],
		requiredEnv: ['SENTRY_AUTH_TOKEN'], optionalEnv: ['SENTRY_ORG', 'SENTRY_PROJECT'],
		npmPackage: '@sentry/mcp-server',
		icon: '🐛', tags: ['errors', 'monitoring', 'debugging', 'performance'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'docker', name: 'Docker',
		description: 'Manage Docker containers, images, volumes, and networks.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@docker/mcp-server'],
		requiredEnv: [], optionalEnv: ['DOCKER_HOST'],
		npmPackage: '@docker/mcp-server',
		icon: '🐳', tags: ['containers', 'docker', 'devops', 'infrastructure'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'kubernetes', name: 'Kubernetes',
		description: 'Manage Kubernetes clusters — list pods, deployments, services, view logs.',
		category: 'dev-tools', command: 'npx', args: ['-y', 'kubernetes-mcp-server'],
		requiredEnv: [], optionalEnv: ['KUBECONFIG'],
		npmPackage: 'kubernetes-mcp-server',
		icon: '☸️', tags: ['k8s', 'containers', 'orchestration', 'devops'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'postman', name: 'Postman',
		description: 'Interact with Postman APIs — manage collections, environments, and run requests.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@postmanlabs/postman-mcp-server'],
		requiredEnv: ['POSTMAN_API_KEY'], optionalEnv: [],
		npmPackage: '@postmanlabs/postman-mcp-server',
		documentationUrl: 'https://github.com/postmanlabs/postman-mcp-server',
		icon: '📮', tags: ['api', 'testing', 'collections', 'rest', 'postman'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'sonarqube', name: 'SonarQube',
		description: 'Analyze code quality and security — scan code snippets, view issues, manage quality gates.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@sonarsource/sonarqube-mcp-server'],
		requiredEnv: ['SONARQUBE_URL', 'SONARQUBE_TOKEN'], optionalEnv: ['SONARQUBE_PROJECT_KEY'],
		npmPackage: '@sonarsource/sonarqube-mcp-server',
		documentationUrl: 'https://github.com/SonarSource/sonarqube-mcp-server',
		icon: '📐', tags: ['code-quality', 'security', 'static-analysis', 'sonarqube'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'netlify-deploy', name: 'Netlify Deploy',
		description: 'Deploy web applications to Netlify — create sites, manage deploys, check build status, and configure domains.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@anthropic/netlify-mcp-server'],
		requiredEnv: ['NETLIFY_AUTH_TOKEN'], optionalEnv: [],
		npmPackage: '@anthropic/netlify-mcp-server',
		documentationUrl: 'https://github.com/anthropics/netlify-mcp-server',
		icon: '🔺', tags: ['deploy', 'hosting', 'netlify', 'web', 'ci-cd'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'browser-preview', name: 'Browser Preview',
		description: 'Spin up browser previews for web servers — capture screenshots, console logs, and interact with pages for testing and debugging.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@anthropic/browser-preview-mcp-server'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@anthropic/browser-preview-mcp-server',
		documentationUrl: 'https://github.com/anthropics/browser-preview-mcp-server',
		icon: '🌐', tags: ['browser', 'preview', 'testing', 'screenshot', 'debugging', 'web'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'integration-health', name: 'Integration Health Check',
		description: 'Monitor health of connected MCP servers and integrations — ping endpoints, check credentials, report status, and auto-retry failed connections.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@anthropic/integration-health-mcp-server'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@anthropic/integration-health-mcp-server',
		documentationUrl: 'https://github.com/anthropics/integration-health-mcp-server',
		icon: '💚', tags: ['health', 'monitoring', 'integration', 'status', 'reliability'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'deploy-universal', name: 'Universal Deploy',
		description: 'Deploy applications to multiple platforms — Railway, Render, Vercel, Netlify, and Cloudflare Workers from a single interface.',
		category: 'dev-tools', command: 'npx', args: ['-y', '@anthropic/deploy-mcp-server'],
		requiredEnv: [], optionalEnv: ['RAILWAY_TOKEN', 'RENDER_API_KEY', 'VERCEL_TOKEN', 'NETLIFY_AUTH_TOKEN', 'CLOUDFLARE_API_TOKEN'],
		npmPackage: '@anthropic/deploy-mcp-server',
		documentationUrl: 'https://github.com/anthropics/deploy-mcp-server',
		icon: '🚀', tags: ['deploy', 'hosting', 'multi-platform', 'ci-cd', 'railway', 'render', 'vercel'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'cloudflare', name: 'Cloudflare (Code Mode)',
		description: 'Full Cloudflare API via Code Mode — DNS, Workers, R2, D1, KV, WAF, Zero Trust, and 2,500+ endpoints through just 2 tools (search + execute). Uses OAuth 2.1.',
		category: 'dev-tools', endpointUrl: 'https://mcp.cloudflare.com/mcp',
		requiredEnv: [], optionalEnv: ['CLOUDFLARE_API_TOKEN'],
		documentationUrl: 'https://github.com/cloudflare/mcp-server-cloudflare',
		icon: '🔶', tags: ['cdn', 'workers', 'edge', 'dns', 'serverless', 'r2', 'd1', 'kv', 'waf', 'zero-trust', 'cloudflare'], status: 'unknown', tools: [], isOfficial: true,
	},

	// ── Productivity ───────────────────────────────────────────────────────
	{
		id: 'notion', name: 'Notion',
		description: 'Search pages, read content, create and update pages in Notion.',
		category: 'productivity', command: 'npx', args: ['-y', '@modelcontextprotocol/server-notion'],
		requiredEnv: ['NOTION_API_KEY'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-notion',
		icon: '📝', tags: ['wiki', 'notes', 'docs'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'linear', name: 'Linear',
		description: 'Manage issues, projects, and teams in Linear.',
		category: 'productivity', command: 'npx', args: ['-y', '@linear/mcp-server'],
		requiredEnv: ['LINEAR_API_KEY'], optionalEnv: [],
		npmPackage: '@linear/mcp-server',
		icon: '🔷', tags: ['issues', 'project-management', 'agile'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'jira', name: 'Jira',
		description: 'Create/search issues, manage sprints and boards in Jira.',
		category: 'productivity', command: 'npx', args: ['-y', '@atlassian/jira-mcp-server'],
		requiredEnv: ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'], optionalEnv: [],
		npmPackage: '@atlassian/jira-mcp-server',
		icon: '📋', tags: ['issues', 'project-management', 'atlassian'], status: 'unknown', tools: [], isOfficial: false,
	},
	{
		id: 'planning', name: 'Planning & Task Management',
		description: 'Structured task planning for agents — create plans, track progress, manage dependencies, and generate numbered pseudocode execution steps.',
		category: 'productivity', command: 'npx', args: ['-y', '@anthropic/planning-mcp-server'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@anthropic/planning-mcp-server',
		documentationUrl: 'https://github.com/anthropics/planning-mcp-server',
		icon: '📋', tags: ['planning', 'tasks', 'project-management', 'execution', 'workflow'], status: 'unknown', tools: [], isOfficial: true,
	},

	// ── Search ─────────────────────────────────────────────────────────────
	{
		id: 'web-search', name: 'Web Search',
		description: 'Search the web using Brave Search API.',
		category: 'search', command: 'npx', args: ['-y', '@modelcontextprotocol/server-brave-search'],
		requiredEnv: ['BRAVE_API_KEY'], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-brave-search',
		icon: '🔍', tags: ['search', 'web', 'brave'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'arxiv', name: 'Arxiv',
		description: 'Search and retrieve academic papers from Arxiv.',
		category: 'search', command: 'npx', args: ['-y', '@arxiv/mcp-server'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@arxiv/mcp-server',
		icon: '📄', tags: ['research', 'papers', 'academic'], status: 'unknown', tools: [], isOfficial: false,
	},

	// ── AI & ML ────────────────────────────────────────────────────────────
	{
		id: 'memory', name: 'Memory (Knowledge Graph)',
		description: 'Persistent memory via a local knowledge graph — store and retrieve entities and relations.',
		category: 'ai-ml', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-memory',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
		icon: '🧠', tags: ['memory', 'knowledge-graph', 'persistence', 'entities'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'sequential-thinking', name: 'Sequential Thinking',
		description: 'Dynamic, reflective problem-solving through sequential thought chains with revision support.',
		category: 'ai-ml', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
		requiredEnv: [], optionalEnv: [],
		npmPackage: '@modelcontextprotocol/server-sequential-thinking',
		documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
		icon: '🔗', tags: ['reasoning', 'thinking', 'chain-of-thought', 'planning'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'session-memory', name: 'Session Memory',
		description: 'Persistent memory database for agents — save user preferences, project context, milestones, and architectural decisions across sessions.',
		category: 'ai-ml', command: 'npx', args: ['-y', '@anthropic/memory-mcp-server'],
		requiredEnv: [], optionalEnv: ['MEMORY_DB_PATH'],
		npmPackage: '@anthropic/memory-mcp-server',
		documentationUrl: 'https://github.com/anthropics/memory-mcp-server',
		icon: '🧠', tags: ['memory', 'persistence', 'context', 'preferences', 'session'], status: 'unknown', tools: [], isOfficial: true,
	},
	{
		id: 'huggingface', name: 'Hugging Face',
		description: 'Browse models, datasets, and run inference on Hugging Face Hub.',
		category: 'ai-ml', command: 'npx', args: ['-y', '@huggingface/mcp-server'],
		requiredEnv: ['HF_TOKEN'], optionalEnv: [],
		npmPackage: '@huggingface/mcp-server',
		icon: '🤗', tags: ['models', 'inference', 'datasets'], status: 'unknown', tools: [], isOfficial: false,
	},

	// ── Intelligence ───────────────────────────────────────────────────────
	{
		id: 'breach', name: 'Breach Intelligence',
		description: 'AI-first open intelligence platform tracking 377+ research facilities, 93 equipment systems, 264 supplier relationships, 61 researchers, and 62 research papers across 11 scientific domains. Includes ClawBot agentic AI engine, correlation analysis, knowledge graph, satellite tracking, and NEST agent network integration. 27 tools covering database queries, web intelligence, analysis, knowledge creation, and inter-agent messaging.',
		category: 'intelligence', endpointUrl: 'https://breach-mcp.nexartis.workers.dev',
		requiredEnv: [], optionalEnv: ['BREACH_API_KEY'],
		documentationUrl: 'https://github.com/neoKode1/Breach',
		icon: '🔓', tags: ['intelligence', 'research', 'facilities', 'defense', 'analysis', 'knowledge-graph', 'agentic-ai', 'satellite', 'open-source', 'palantir-alternative'], status: 'unknown', tools: [], isOfficial: false,
	},
];

// ── Public API ─────────────────────────────────────────────────────────────

/** Return all servers, optionally filtered by category, search term, or official flag. */
export function listServers(opts: {
	category?: MCPCategory;
	search?: string;
	officialOnly?: boolean;
} = {}): MCPServerEntry[] {
	let results = [...SERVERS];
	if (opts.category) results = results.filter((s) => s.category === opts.category);
	if (opts.officialOnly) results = results.filter((s) => s.isOfficial);
	if (opts.search) {
		const q = opts.search.toLowerCase();
		results = results.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.description.toLowerCase().includes(q) ||
				s.tags.some((t) => t.includes(q))
		);
	}
	return results;
}

/** Get a single server by id, or undefined if not found. */
export function getServer(id: string): MCPServerEntry | undefined {
	return SERVERS.find((s) => s.id === id);
}

/** Get sorted list of distinct categories that have at least one server. */
export function getCategories(): MCPCategory[] {
	return [...new Set(SERVERS.map((s) => s.category))].sort() as MCPCategory[];
}

/** Total number of registered servers. */
export function serverCount(): number {
	return SERVERS.length;
}

export default SERVERS;


