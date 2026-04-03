# CLAUDE.md

## Communication

- Respond in Japanese (日本語)
- Code comments, commit messages: Japanese OK
- CLAUDE.md, agent definitions: English

## Project Overview

pukusapo is a form creation and management system. Monorepo with `backend/` (Rails 8.1 API) and `frontend/` (React Router 7 on Cloudflare Workers).

## Current Status

**Actively migrating from Supabase direct access to Rails backend API.**

- Migration plan and milestones: `docs/adr/003-rails-migration-milestones.md`
- Frontend API client design: `docs/adr/001-frontend-api-client.md`
- Test DB setup: `docs/adr/002-test-db-setup-with-supabase.md`

### What's done

- Rails backend with Clerk auth, deployed via Kamal (prod + staging)
- `GET /session`, `GET /v1/profiles/me` endpoints
- Frontend `profiles/me` migrated to Rails API
- RSpec test infrastructure (FactoryBot, Shoulda::Matchers, AuthHelper) — on `feature/add_rspec`, not yet merged
- Backend CI (brakeman, rubocop, rspec) — on `feature/add_rspec`, not yet merged

### What's next (see ADR-003 for full plan)

1. **MS1**: Merge `feature/add_rspec` to main (test + CI foundation)
2. **MS2**: Admin read APIs (forms, events, users, facility_accounts, collection_jobs)
3. **MS3**: Admin write APIs (CRUD)
4. **MS4**: Portal APIs (public forms, submissions)
5. **MS5**: Remove Supabase direct access, drop RLS, consider OpenAPI

## Key Architecture Decisions

- **RLS**: Keep until MS5 (still needed for unmigrated frontend → Supabase paths). Do NOT add new RLS policies.
- **Migrations**: New tables via Rails migrations. Existing tables stay as-is (Supabase-managed).
- **API responses**: Only include fields the UI needs. Singular names for belongs_to (e.g., `role` not `roles`).
- **Frontend schemas**: Hand-written Zod schemas are interim. Don't over-engineer — will be replaced by OpenAPI.

## Available Skills (`.claude/agents/`)

| Skill | When to use |
|---|---|
| `rails-api-endpoint` | Adding a new Rails API endpoint (model, controller, routes, spec) |
| `frontend-api-migration` | Migrating frontend from Supabase direct to Rails API |
| `deploy-cd` | Setting up GitHub Actions CD for Kamal / Wrangler |
| `er-diagram-designer` | Designing database schemas and ER diagrams |

## Commands

### Backend
```bash
cd backend
bundle exec rspec                    # Run tests
bundle exec rubocop                  # Lint
bundle exec brakeman                 # Security scan
bin/rails server -p 3001             # Dev server
```

### Frontend
```bash
cd frontend
npm run dev                          # Dev server
npm run typecheck                    # Type check
npm run lint                         # Lint
```

### Database
```bash
cd frontend
npm run db:start                     # Start Supabase local
npm run db:stop                      # Stop Supabase local
npm run db:reset                     # Reset DB
```

## Repo Structure

```
backend/                  # Rails 8.1 API-only
  app/controllers/v1/     # API controllers (namespaced v1)
  app/models/             # ActiveRecord models
  spec/                   # RSpec tests
frontend/                 # React Router 7 + Cloudflare Workers
  app/api/                # API layer (calls Rails via ApiClient)
  app/services/           # Business logic
  app/repositories/       # Supabase direct access (being phased out)
  app/routes/             # File-based routing
supabase/migrations/      # DB migrations (existing tables)
docs/adr/                 # Architecture Decision Records
.github/workflows/        # CI/CD
```
