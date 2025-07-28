# Event Calendar Application

## Overview

This is a full-stack event calendar application built with React, Express, TypeScript, and PostgreSQL. The application provides a role-based calendar system where all authenticated users can view events, but only administrators can create, edit, and delete events. The first registered user automatically becomes an administrator. The interface is in Russian and uses authentication via Replit Auth with a modern tech stack including shadcn/ui components and Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface language: Russian
Access control: Role-based system where first user becomes admin, others are read-only viewers

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build processes
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful endpoints with proper error handling

### Database Architecture
- **Database**: PostgreSQL (configured via Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Storage Strategy**: In-memory fallback with interface for easy PostgreSQL integration

## Key Components

### Database Schema
- **Users Table**: Stores user information with isAdmin flag (required for Replit Auth)
- **Events Table**: Stores calendar events with relationships to users
- **Sessions Table**: Manages user sessions (required for Replit Auth)

### Authentication System
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL storage
- Role-based access control (admin vs regular users)
- First registered user automatically becomes admin
- User profile management

### Event Management
- CRUD operations for calendar events (admin only)
- Event viewing for all authenticated users
- Event categorization (meetings, projects, deadlines)
- Monthly event filtering
- Real-time updates via React Query
- Admin-only creation, editing, and deletion via protected API endpoints

### UI Components
- Calendar grid view with month navigation
- Event creation/editing modal
- Sidebar with event statistics and upcoming events
- Responsive design with mobile support

## Data Flow

1. **Authentication Flow**:
   - User clicks login → Redirects to Replit Auth
   - Auth success → Creates/updates user session
   - Session validates → Access to protected routes

2. **Event Management Flow**:
   - User creates/edits event → Form validation with Zod
   - API request → Server validation → Database operation
   - Success response → React Query cache update → UI refresh

3. **Calendar Display Flow**:
   - Calendar component loads → Fetches events for current month
   - Events rendered in calendar grid → Real-time updates via React Query
   - Month navigation → New API request for different month

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form management
- **zod**: Runtime type validation

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Replit-specific plugins for development environment

### Production
- Frontend: Vite build to static assets
- Backend: esbuild bundle for Node.js
- Database: PostgreSQL via environment variable
- Session storage: PostgreSQL with connect-pg-simple

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OpenID Connect issuer URL

### Build Process
1. Frontend builds to `dist/public`
2. Backend bundles to `dist/index.js`
3. Static file serving in production
4. Database migrations via Drizzle Kit

The application is designed for easy deployment on Replit with automatic database provisioning and built-in authentication, while maintaining flexibility for other hosting environments.