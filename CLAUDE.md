# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Preference

**Language Usage Rules:**
- **Responses to humans**: Always respond in Japanese (日本語で返答)
- **Claude-specific documentation**: Write in English (like this CLAUDE.md file)
- **Research and internal thinking**: Use English for efficiency
- **Human-readable content (comments, user-facing text)**: Write in Japanese

## Project Overview

This is a form creation and management system called "pukusapo" built with React Router 7, Clerk authentication, Supabase database, and deployed on Cloudflare Workers. The system implements Role-Based Access Control (RBAC) with three user roles: user, moderator, and admin.

## Common Commands

### Development
```bash
# Start development server (Vite)
npm run dev

# Start production server (Wrangler)
npm run start

# Build for production
npm run build

# Deploy to production
npm run deploy

# Deploy to development environment
npm run deploy:dev
```

### Testing & Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checking
npm run typecheck

# Generate TypeScript types
npm run typegen

# Format code
npm run format
```

### Database Operations
```bash
# Start Supabase local environment
npm run db:start

# Stop Supabase local environment  
npm run db:stop

# Reset database (careful!)
npm run db:reset

# Generate new migration
npm run db:generate

# Generate custom migration
npm run db:generate:custom

# Apply migrations
npm run db:migrate

# Seed database
npm run db:seed
```

#### Migration Strategy
When creating new database tables or schemas:
1. Use `npm run db:generate:custom` to generate an empty migration file
2. Write the SQL statements manually in the generated migration file
3. Apply migrations with `npm run db:migrate`
4. Regenerate TypeScript types with `npm run db:gen-types`

Note: Always write SQL migrations manually to ensure proper schema control and RLS policy setup.

### Storybook
```bash
# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

## Architecture

### Framework & Runtime
- **Framework**: React Router 7 with SSR
- **Runtime**: Cloudflare Workers
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Database Client**: Supabase JS Client
- **Styling**: Tailwind CSS 4.0

### Project Structure
```
app/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── layouts/       # Layout components
├── repositories/      # Database operations layer
│   └── forms.server.ts  # Forms CRUD operations
├── routes/            # React Router routes
├── services/          # Business logic & external integrations
│   ├── forms/         # Form-related business logic
│   └── supabase/      # Supabase client setup
├── models/            # Type definitions & schemas
├── lib/               # Utility functions
└── hooks/             # Custom React hooks
```

### Database Schema
The system uses a comprehensive RBAC schema with the following core tables:
- `roles`: System roles (user, moderator, admin)
- `permissions`: Granular permissions with resource.action format
- `role_permissions`: Role-permission associations
- `profiles`: User profiles linked to Clerk user IDs

### Authentication Flow
1. Clerk handles authentication and provides user IDs
2. User profiles are synced via Clerk webhooks
3. Role-based permissions are enforced through RLS policies
4. Frontend components use Clerk's React Router integration

## Environment Configuration

### Development Setup
1. Copy `.dev.vars.example` to `.dev.vars` for Cloudflare variables
2. Copy `supabase/.env.local.example` to `supabase/.env.local` for Supabase functions
3. Set up ngrok for webhook testing: `ngrok http --url=your-url.ngrok-free.app 54321`

### Key Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `CLERK_SECRET_KEY`: Clerk server-side secret
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk client-side publishable key
- `CLERK_WEBHOOK_SIGNING_SECRET`: For webhook verification

## Development Patterns

### Schema Naming Convention
This project follows a strict two-layer naming convention for schemas and types:

- **Validation Layer** (`app/models/`): `[Entity]InputSchema` → `[Entity]Input`
- **API Layer** (`app/services/*/schemas.ts`): `[Entity]ResponseSchema` → `[Entity]Response`

**Full documentation**: See [`docs/SCHEMA_NAMING_CONVENTION.md`](docs/SCHEMA_NAMING_CONVENTION.md)

**Quick reference for new entities**:
```typescript
// 1. Validation (app/models/users.ts)
export const UserInputSchema = z.object({...});
export type UserInput = z.infer<typeof UserInputSchema>;

// 2. API (app/services/users/schemas.ts)
export const UserResponseSchema = z.object({...});
export type UserResponse = z.infer<typeof UserResponseSchema>;
```

### Database Operations

**Architecture Pattern**: Repository Layer

The application uses a **Repository pattern** to separate database operations from business logic:

**Repository Layer** (`app/repositories/`):
- Handles all direct database operations using Supabase client
- Function-based approach (no classes)
- Provides CRUD operations: `findFormById`, `findAllForms`, `createForm`, `updateForm`, `deleteForm`
- Type-safe with Database type definitions from `app/models/supabase.ts`

**Service Layer** (`app/services/`):
- Contains business logic, authentication, and authorization
- Calls Repository functions for database operations
- Handles error responses and data validation
- Never directly accesses Supabase queries

**Benefits**:
- Clear separation of concerns
- Easier testing (Repository can be mocked)
- Consistent database access patterns
- Reduced code duplication

All tables use Row Level Security (RLS) for fine-grained access control through Supabase policies.

### Component Development
- UI components use shadcn/ui with Tailwind CSS
- Storybook is available for component development
- Icons are generated from SVG files using SVGR

### Route Structure
- Uses React Router 7 file-based routing
- Nested layouts support admin and public areas
- Type-safe route parameters with generated types

### State Management
- Server state managed through React Router loaders
- Client state uses React hooks
- Clerk provides authentication state

## Testing Strategy

The project uses Vitest with Storybook integration:
- Component tests through Storybook
- Browser testing with Playwright
- Run tests with `npm run test` (if available)

## Deployment

The application deploys to Cloudflare Workers:
- Production: `npm run deploy`
- Development: `npm run deploy:dev`
- Environment variables managed through Cloudflare dashboard and wrangler.jsonc

## Security Considerations

- All database tables use RLS policies
- User authentication handled by Clerk
- Environment variables properly segregated
- Webhook signatures verified for security
- HTTPS enforced for all external URLs

## Key Files to Understand

- `app/root.tsx`: Application root with Clerk provider
- `app/repositories/forms.server.ts`: Database operations for forms (Repository pattern)
- `app/services/forms/`: Business logic for forms (authentication, authorization, validation)
- `app/services/supabase/client.server.ts`: Supabase client configuration
- `app/models/supabase.ts`: Auto-generated TypeScript types from Supabase schema
- `supabase/migrations/`: Database migration files
- `react-router.config.ts`: React Router configuration
- `vite.config.ts`: Vite and development server configuration