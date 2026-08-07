# Monorepo Audit Summary
Generated: 2026-08-06T11:32:19.133Z

## Workspaces detected
- **vyapar-backend** (express) — apps\backend
- **red-accounting-desktop** (react-router) — apps\desktop
- **mobile-inventory-app** (react-native) — apps\mobile
- **business-accounting-app** (react-router) — apps\web
- **website** (react-router) — apps\website
- **@repo/shared** (unknown) — packages\shared

## File inventory
- Total code files scanned: 593
- See `file-inventory.csv` for every file: purpose, category, who imports it.

## Orphan files (not imported anywhere, not an entry point/page/route)
- Count: 22
- See `orphan-files.csv`. **Review manually before deleting** — path-alias imports
  (e.g. `@/services/Api`) or dynamic `require(variable)` calls won't be detected here.

## Frontend pages found: 203
See `frontend-pages.csv`.

## Backend routes found: 164
See `backend-routes.csv`.

## 🔴 Broken imports (imports pointing to files that don't exist)
- Count: 0
- Full list in `broken-imports.csv`. These are the highest-priority fixes — a broken
  import means the app will crash (or silently fail to bundle) the moment that code path runs.
- None found. 🎉

## packages/shared cross-app usage matrix
- Total files inside `packages/`: 42
- Files NOT used by ANY app (dead shared code): 8
- Full breakdown (which of web/desktop/mobile/backend actually uses each shared file)
  in `shared-usage-matrix.csv` — open in Excel, this is the clearest way to see if your
  "shared" package is actually shared or if some files are secretly only used by one app
  (or by none, meaning the migration from local files was incomplete or the file is dead).

## Frontend → Backend link check
- Total API calls found in frontend code: 8
- Calls with NO matching backend route (possible broken/dead link): 0
- Backend routes never called from this frontend workspace (may be used by mobile, or unused): 157
- Full detail in `api-link-report.csv`.



## Known blind spots (please read before trusting this 100%)
- Path-alias imports (e.g. `@/components/Button`) are NOT resolved unless they match an
  internal workspace package name — if your web app uses `@/` aliases pointing into its
  own `src`, those imports won't count as "usage" and files may show as false orphans.
  Fix: tell me your `tsconfig.json` / `jsconfig.json` paths mapping and I'll add alias support.
- API link matching is string-based (URL vs route path), not a real router simulation —
  double check anything marked unmatched before assuming it's broken.
- Mobile (React Native) API calls often use a central `api.js`/axios instance with a base
  URL variable, so some calls may show fewer results than expected — check `services/` files
  directly for those.
- Dynamically constructed import/require paths (built from variables at runtime) are invisible
  to static analysis like this by design — no static tool can fully catch these.
