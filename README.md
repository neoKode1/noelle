# Retools

> **Prompt-driven retooling platform — paste a repo, describe changes, get a preview.**

Retools is the UX layer on top of the Cubicube™ / Pegasus build engine. Developers paste a GitHub repo URL, describe what they want changed in plain English, and Retools dispatches the Pegasus AI pipeline to clone, modify, build, and deploy a preview. No infrastructure setup required.

**© 2026 Nexartis, LLC. All rights reserved.**

---

## How It Works

```
Developer pastes GitHub repo URL + describes changes
  ↓
Retools creates a retool job (D1) and dispatches Pegasus workflow
  ↓
Pegasus clones repo → AI applies changes → builds → deploys preview
  ↓
Preview at *.cubicubes.ai → developer approves or refines
  ↓
Approved → deploy to production domain
```

Retools is **purely additive** — it doesn't modify Cubicube, the builder queue, or Pegasus. It's a new consumer of the existing pipeline via GitHub Actions `workflow_dispatch`.

---

## 🚀 Features

- **Prompt-Driven Interface** — Paste a repo URL + type what you want changed. That's it.
- **Live Pipeline Tracker** — Real-time status: Queued → Cloning → AI Customizing → Building → Deploying → Preview Ready
- **Preview Deploys** — Changes deploy to `*.cubicubes.ai` sandbox URLs for review before going live
- **Approve / Refine Loop** — Accept changes or refine your prompt for another iteration
- **Webhook Integration** — HMAC-verified callbacks from Pegasus update job status in real-time
- **Powered by Pegasus** — Leverages the full Cubicube AI build pipeline without any infrastructure changes

---

## 🏗️ Architecture

```
┌──────────────────────┐       workflow_dispatch        ┌──────────────────────────┐
│  Retools (this repo) │  ─────────────────────────────▶│  Pegasus HB (GitHub Actions) │
│  SvelteKit + CF D1   │                                │  clone → AI → build → deploy │
│                      │◀─────────────────────────────  │                              │
│  /api/retool         │       HMAC webhook callback    │  deploy-worker.yml           │
│  /api/webhooks/pegasus│                               └──────────────────────────┘
└──────────────────────┘                                           │
         │                                                         ▼
         │                                              ┌──────────────────────┐
         ▼                                              │  *.cubicubes.ai      │
┌──────────────────────┐                                │  Preview deployment  │
│  Dashboard UI        │                                └──────────────────────┘
│  Status pipeline     │
│  Approve / Refine    │
└──────────────────────┘
```

### Integration Contract

Retools calls the **same** `workflow_dispatch` API that `cubicube_builder_queue` uses:

| Field | Value |
|---|---|
| Workflow | `deploy-worker.yml` in `Nexartis/pegasus-horizon-breakthrough` |
| `deployment_payload.schema_version` | `8` |
| `deployment_payload.is_real_domain` | `false` (preview) / `true` (production) |
| `deployment_payload.ai_mode` | `pegasus_hb` |
| `deployment_payload.dispatch_namespace` | `retools-dispatch-namespace` |
| Webhook callback | `POST /api/webhooks/pegasus` with HMAC signature |

---

## 🛠️ Technical Stack

| Technology | Purpose |
|---|---|
| **SvelteKit 5** | Full-stack framework with Svelte 5 runes |
| **Cloudflare Workers** | Edge deployment |
| **Cloudflare D1** | SQLite database (`retool_jobs`, `users`, `job_events`) |
| **Cloudflare R2** | Asset storage |
| **Tailwind CSS** | Utility-first styling |
| **Drizzle ORM** | Type-safe database schema |
| **Pegasus HB** | AI build pipeline (GitHub Actions) |

---

## 📡 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/retool` | Create retool job + dispatch Pegasus workflow |
| `GET` | `/api/jobs/[id]` | Get job status and details |
| `POST` | `/api/jobs/[id]/approve` | Approve preview → deploy to production |
| `POST` | `/api/jobs/[id]/refine` | Submit refined prompt for another iteration |
| `POST` | `/api/webhooks/pegasus` | HMAC-verified webhook for Pegasus status callbacks |

