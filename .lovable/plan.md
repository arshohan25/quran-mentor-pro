# Professional Admin Panel

A secure, role-gated admin dashboard at `/admin` to control users, content, settings, and view analytics across the app.

## 1. Secure roles foundation (database)

Create proper server-side role infrastructure (never trust client/localStorage for admin checks).

**Migration:**
- `app_role` enum: `admin`, `moderator`, `user`
- `user_roles` table: `id`, `user_id` (→ auth.users, cascade), `role app_role`, `assigned_at`, `assigned_by`; unique `(user_id, role)`; RLS enabled
- SECURITY DEFINER function `public.has_role(_user_id uuid, _role app_role) returns boolean` (avoids recursive RLS)
- RLS policies on `user_roles`:
  - Users can SELECT their own roles
  - Only admins can INSERT/UPDATE/DELETE (`has_role(auth.uid(),'admin')`)
- Bootstrap: insert `admin` role for the first registered user (or via SQL after you confirm your `user_id`)
- Tighten existing tables: add admin-override SELECT policies on `profiles`, `bookmarks_sync`, `hifz_srs`, `qaza_sync`, `recitation_sessions`, `recitation_word_stats`, `user_settings` so admins can read all rows

## 2. Auth + role hooks

- New `src/hooks/useUserRole.ts` — fetches current user's roles via `user_roles` select; exposes `isAdmin`, `isModerator`, `loading`
- New `src/components/admin/RequireAdmin.tsx` — route guard; redirects non-admins to `/` with a toast

## 3. Admin shell & navigation

- New layout `src/components/admin/AdminShell.tsx` using shadcn `Sidebar` (collapsible icon mode)
  - Sections: Dashboard, Users, Content, Recitation, Hadith QA, Settings, Logs
  - Persistent header with `SidebarTrigger`, breadcrumb, theme/lang switch, "Exit admin" button
- Route: `/admin/*` wrapped in `<RequireAdmin>`; nested routes for each section
- Hidden from `BottomNav`; entry point added in `AccountPage` (visible only when `isAdmin`)

## 4. Admin pages

**Dashboard (`/admin`)**
- KPI cards: total users (last 7/30d), active today, total recitation sessions, avg accuracy, total bookmarks, total hifz cards due
- Charts (recharts): signups over time, recitation accuracy trend, daily active users
- Recent activity feed (latest sessions / new users)

**Users (`/admin/users`)**
- Searchable, paginated table (shadcn `Table` + `Input`): email (from auth via edge function), display_name, role badges, created_at, last activity
- Row actions: view profile drawer, assign/remove roles (admin/moderator), reset display name, view their stats
- Bulk select + bulk role assign

**Content moderation (`/admin/content`)**
- Tabs: Bookmarks, Hifz cards, Qaza records
- Per-user filter, view/delete entries, export CSV

**Recitation analytics (`/admin/recitation`)**
- Aggregate accuracy trends, weakest words across all users, top reciters leaderboard, session count by surah heatmap

**Hadith QA logs (`/admin/ask`)**
- View `islamic-qa` edge function logs (via supabase analytics) — questions asked, response times, errors

**App settings (`/admin/settings`)**
- Global feature flags stored in a new `app_settings` table (singleton row, jsonb): toggle features (Sabina, Live recitation, AI Ask), default daily goal minutes, announcement banner text
- Banner reads from this table on `Index.tsx`

**Audit logs (`/admin/logs`)**
- New `audit_logs` table: `actor_id`, `action`, `target_type`, `target_id`, `metadata jsonb`, `created_at`
- Trigger inserts on role changes, content deletions
- Read-only filterable table

## 5. Edge function for admin-only operations

`supabase/functions/admin-users/index.ts` (verify_jwt = true)
- Verifies caller is admin via `has_role`
- Endpoints: `list_users` (paginated, joins auth.users emails using service role), `delete_user`, `set_role`
- Avoids exposing service role key client-side

## 6. Polish

- Consistent admin styling: denser table, status badges, skeleton loaders, empty states
- All destructive actions behind `AlertDialog` confirmation
- Toast feedback on every mutation
- Mobile-responsive (sidebar collapses to sheet)
- Bilingual labels (bn/en) using existing `useLanguage`

## Deliverables
- 1 migration (roles + audit + app_settings + admin-override policies)
- 1 edge function (`admin-users`)
- 1 hook (`useUserRole`)
- ~10 new components/pages under `src/components/admin/` and `src/pages/admin/`
- Updates to `App.tsx` (routes) and `AccountPage.tsx` (admin entry link)

## Security guarantees
- Roles stored in dedicated `user_roles` table (never on profiles)
- All admin checks via SECURITY DEFINER `has_role` function
- RLS enforces admin-only mutations server-side
- Service-role operations isolated to edge function with JWT verification
