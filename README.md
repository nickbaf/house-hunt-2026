# House Hunt 2026 - Canary Wharf Property Tracker

A sleek property tracking app for house hunting in London's Canary Wharf. Built with React, TypeScript, and Tailwind CSS, deployed on GitHub Pages.

## Features

- Track rental properties with full details (rent, beds, baths, tower, floor, etc.)
- Status tracking: Interested → Viewing Scheduled → Visited → Applied → Accepted/Rejected
- Star ratings and pro/con lists for each property
- Comment threads for discussion between flatmates
- Side-by-side property comparison (up to 3)
- Filter by status, search by name/address, sort by price/date/rating
- Dark mode UI optimized for mobile viewings
- Encrypted authentication (PAT never in plaintext in the deployed code)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a GitHub Personal Access Token

Go to [GitHub Settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new) and create a token with:

- **Repository access**: Only this repo (`house-hunt-2026`)
- **Permissions**: Contents → Read and Write

### 3. Configure GitHub repo secrets

In your repo settings (Settings → Secrets and variables → Actions), add:

| Secret | Value | Example |
|--------|-------|---------|
| `GH_PAT` | Your fine-grained PAT | `github_pat_xxx...` |
| `AUTH_USERS` | Comma-separated `user:password` pairs | `Nick:mypass123,Alex:theirpass456` |

### 4. Local development

Create a `.env.local` file (gitignored):

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

Then run:

```bash
npm run dev
```

### 5. Deploy

Push to `main` and GitHub Actions will automatically:
1. Encrypt the PAT per user using AES-256-GCM
2. Build the app
3. Deploy to GitHub Pages

## How Auth Works

The GitHub PAT is never stored in plaintext in the deployed code:

1. At **build time**, the PAT is encrypted separately for each user using their password (AES-256-GCM + PBKDF2 key derivation)
2. The encrypted blobs are baked into the JS bundle
3. At **login time**, the user's password decrypts the PAT client-side
4. The decrypted PAT is stored in localStorage for subsequent visits

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- GitHub REST API (via Octokit) for data persistence
- Web Crypto API for client-side decryption
- GitHub Actions for CI/CD
- GitHub Pages for hosting
