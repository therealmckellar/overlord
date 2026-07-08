# 🚀 Overlord Go-Live Checklist

This document tracks all placeholder values, "example" strings, and development-mode settings that MUST be replaced before the application is considered production-ready.

## 🔴 CRITICAL: Security & Credentials
*These must be replaced immediately. Exposure of these values constitutes a security breach.*

- [ ] **`JWT_SECRET`**: Currently a random string in `.env.local`. Ensure it is a cryptographically secure 64-char hex string.
- [ ] **`GOOGLE_CLIENT_ID` / `SECRET`**: Currently `your-google-client-id...` in `.env.local`.
- [ ] **`GITHUB_CLIENT_ID` / `SECRET`**: Currently `your-github-client-id...` in `.env.local`.
- [ ] **`CLOUDFLARE_ACCOUNT_ID` / `API_KEY`**: Currently `your-cloudflare...` in `.env.local`.
- [ ] **`MongoDB URI`**: GitHub Secret Scanning detected `admin:pw123` in history. While the current `.env.local` is updated, the Git history remains tainted. (Action: Rotate credentials + Consider `git filter-repo`).

## 🟡 HIGH: App Configuration & Routing
*These prevent the app from functioning correctly in a live environment.*

- [ ] **`NEXT_PUBLIC_APP_URL`**: Ensure this is exactly `https://overlord.mckellar.dev` and not `http://localhost:9125`.
- [ ] **`NODE_ENV`**: Must be set to `production` (Fixed in current session).
- [ ] **Database Adapter**: The app is currently using SQLite (`./data/overlord.db`). Transition to MongoDB Atlas using the provided Service Account credentials.

## 🟢 MEDIUM: UI/UX Placeholders
*These are visual "slop" that make the app look like a prototype.*

- [ ] **Login/Register Forms**: `placeholder="mckellardev"` needs to be generic (e.g., "Username").
- [ ] **Register Form**: `placeholder="you@example.com"` needs to be generic (e.g., "email@address.com").
- [ ] **General Inputs**: Search for and replace any remaining `example.com` or `placeholder` text in the React components.

## 🛠 Verification Steps
1. Run `grep -r "your-" .` in the root.
2. Run `grep -r "example" .` in the root.
3. Verify `NODE_ENV=production` is active in the running process.
4. Confirm all OAuth flows (Google/GitHub) use production client IDs.
