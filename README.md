<!-- This project was built with Noelle AI -->
# Noelle

> **Ai webkits — paste a repo, describe changes, get a PR.**

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
| Webhook callback | `POST https://retools.dev/api/webhooks/builder` (HMAC-verified) |

---

## 🛠️ Tech Stack

- **Frontend:** SvelteKit + Tailwind CSS
- **Database:** Cloudflare D1 (SQLite)
- **Queue:** Cloudflare Queues
- **Builder Engine:** GitHub Actions (separate repo)
- **AI:** Framework-agnostic prompts (Claude, GPT-4, etc.)

---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/your-org/retools.git
cd retools

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Cloudflare credentials

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

---

## 🚀 Deployment

Retools is designed to run on Cloudflare Pages + Workers.

```bash
# Deploy to Cloudflare
npm run deploy
```

---

## 🔒 Security

- **User tokens are scoped** — Retools only accesses repos the user's PAT can access
- **Webhook HMAC verification** — All callbacks from the builder engine are cryptographically signed
- **No token logging** — GitHub PATs are never logged or stored permanently

---

## 📝 License

Proprietary. © 2026 Nexartis, LLC. All rights reserved.

---

## 🤝 Contributing

This is a private project. Contact the maintainers for access.

---

## 📧 Contact

For questions or support, reach out to the Nexartis team.