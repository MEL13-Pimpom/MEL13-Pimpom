# Recycling Pickup Scheduler

## Project Description

The Recycling Pickup Scheduler is a fullstack web application that lets residents schedule recycling pickup requests, administrators manage and assign those requests, and collectors complete the pickups assigned to them.

## Objectives

* Simplify the recycling request process for residents
* Improve waste collection management for administrators
* Provide a structured, role-based system for residents, admins, and collectors
* Encourage environmentally friendly practices through accessible scheduling

## User Roles

### Resident

* Submit pickup requests with type, weight estimate, address, photo, and preferred time
* View, cancel, or reschedule pending requests
* Receive notifications about request status

### Admin

* Manage user accounts and roles
* Approve or reject incoming requests
* Define schedules and assign requests to collector routes
* Broadcast notifications and view analytics

### Collector

* See assigned routes and stops for the day
* Update pickup status (en route, arrived, completed, missed)
* Receive notifications about new assignments

## Key Features

* Email/password and Google OAuth authentication (Supabase Auth)
* Role-based dashboards with route-level access control
* Request submission with photo upload to Supabase Storage
* Approval workflow and route assignment
* Notification system per user
* Analytics dashboard for admins

## Technologies Used

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, Server Components + Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (green theme `#4CAF50`) |
| Client state | Zustand + persist middleware |
| Forms / Validation | react-hook-form + zod + @hookform/resolvers |
| Notifications | sonner (toast) |
| Backend | Next.js Server Actions + Route Handlers |
| DB / Auth / Storage | Supabase (Postgres + Auth email-pass + Google OAuth + Storage) |
| Charts | recharts (for Admin Reports) |
| Icons | lucide-react |
| Date | date-fns |
| Package manager | pnpm |

## Project Structure

```
src/
├─ app/                # Next.js App Router pages, grouped by role
│  ├─ (auth)/          # /login, /signup, /forgot-password
│  ├─ (resident)/      # /resident/{dashboard, requests, new-request, notifications}
│  ├─ (admin)/         # /admin/{dashboard, requests, schedule, routes, notifications, reports}
│  ├─ (collector)/     # /collector/{dashboard, tasks, route, notifications}
│  └─ auth/callback/   # Supabase OAuth + email-confirm callback
├─ components/
│  ├─ ui/              # shadcn primitives
│  ├─ layout/          # Navbar, Sidebar, DashboardShell, nav config
│  ├─ shared/          # StatsCard, RequestStatusBadge, etc.
│  └─ auth/            # AuthCard, GoogleButton
├─ lib/
│  ├─ supabase/        # SSR-safe Supabase clients (browser, server, middleware)
│  ├─ auth/            # Server helpers for the current profile + role gating
│  ├─ actions/         # Server actions grouped by domain
│  ├─ validations/     # zod schemas grouped by domain
│  ├─ maps/            # Nominatim geocoding + Google Maps route URL helpers
│  ├─ types/           # Generated database types
│  └─ utils.ts         # cn() helper (shadcn convention)
├─ stores/             # Zustand stores
└─ middleware.ts       # Session refresh + protected-route gating
```


## How to Run

### Prerequisites

* **Node.js 20+** and **pnpm 9+**
* A Supabase project (this repo is wired to one already; replace credentials in `.env.local` for your own)

### Setup

1. Clone and install:

   ```bash
   git clone <repo-url>
   cd MEL13-Pimpom
   pnpm install
   ```

2. Copy the env template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:

   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)

3. (Optional) Enable Google OAuth: in the Supabase dashboard under **Authentication → Providers → Google**, set the Client ID/Secret from a Google Cloud OAuth client. The app's callback URL is `<NEXT_PUBLIC_SITE_URL>/api/auth/callback`.

4. Run the dev server:

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

### Common scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint with `next lint` |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |

## Project Timeline

The project is developed within 12 weeks, including planning, design, development, testing, and final submission.

## Future Improvements

* Mobile version
* Real-time tracking with Supabase Realtime
* Smart scheduling suggestions based on past pickup data

## Author

Team MEL13-Pimpom

## License

This project is for educational purposes only.
