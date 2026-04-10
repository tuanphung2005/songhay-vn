Implement Phase 1: Security and Stability Hardening — the goal is to address critical security gaps and data integrity issues across public API routes, user password management, user account creation UX, media deletion, and navigation category synchronization.

**Task 1.1 — Rate Limiting on Public API Routes (`lib/rate-limit.ts`)**
- Create a rate limiting utility using a sliding window algorithm backed by an in-memory `Map` storage
- Add an IP extraction helper that reads the `x-forwarded-for` header for proxy deployments
- Apply the rate limiter to the following routes with their respective limits:
  - `POST /api/comments`: 5 requests/minute per IP
  - `POST /api/posts/[id]/view`: 30 requests/minute per IP
  - `POST /api/posts/[id]/engagement`: 10 requests/minute per IP
- Return HTTP 429 status with a `Retry-After` header when the limit is exceeded

**Task 1.2 — Password Management (`app/admin/actions/settings.ts`, `components/admin/settings-password-tab.tsx`)**
- Create an `updateOwnPassword` server action in `app/admin/actions/settings.ts` that accepts the current password and a new password for self-service changes
- Use `verifyPassword` from `lib/password.ts` to verify the current password before allowing the self-service update
- Create a `resetUserPassword` server action for EDITOR_IN_CHIEF to set new passwords for other users (no current password required)
- Add a permission check in `resetUserPassword` using `requireEditorInChiefUser()` and prevent resetting passwords of users with equal or higher roles
- Update `components/admin/settings-password-tab.tsx` to render a self-service password form for all users
- Add an admin password reset section in `settings-password-tab.tsx` visible only to users with `canCreateSubordinateAccount` permission, including a user selector dropdown
- Remove the existing account creation form from `settings-password-tab.tsx` (it is being moved to the users tab in Task 1.3)

**Task 1.3 — Create New User Form in Users Tab (`components/admin/settings-users-tab.tsx`)**
- Update `components/admin/settings-users-tab.tsx` to include a "Create New User" form placed above or below the users table
- Reuse the existing `createSubordinateAccount` server action from `app/admin/actions/settings.ts`
- Gate the create form visibility with the `canCreateSubordinateAccount` prop, matching the current password tab logic
- Include fields: name, email, role selector (MANAGING_EDITOR, TEAM_LEAD, REPORTER_TRANSLATOR, CONTRIBUTOR), and initial password
- Add success feedback that refreshes the user list to show the newly created account

**Task 1.4 — Cloudinary Asset Cleanup on Media Deletion (`lib/cloudinary.ts`, `api/media/[id]`)**
- Add a `deleteCloudinaryAsset(publicId)` function in `lib/cloudinary.ts` using the Cloudinary Admin API
- Add a `public_id` column to the `MediaAsset` Prisma model and generate a migration
- Update the `DELETE /api/media/[id]` handler to call `deleteCloudinaryAsset` before removing the DB record
- Handle Cloudinary API errors gracefully: log errors but do not block the DB deletion

**Task 1.5 — Synchronize Navigation Categories with Database (`lib/categories.ts`, `lib/queries.ts`, `SiteHeader`, `MobileNav`)**
- Deprecate the static `NAV_CATEGORIES` constant in `lib/categories.ts`
- Update `getNavCategories()` in `lib/queries.ts` to query and return the full category tree with parent/child relationships from the database
- Update the `SiteHeader` and `MobileNav` components to consume the dynamic category data from `getNavCategories()`
- Add a fallback to cached categories if the DB query fails

Implement Phase 2: Performance Optimization — the goal is to improve response times and reduce database load through Next.js native caching, query optimization, on-demand ISR revalidation, and lazy loading of non-critical components.

**Task 2.1 — Migrate to Next.js Native Caching (`lib/queries.ts`, `lib/data-cache.ts`, `app/admin/actions/`)**
- Refactor all queries in `lib/queries.ts` to use `unstable_cache()` with semantic cache tags such as `posts`, `categories`, and `homepage`
- After mutations in Server Actions under `app/admin/actions/` (post create/update, category changes), call `revalidateTag()` with the appropriate tag
- Remove or repurpose `lib/data-cache.ts` to only handle non-cacheable dynamic queries
- Set TTLs per query type: homepage = 60s, categories = 300s, post detail = 600s

**Task 2.2 — Optimize Database Queries and Add Missing Indexes (Prisma schema + admin data loaders)**
- Add a composite index on `Post(editorialStatus, isDeleted, publishedAt)` for posts tab filtering
- Add an index on `Post(authorId, editorialStatus)` for personal archive queries
- Add an index on `Comment(postId, isApproved)` for approved comment fetching
- Review admin data loaders for N+1 query patterns and resolve them with appropriate `include` statements

