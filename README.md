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

# Hello, world! This is a simple comment added to the README.