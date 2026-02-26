# Noelle

> **Ai webkits — paste a repo, describe changes, get a PR.**

![Noelle](static/noelle_sc2.png)

Noelle is an AI-powered PR generation platform. Developers paste a GitHub repo URL, provide their own GitHub token, describe what they want changed in plain English, and Noelle enqueues the job into the Noelle builder queue. The queue consumer dispatches the Noelle Builder Engine to clone, modify, build, push a branch, and create a pull request — all scoped to the repos the user's token can access.

**© 2026 Nexartis, LLC. All rights reserved.**

---

## How It Works

```
Developer/Agent provides GitHub repo URL + prompt + GitHub PAT
  ↓
Retools validates token, creates job (D1), enqueues DeploymentMessage v8
  ↓
Retools Builder Queue consumer picks up message → dispatches builder workflow
  ↓
Builder engine clones repo → AI applies changes → quality gate → build
  ↓
Builder engine pushes branch + creates PR on the user's repo (using their token)
  ↓
Webhook callback updates job status in real-time
```

Retools sends job messages to the Retools builder queue. The queue consumer and builder engine handle the rest.

---

## 🚀 Features

- **Prompt-Driven Interface** — Paste a repo URL + type what you want changed. That's it.
- **User-Provided GitHub Token** — Callers supply their own PAT, scoping access to repos they own. Works for humans and agents alike.
- **PR-Only Mode** — Retools creates a branch and pull request instead of deploying to a live URL. Review changes before merging.
- **Live Pipeline Tracker** — Real-time status: Queued → Cloning → AI Customizing → Building → Pushing → PR Created
- **Webhook Integration** — HMAC-verified callbacks from the builder engine update job status in real-time
- **Powered by Retools Builder Engine** — Leverages the full Retools AI build pipeline

---

## 🏗️ Architecture

```
┌──────────────────────┐   DeploymentMessage      ┌────────────────────────────┐
│  Retools (this repo) │  ──── CF Queue ────────▶ │  Retools Builder Queue     │
│  SvelteKit + CF D1   │                          │  (queue consumer worker)   │
│                      │                          │                            │
│  /api/retool         │                          │  Triggers retools-engine   │
│  /api/webhooks/builder│                         │  GitHub Actions workflow   │
└──────────────────────┘                          └────────────┬───────────────┘
         ▲                                                     │
         │                                                     ▼
         │  HMAC webhook callback              ┌──────────────────────────────┐
         └─────────────────────────────────────│  Retools Builder Engine      │
                                               │  (GitHub Actions)            │
                                               │  clone → AI → build → push  │
                                               │  → create PR (user token)   │
                                               │  Framework-agnostic prompts │
                                               └──────────────────────────────┘
```

### Integration Contract

Retools enqueues a **DeploymentMessage** onto the Retools builder queue (Cloudflare Queue):

| Field | Value |
|---|---|
| Queue | `retools-builder-queue-dev` (dev) · `retools-builder-queue-prod` (prod) |
| `schema_version` | `1` |
| `github_token` | User-provided PAT (encrypted in transit, never logged) |
| Webhook callback | `POST /api/webhooks/builder` with HMAC signature |

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
| **Retools Builder Engine** | AI build pipeline — GitHub Actions workflow with framework-agnostic prompts |

---

## 📡 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/retool` | Validate token, create job, enqueue to builder queue |
| `GET` | `/api/jobs/[id]` | Get job status and details |
| `POST` | `/api/jobs/[id]/approve` | Approve preview → deploy to production |
| `POST` | `/api/jobs/[id]/refine` | Submit refined prompt for another iteration |
| `POST` | `/api/webhooks/builder` | HMAC-verified webhook for builder engine status callbacks |

### `POST /api/retool` — Example

```json
{
  "repoUrl": "https://github.com/user/my-site",
  "branch": "main",
  "prompt": "Make the hero section darker and add a pricing page with three tiers",
  "github_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

- `github_token` — **Required.** GitHub PAT with `repo` scope that has access to the target repository. Validated against the GitHub API before the job is accepted.
- `branch` — **Optional.** If omitted, Retools auto-detects the repo's default branch via the GitHub API (e.g. `main`, `master`, `develop`). Falls back to `main` only as a last resort.

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
│           └── builder/ # HMAC-verified builder engine callbacks
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
| **Dev** | `pnpm run deploy:dev` | `retools-db-dev` | `https://retools.vercel.app` |
| **Prod** | `pnpm run deploy:prod` | `retools-db-prod` | `https://retools.dev` |

### Current Active Deployment

```
https://retools.vercel.app
```

Deployed on Vercel using D1 database `retools-db-dev` (`6f1f1028-7690-48f1-8a25-673306c23985`) via Cloudflare D1 REST API.

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

| Variable | Purpose |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for D1 REST API access |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with D1 Edit scope |
| `ANTHROPIC_API_KEY` | Claude AI for code generation |
| `RETOOLS_WEBHOOK_SECRET` | HMAC key for webhook verification |
| `BUILDER_QUEUE_URL` | Retools builder queue HTTP trigger endpoint |
| `BUILDER_QUEUE_TOKEN` | Bearer token for builder queue |

---

## 🔐 Security — User-Provided GitHub Token

Retools requires callers to supply their own GitHub PAT. This design:

- **Proves authorization** — only tokens with `repo` scope on the target repo are accepted
- **Works for humans AND agents** — any caller with a valid PAT can submit a job
- **Scopes access** — The builder engine can only push to repos the token authorizes