### `POST /api/retool` — Example

```json
{
  "repoUrl": "https://github.com/user/my-site",
  "branch": "main",
  "prompt": "Make the hero section darker and add a pricing page with three tiers"
}
```

Returns `201` with `{ id, deploymentId, status: "queued" }`.

---

## 📁 Project Structure

```
src/
├── app.css              # Global styles (Tailwind)
├── app.d.ts             # TypeScript platform declarations (D1, R2, Secrets Store)
├── lib/
│   ├── components/      # Navbar, Footer
│   ├── db/schema.ts     # Drizzle ORM schema (users, retool_jobs, job_events)
│   ├── types/retool.ts  # Job statuses, pipeline stages, GitHub URL parser
│   ├── server/          # Server-side utilities
│   ├── stores/          # Client-side state
│   └── utils/           # Shared utilities
├── routes/
│   ├── +page.svelte     # Homepage — "Retool Your Website with AI"
│   ├── retool/          # Repo URL + prompt form
│   ├── dashboard/       # Job list + status pipeline tracker
│   │   └── [id]/        # Individual job detail view
│   └── api/
│       ├── retool/      # POST — create job + dispatch
│       ├── jobs/[id]/   # GET status, POST approve/refine
│       └── webhooks/
│           └── pegasus/ # HMAC-verified Pegasus callbacks
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
pnpm install
pnpm dev
```

---

## 🚀 Deployment

### Environments

| Environment | Command | Database | URL |
|---|---|---|---|
| **Feature** | `npx wrangler deploy --env feature` | `retools-db-dev` | `https://retools-feature.nexartis.workers.dev` |
| **Dev** | `pnpm run deploy:dev` | `retools-db-dev` | `https://dev.retools.dev` |
| **Prod** | `pnpm run deploy:prod` | `retools-db-prod` | `https://retools.dev` |

### Current Test Deployment

```
https://retools-feature.nexartis.workers.dev
```

Deployed via `feature` environment using D1 database `retools-db-dev` (`6f1f1028-7690-48f1-8a25-673306c23985`).

---

## ⚙️ Configuration

### Environment Variables (`wrangler.jsonc`)

| Variable | Description |
|---|---|
| `ENVIRONMENT` | `feature` / `development` / `production` |
| `FROM_EMAIL` | Sender for notifications |
| `CONTACT_EMAIL_TO` | Contact form recipient |
| `LOG_LEVEL` | `debug` / `info` / `warn` |

### Secrets (Cloudflare Secrets Store `7abc511fc4b74147808e542ece047670`)

| Binding | Secret Name | Purpose |
|---|---|---|
| `GITHUB_PAT` | `CUBICUBE_BUILDER_QUEUE_GITHUB_PAT_TOKEN` | GitHub PAT for workflow_dispatch |
| `CUBICUBE_BUILDER_QUEUE_WEBHOOK` | `CUBICUBE_BUILDER_QUEUE_WEBHOOK` | HMAC key for webhook verification |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | Claude AI (future) |
| `RESEND_API_KEY` | `RESEND_API_KEY` | Transactional email (future) |

---

## 📝 Scripts

```bash
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm check              # Run svelte-check type validation
pnpm run deploy:dev     # Deploy to dev
pnpm run deploy:prod    # Deploy to production
pnpm run db:generate    # Generate Drizzle migrations
pnpm run cf-typegen     # Generate Cloudflare types
```

---

## 🔗 Related Repositories

| Repository | Role |
|---|---|
| [cubicube-com](https://github.com/Nexartis/cubicube-com) | Cubicube platform (Retools does NOT modify this) |
| [pegasus-horizon-breakthrough](https://github.com/Nexartis/pegasus-horizon-breakthrough) | AI build pipeline (Retools dispatches workflows here) |
| [cubicube_builder_queue](https://github.com/Nexartis/cubicube_builder_queue) | Queue consumer (Retools bypasses this, dispatches directly) |

---

## 📄 License

Private — © 2026 Nexartis, LLC. All rights reserved.

Part of the Cubicube™ ecosystem.

