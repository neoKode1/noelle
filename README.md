# Retools

> **Agentic software consultancy platform — powered by Cubicube™**

Retools uses Cubicube's building tools and deployment mechanisms to deliver AI-powered software retooling as a service. Businesses submit retooling requests through a guided intake wizard, and Cubicube's agentic pipeline scopes, builds, and deploys solutions to the edge.

**© 2026 Nexartis, LLC. All rights reserved.**

---

## How It Works

```
Business submits retooling request (intake wizard)
  ↓
AI agent scopes the project (Anthropic Claude + Workers AI)
  ↓
Cubicube build pipeline assembles the solution
  ↓
Preview deploy → Client approval → Production deploy
  ↓
Cloudflare Workers edge deployment via Cubicube for Platforms
```

## 🚀 Features

- **Guided Intake Wizard** — 5-step form capturing company context, current state, requirements, and constraints
- **AI-Powered Scoping** — Anthropic Claude generates project scope, task breakdown, and estimates
- **Project Dashboard** — Real-time status tracking through Submitted → Scoping → In Progress → Review → Deployed
- **Message Thread** — Communicate with the agentic system and team throughout the project lifecycle
- **Preview Deploys** — Review builds on staging URLs before going live
- **Powered by Cubicube** — Leverages Cubicube's Workers for Platforms, deployment queues, and edge infrastructure

---

## 🏗️ Technical Stack

| Technology | Purpose |
|---|---|
| **SvelteKit 5** | Full-stack framework with Svelte 5 runes |
| **Cloudflare Workers** | Edge deployment via Cubicube's platform |
| **Cloudflare D1** | SQLite database at the edge |
| **Cloudflare R2** | Object storage for project assets |
| **Cloudflare Workers AI** | Edge AI for agentic scoping |
| **Anthropic Claude** | Primary AI for scope generation and code generation |
| **Tailwind CSS** | Utility-first styling |
| **Drizzle ORM** | Type-safe database access |
| **Resend** | Transactional email notifications |

---

## 📁 Project Structure

```
src/
├── app.css              # Global styles (Tailwind)
├── app.html             # HTML template
├── app.d.ts             # TypeScript platform declarations
├── lib/
│   ├── components/      # Shared UI components (Navbar, Footer)
│   ├── db/
│   │   └── schema.ts    # Drizzle ORM schema (7 tables)
│   ├── server/          # Server-side utilities
│   ├── stores/          # Client-side state
│   ├── types/
│   │   └── intake.ts    # Intake wizard type definitions
│   └── utils/           # Shared utilities
├── routes/
│   ├── +page.svelte     # Homepage (hero, use cases, pricing)
│   ├── auth/            # Magic link authentication
│   ├── dashboard/       # Project list and detail views
│   │   └── [id]/        # Individual project tracking
│   ├── intake/          # 5-step intake wizard
│   └── api/             # API endpoints
└── migrations/
    └── 0001_initial_schema.sql
```

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Cloudflare account

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

---

## 🚀 Deployment

### Environments

| Environment | Command | Database | URL |
|---|---|---|---|
| **Local** | `pnpm run deploy:local` | local | `localhost:5173` |
| **Feature** | `pnpm run deploy:feature` | dev | `retools--<branch>.retools.dev` |
| **Dev** | `pnpm run deploy:dev` | dev | `https://dev.retools.dev` |
| **Prod** | `pnpm run deploy:prod` | prod | `https://retools.dev` |

### Feature Branch Testing

```bash
pnpm run deploy:feature
```

Creates a branch-specific subdomain (e.g., `retools--intake-wizard.retools.dev`) using the dev database, allowing isolated testing without affecting dev or prod.

---

## ⚙️ Configuration

Environment variables configured in `wrangler.jsonc`:

| Variable | Description |
|---|---|
| `ENVIRONMENT` | Deployment environment (local/feature/development/production) |
| `VITE_BASE_URL` | Application base URL |
| `FROM_EMAIL` | Sender address for notifications |
| `CONTACT_EMAIL_TO` | Contact form recipient |
| `LOG_LEVEL` | Logging verbosity (debug/info/warn) |

### Secrets (Cloudflare Secrets Store)

| Secret | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI |
| `RESEND_API_KEY` | Resend email API key |

---

## 📝 Scripts

```bash
# Development
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm check              # Run svelte-check type validation

# Deployment
pnpm run deploy:local   # Deploy to local environment
pnpm run deploy:feature # Deploy feature branch
pnpm run deploy:dev     # Deploy to dev
pnpm run deploy:prod    # Deploy to production

# Database
pnpm run db:generate    # Generate Drizzle migrations
pnpm run db:studio      # Open Drizzle Studio

# Utilities
pnpm run cf-typegen     # Generate Cloudflare types
```

---

## 🔗 Powered by Cubicube

Retools is built on top of the Cubicube™ platform, leveraging its core infrastructure:

- **Cubicube Workers for Platforms** — Isolated edge deployments for each client project
- **Cubicube Deployment Pipeline** — Queue-based build and deploy system
- **Cubicube Observability** — Axiom-exported traces and logs across all workers
- **Cloudflare Secrets Store** — Centralized secret management shared across the platform

### Related Repositories

| Repository | Description |
|---|---|
| [cubicube-com](https://github.com/Nexartis/cubicube-com) | Cubicube platform (parent) |
| [pegasus-horizon-breakthrough](https://github.com/Nexartis/pegasus-horizon-breakthrough) | Build pipeline |

---

## 📄 License

Private — © 2026 Nexartis, LLC. All rights reserved.

Part of the Cubicube™ ecosystem.