### Token lifecycle

1. **Validated at ingestion** — Retools checks the token against GitHub API (`GET /repos/:owner/:repo`) before accepting the job
2. **Passed through queue** — Token travels inside the DeploymentMessage, encrypted in transit via Cloudflare Queues
3. **Sanitized from logs** — Builder queue strips `github_token` before logging; builder engine masks via `::add-mask::`
4. **Written to temp file** — Builder engine writes the token to `/tmp/user_github_token.txt` (never to `GITHUB_OUTPUT`)
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
| [retools-engine](https://github.com/neoKode1/retools-engine) | Retools Builder Engine — AI build pipeline (GitHub Actions) |
| [retools-builder-queue](https://github.com/neoKode1/retools-builder-queue) | Queue consumer — triggers `retools-engine` workflow |

---

## 🔧 Developer Notes

### Current State (2026-02-15)

- **Active Branch**: `main` (fully functional end-to-end pipeline)
- **Deployed Version**: Latest on `retools.vercel.app`
- **Default Branch**: `main`
- **Recent Changes** (2026-02-15):
  - ✅ **Complete end-to-end pipeline working** — Job submission → AI changes → Build validation → PR creation
  - ✅ **AI Auto-Fix Build Loop** — Up to 3 AI attempts to fix build errors before failing
  - ✅ **Comprehensive webhook coverage** — All 6 pipeline stages send real-time status updates
  - ✅ **Fixed webhook statuses** — All statuses now match UI exactly (`cloning`, `customizing`, `building`, `deploying`, `preview_ready`)
  - ✅ **HMAC webhook signature validation** — Properly awaiting Secrets Store Promise
  - ✅ **Claude 4.5 integration** — Using `claude-sonnet-4-5-20250929` model
  - ✅ **Dual AI modes** — Normal mode for initial changes, fix mode for debugging build errors
  - ✅ **Mandatory build validation** — PRs only created when build succeeds
- **Previous Changes** (2026-02-12):
  - Auto-detect default branch from GitHub API instead of hardcoding `main` (commit `84ab00f`)
  - GitHub token input field added to retool form UI
  - Health check endpoint (`/api/health`)
  - Migrated from Cloudflare Pages to Vercel with D1 REST API integration
  - PR-focused UX replacing preview references

### Retools Builder Engine Secrets

The `retools-engine` GitHub Actions repo needs **2 secrets**:

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude AI for code generation |
| `RETOOLS_WEBHOOK_SECRET` | HMAC key for webhook callbacks |

The user's GitHub token (passed in the DeploymentMessage) is used for both repo checkout and push/PR creation — no separate service PAT required.

---

## 🧪 Testing Status

### End-to-End Pipeline

| Step | Status |
|---|---|
| Token validation via GitHub API | ✅ Working |
| Job creation + D1 persistence | ✅ Working |
| Queue dispatch to builder queue | ✅ Working |
| Builder queue routing to `retools-engine` | ✅ Working |
| User token checkout in builder engine | ✅ Working |
| Framework-agnostic AI prompts | ✅ Working |
| AI auto-fix build loop (up to 3 attempts) | ✅ Working |
| Build validation (mandatory) | ✅ Working |
| Branch push with user token | ✅ Working |
| PR creation with user token | ✅ Working |
| Real-time webhook status updates | ✅ Working |
| Default branch auto-detection | ✅ Working |

### Tested Repos

| Repo | Framework | Default Branch | Result |
|---|---|---|---|
| `neoKode1/varylite` | SvelteKit | `main` | ✅ Full E2E success — PR created, Vercel built cleanly |
| `neoKode1/CEO-AI` | Next.js | `master` | ✅ Full E2E success — AI changes applied, build validated, branch pushed |

### AI Auto-Fix Build Loop

The workflow now includes intelligent build validation with AI self-correction:

1. **Initial Build Attempt** — After AI applies changes, the project is built
2. **Auto-Fix Loop** — If build fails, AI analyzes the error and attempts to fix it (up to 3 times)
3. **Fix Mode** — AI uses a specialized debugging prompt focused on minimal fixes
4. **Success or Fail** — PR is only created if build succeeds; job fails after 3 unsuccessful fix attempts

This prevents broken PRs from being created and ensures all AI-generated code builds successfully.

### Known Issues (Resolved)

1. **Git credential helper override** — `actions/checkout@v4` cached the service PAT, preventing user token push. Fixed by unsetting `http.https://github.com/.extraheader`.
2. **Framework translation** — AI was hardcoded to translate everything to SvelteKit. Fixed with framework-agnostic prompts in `retools-engine`.
3. **Default branch hardcoded to `main`** — Repos using `master` or other default branches failed at checkout. Fixed by auto-detecting from GitHub API response.
4. **Webhook signature validation** — Secrets Store binding returns a Promise. Fixed by awaiting: `await env.RETOOLS_WEBHOOK_SECRET`.
5. **Invalid webhook statuses** — Using `cloning_complete` and `build_complete` which don't exist in UI. Fixed to use exact UI statuses.
6. **Claude API model** — Multiple model names tried (404 errors). Fixed by using `claude-sonnet-4-5-20250929` (Claude 4.5).
7. **JSON parsing in workflow** — Using `echo` with JSON caused shell interpretation errors. Fixed by using heredoc syntax.

---

## 📄 License

Private — © 2026 Nexartis, LLC. All rights reserved.

Part of the Retools ecosystem.

