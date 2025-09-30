# Overview

This is a gaming currency distribution admin panel built with React, Express, and TypeScript. The application allows administrators to manage and distribute virtual currencies (PUBG UC and Pool Coins) to users through a web interface. It features session-based authentication, transaction tracking, and a responsive UI built with shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build Tools**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for client-side routing instead of React Router
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- CSS variables for theming support (light/dark mode ready)
- Form handling with React Hook Form and Zod validation

**State Management Strategy**
- Server state managed through React Query with disabled automatic refetching
- Form state handled by React Hook Form
- Authentication state managed via React Query with session validation
- No global client state management (Redux/Zustand) - relying on React Query cache

## Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API
- Session-based authentication using express-session
- In-memory storage implementation with interface for future database migration
- Middleware for request logging and JSON body parsing

**Authentication & Authorization**
- Session-based auth with httpOnly cookies
- bcrypt for password hashing (10 rounds)
- Session middleware protecting all /api routes except login
- Default admin account initialized on startup (username: "admin", password: "admin123")

**API Design**
- RESTful endpoints following conventional patterns
- Zod schemas for request/response validation
- Consistent error handling with appropriate HTTP status codes
- Request/response logging middleware for debugging

## Data Storage

**Current Implementation**
- In-memory storage using Map data structures
- Implements IStorage interface for abstraction
- Stores: admins (by ID and username), transactions (by ID)

**Future Database Migration Path**
- Drizzle ORM configured for PostgreSQL
- Schema defined in shared/schema.ts using Drizzle's pgTable
- Connection configured for Neon serverless Postgres
- Migration system ready via drizzle-kit

**Data Models**
- Admins: id, username, hashed password, isActive status
- Transactions: id, userUID, ucAmount, coinsAmount, adminId, adminUsername, status, createdAt timestamp

## External Dependencies

**Database (Configured, Not Active)**
- Neon Serverless PostgreSQL via @neondatabase/serverless
- Drizzle ORM for query building and migrations
- Connection string expected in DATABASE_URL environment variable

**UI Libraries**
- Radix UI primitives for accessible component foundation
- Tailwind CSS for utility-first styling
- Lucide React for icon system
- cmdk for command palette functionality

**Development Tools**
- Replit-specific plugins for development (vite-plugin-runtime-error-modal, cartographer, dev-banner)
- TypeScript for type safety across frontend and backend
- esbuild for production server bundling

**Authentication & Security**
- bcrypt for password hashing
- express-session for session management
- connect-pg-simple for future PostgreSQL session store (not currently active)

**Validation & Forms**
- Zod for schema validation
- React Hook Form with Zod resolver for form management
- drizzle-zod for generating Zod schemas from Drizzle tables

**Build & Deployment**
- Development: tsx for running TypeScript server, Vite dev server for client
- Production: Vite builds client to dist/public, esbuild bundles server to dist/index.js
- Static assets served from Express in production mode