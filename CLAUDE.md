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
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS 4.0

### Project Structure
```
app/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui components
│   └── layouts/       # Layout components
├── db/                # Database layer
│   ├── schema/        # Database schema definitions
│   ├── queries/       # Database queries
│   └── client.ts      # Database client setup
├── routes/            # React Router routes
├── services/          # External service integrations
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

### Database Operations
- Use Drizzle ORM for all database operations
- Schema files are organized by feature in `app/db/schema/`
- Database client is created per request with connection pooling
- All tables use Row Level Security (RLS) for fine-grained access control

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
- `app/db/client.ts`: Database connection setup
- `app/db/schema/`: Database schema definitions
- `supabase/migrations/`: Database migration files
- `react-router.config.ts`: React Router configuration
- `vite.config.ts`: Vite and development server configuration