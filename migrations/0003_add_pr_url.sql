-- Migration: Add pr_url column to retool_jobs
-- Separates the GitHub PR link from the actual live preview URL.
-- preview_url will now hold the real hosted preview (Vercel/Netlify/etc.)
-- pr_url holds the GitHub Pull Request link.

ALTER TABLE retool_jobs ADD COLUMN pr_url TEXT;