**Task 2.3 — On-Demand ISR Revalidation (`app/admin/actions/`)**
- Add `revalidatePath()` calls inside the `publishPost`, `unpublishPost`, and `updatePost` server actions to target affected routes
- On publish, revalidate: `/` (homepage), `/[category]` (category pages), `/[category]/[slug]` (post pages)
- Reduce static `revalidate` values in page configs since on-demand revalidation handles freshness
- Add `revalidatePath()` calls to `createCategory`, `updateCategory`, and `deleteCategory` actions

**Task 2.4 — Lazy Load Non-Critical Homepage Components**
- Wrap `LunarCalendarWidget`, `BmiWidget`, `BioAgeWidget`, and `BabyNameWidget` using `dynamic()` with `{ ssr: false }`
- Add loading skeleton components for each deferred widget
- Add `Suspense` boundaries around the recommended posts and most-watched videos sections
- Move AdSense initialization to use `requestIdleCallback` or an `IntersectionObserver`

Implement Phase 3: Editorial Workflow Enhancements — the goal is to add high-value CMS features including scheduled publishing, in-app notifications, bulk post operations, and content revision comparison.

**Task 3.1 — Scheduled Publishing (Prisma schema, write/edit form, `/api/cron/publish-scheduled`)**
- Add a `scheduledPublishAt` DateTime field to the `Post` model in the Prisma schema and generate a migration
- Add a datetime picker to the write/edit form sidebar, visible only when the user has publish permission
- Create a `/api/cron/publish-scheduled` endpoint suitable for Vercel Cron or an external trigger that publishes eligible posts
- Update post queries to exclude future-scheduled posts from all public views

**Task 3.2 — Workflow Status Change Notifications (`app/admin/actions/workflow.ts`, admin header)**
- Create a `Notification` Prisma model with fields: `userId`, `type`, `message`, `postId`, `isRead`, `createdAt`; generate a migration
- In `app/admin/actions/workflow.ts`, add notification creation logic when posts are approved, rejected, or published
- Create a notification bell component in the admin header that displays the unread notification count
- Add a notifications dropdown/panel with mark-as-read functionality

**Task 3.3 — Bulk Post Operations (`posts-tab/index.tsx`, `app/admin/actions/posts.ts`)**
- Add a checkbox column with a select-all header to the posts table in `posts-tab/index.tsx`
- Create a bulk action bar component that shows the selected count and available actions (trash, status change)
- Implement `bulkTrashPosts` and `bulkUpdateStatus` server actions in `app/admin/actions/posts.ts`
- Add a confirmation dialog for destructive bulk operations

**Task 3.4 — Content Revision Comparison (`PostHistory`, history tab)**
- Extend `PostHistory` to capture full content snapshots on every edit, not only on status changes
- Create a revision comparison view accessible from the history tab
- Implement a side-by-side diff view using a lightweight diff library
- Add a "Restore this version" action that reverts a post to a selected snapshot

Implement Phase 4: SEO and Discoverability Improvements — the goal is to complete missing meta tag implementations, add structured data, support canonical URL overrides, and enhance the sitemap.

**Task 4.1 — Missing Meta Tags and OpenGraph Properties (page `Metadata` objects)**
- Add `<meta name="keywords">` rendering in page `Metadata` objects using the existing `seoKeywords` field
- Add `og:locale` set to `vi_VN` across all page metadata
- Add `article:author` and `article:tag` OpenGraph properties specifically for post pages
- Populate `twitter:creator` when the post author has a Twitter handle

**Task 4.2 — BreadcrumbList Structured Data (`components/seo/BreadcrumbJsonLd`)**
- Create a `BreadcrumbJsonLd` component in `components/seo/`
- Generate the breadcrumb trail in the order: Home → Category → (Subcategory) → Post title
- Add this component to category pages and post pages
- Follow the schema.org `BreadcrumbList` specification using an `itemListElement` array

**Task 4.3 — Canonical URL Override in Admin (`Post` model, write/edit form, `Metadata` generation)**
- Add an optional `canonicalUrl` field to the `Post` Prisma model and generate a migration
- Add a canonical URL input field to the SEO fields section of the write/edit form
- Update `Metadata` generation to use the custom `canonicalUrl` when it is provided
- Validate that the canonical URL is a valid absolute URL

**Task 4.4 — Sitemap Improvements (sitemap implementation)**
- Add `<image:image>` entries for posts that have thumbnails
- Add the `<news:news>` namespace for Google News eligibility
- Split the sitemap into a sitemap index + multiple sitemaps when the post count exceeds 10,000
- Add `<lastmod>` to category pages derived from the most recent post in that category

Implement Phase 5: Testing and Developer Experience — the goal is to establish an E2E test suite, expose a versioned REST API for external integrations, and add database integration tests.

**Task 5.1 — Database Integration Tests (Prisma test setup, server action tests)**
- Create a test database setup script using Prisma with a test seed
- Write integration tests for the `createPost`, `updatePost`, and `trashPost` server actions
- Write integration tests that verify permission enforcement in workflow transitions
- Add transaction rollback tests to cover concurrent operation scenarios