# Retools

> **Prompt-driven retooling platform — paste a repo, describe changes, get a PR.**

Retools is the UX layer on top of the Cubicube™ / Pegasus build engine. Developers (or agents) paste a GitHub repo URL, provide their own GitHub token, describe what they want changed in plain English, and Retools enqueues the job into the Cubicube builder queue. The queue consumer dispatches the Pegasus AI pipeline to clone, modify, build, push a branch, and create a pull request — all scoped to the repos the user's token can access.

**© 2026 Nexartis, LLC. All rights reserved.**

---

## How It Works

```
Developer/Agent provides GitHub repo URL + prompt + GitHub PAT
  ↓
Retools validates token, creates job (D1), enqueues DeploymentMessage v8
  ↓
Cubicube Builder Queue consumer picks up message → dispatches Pegasus workflow
  ↓
Pegasus clones repo → AI applies changes → quality gate → build
  ↓
Pegasus pushes branch + creates PR on the user's repo (using their token)
  ↓
Webhook callback updates job status in real-time
```

Retools is **purely additive** — it sends `deploy_mode: pr_only` messages to the existing Cubicube builder queue. The queue consumer and Pegasus handle the rest.

---

## 🚀 Features

- **Prompt-Driven Interface** — Paste a repo URL + type what you want changed. That's it.
- **User-Provided GitHub Token** — Callers supply their own PAT, scoping access to repos they own. Works for humans and agents alike.
- **PR-Only Mode** — Retools creates a branch and pull request instead of deploying to a live URL. Review changes before merging.
- **Live Pipeline Tracker** — Real-time status: Queued → Cloning → AI Customizing → Building → Pushing → PR Created
- **Webhook Integration** — HMAC-verified callbacks from Pegasus update job status in real-time
- **Powered by Pegasus** — Leverages the full Cubicube AI build pipeline without any infrastructure changes

---

## 🏗️ Architecture

```
┌──────────────────────┐   DeploymentMessage v8   ┌────────────────────────────┐
│  Retools (this repo) │  ──── CF Queue ────────▶ │  Cubicube Builder Queue    │
│  SvelteKit + CF D1   │                          │  (queue consumer worker)   │
│                      │                          │                            │
│  /api/retool         │                          │  Validates message,        │
│  /api/webhooks/pegasus│                         │  triggers workflow_dispatch │
└──────────────────────┘                          └────────────┬───────────────┘
         ▲                                                     │
         │                                                     ▼
         │  HMAC webhook callback              ┌──────────────────────────────┐
         └─────────────────────────────────────│  Pegasus HB (GitHub Actions) │
                                               │  clone → AI → build → push  │
                                               │  → create PR (user token)   │
                                               │  deploy-worker.yml          │
                                               └──────────────────────────────┘
```

### Integration Contract

Retools enqueues a **DeploymentMessage v8** onto the Cubicube builder queue (Cloudflare Queue):

| Field | Value |
|---|---|
| Queue | `cubicube-builder-queue-dev` (dev/feature) · `cubicube-builder-queue-prod` (prod) |
| `schema_version` | `8` |
| `deploy_mode` | `pr_only` — push branch + create PR, skip deploy/verify/archive |
| `ai_mode` | `pegasus_hb` |
| `github_token` | User-provided PAT (encrypted in transit, never logged) |
| Webhook callback | `POST /api/webhooks/pegasus` with HMAC signature |

---

## 🛠️ Technical Stack

| Technology | Purpose |
|---|---|
| **SvelteKit 5** | Full-stack framework with Svelte 5 runes |
| **Cloudflare Workers** | Edge deployment |
| **Cloudflare Queues** | DeploymentMessage delivery to builder queue |
| **Cloudflare D1** | SQLite database (`retool_jobs`, `users`, `job_events`) |
| **Cloudflare R2** | Asset storage |
| **Tailwind CSS** | Utility-first styling |
| **Drizzle ORM** | Type-safe database schema |
| **Pegasus HB** | AI build pipeline (GitHub Actions) |

---

## 📡 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/retool` | Validate token, create job, enqueue to builder queue |
| `GET` | `/api/jobs/[id]` | Get job status and details |
| `POST` | `/api/jobs/[id]/approve` | Approve preview → deploy to production |
| `POST` | `/api/jobs/[id]/refine` | Submit refined prompt for another iteration |
| `POST` | `/api/webhooks/pegasus` | HMAC-verified webhook for Pegasus status callbacks |

### `POST /api/retool` — Example

```json
{
  "repoUrl": "https://github.com/user/my-site",
  "branch": "main",
  "prompt": "Make the hero section darker and add a pricing page with three tiers",
  "github_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

The `github_token` is **required**. It must be a GitHub PAT with `repo` scope that has access to the target repository. Retools validates the token against the GitHub API before accepting the job.

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
| `GITHUB_PAT` | `CUBICUBE_BUILDER_QUEUE_GITHUB_PAT_TOKEN` | GitHub PAT (queue consumer dispatch — not used for push) |
| `CUBICUBE_BUILDER_QUEUE_WEBHOOK` | `CUBICUBE_BUILDER_QUEUE_WEBHOOK` | HMAC key for webhook verification |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | Claude AI (future) |
| `RESEND_API_KEY` | `RESEND_API_KEY` | Transactional email (future) |

---

## 🔐 Security — User-Provided GitHub Token

Retools requires callers to supply their own GitHub PAT. This design:

- **Proves authorization** — only tokens with `repo` scope on the target repo are accepted
- **Works for humans AND agents** — any caller with a valid PAT can submit a job
- **Scopes access** — Pegasus can only push to repos the token authorizes

### Token lifecycle

1. **Validated at ingestion** — Retools checks the token against GitHub API (`GET /repos/:owner/:repo`) before accepting the job
2. **Passed through queue** — Token travels inside the DeploymentMessage, encrypted in transit via Cloudflare Queues
3. **Sanitized from logs** — Builder queue strips `github_token` before logging; Pegasus masks via `::add-mask::`
4. **Written to temp file** — Pegasus writes the token to `/tmp/pegasus_user_github_token.txt` (never to `GITHUB_OUTPUT`)
5. **Used for push + PR** — Git remote is reconfigured with the user token; PR is created under the token owner's identity
6. **Cleaned up** — Temp file is deleted in an `always()` step, regardless of pipeline outcome

---

## 📝 Scripts

```bash
pnpm dev                # Start development server
pnpm build              # Build for production
pnpm check              # Run svelte-check type validation
pnpm run deploy:feature # Deploy feature branch
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
| [pegasus-horizon-breakthrough](https://github.com/Nexartis/pegasus-horizon-breakthrough) | AI build pipeline — Pegasus executes clone → AI → build → push → PR |
| [cubicube_builder_queue](https://github.com/Nexartis/cubicube_builder_queue) | Queue consumer — receives DeploymentMessage from Retools and dispatches Pegasus |

---

## 📄 License

Private — © 2026 Nexartis, LLC. All rights reserved.

Part of the Cubicube™ ecosystem.

