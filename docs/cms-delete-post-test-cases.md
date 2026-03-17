# CMS Trash/Delete Post - Edge Case Test Plan

## Scope
- Feature: Move post to trash, restore, and permanent delete from CMS tabs `Kho bài` + `Thùng rác`.
- Expected backend behavior:
  - Move to trash: post hidden from public pages and admin active list.
  - Restore: post returns to active list.
  - Permanent delete: post and related comments removed.

## Preconditions
- Admin account exists and can log in.
- At least 3 posts available:
  - Post A: published + has comments
  - Post B: featured/trending + has thumbnail
  - Post C: draft (isPublished=false)

## Functional Tests
1. Move a normal published post to trash
- Steps:
  1. Open `/admin?tab=posts`
  2. Click `Chuyển vào thùng rác` on Post A
- Expected:
  - Confirmation dialog appears.
  - On confirm, row disappears from active list and appears in `/admin?tab=trash`.
  - Opening old URL `/category/slug-of-post-a` returns not found page.

2. Move featured/trending post to trash
- Steps:
  1. Move Post B to trash
  2. Open homepage
- Expected:
  - Post B no longer appears in featured/trending blocks.
  - No broken links/cards in home sections.

3. Move draft post to trash
- Steps:
  1. Move Post C (isPublished=false) to trash.
- Expected:
  - Post removed successfully.
  - No side effect in public pages.

4. Restore post from trash
- Steps:
  1. Open `/admin?tab=trash`
  2. Click `Khôi phục` for a trashed post
- Expected:
  - Post returns to `/admin?tab=posts`
  - Public visibility follows its publish status.

5. Permanent delete post from trash
- Steps:
  1. Open `/admin?tab=trash`
  2. Click `Xóa vĩnh viễn`
- Expected:
  - Confirmation dialog appears.
  - Post removed completely from DB.

6. Delete post with comments
- Steps:
  1. Ensure post has approved + pending comments.
  2. Move post to trash then permanently delete.
- Expected:
  - After permanent delete, related comments are removed (cascade delete).
  - Comments tab should not show orphan pending comments.

## Authorization & Security Tests
7. Non-admin cannot delete or restore
- Steps:
  1. Login with USER role (or no session).
  2. Try invoking trash/restore/permanent-delete action.
- Expected:
  - Access denied/redirected.
  - Post remains unchanged.

8. Missing postId
- Steps:
  1. Submit delete action without `postId` (tampered form).
- Expected:
  - Request ignored safely.
  - No crash, no deletion.

9. Invalid postId
- Steps:
  1. Submit with non-existent postId.
- Expected:
  - No crash.
  - No deletion.

## Data Integrity Tests
10. Revalidate behavior after move to trash
- Steps:
  1. Delete a post.
  2. Immediately open:
     - `/`
     - `/admin?tab=posts`
     - `/{categorySlug}`
     - `/{categorySlug}/{slug}`
- Expected:
  - Deleted post not visible in list pages.
  - Detail route invalid.

11. Concurrent deletion/race
- Steps:
  1. Open CMS in 2 tabs.
  2. Delete same post almost simultaneously.
- Expected:
  - First deletion succeeds.
  - Second request handled gracefully (no crash).

## UX Tests
12. Confirm dialog behavior
- Steps:
  1. Click `Chuyển vào thùng rác` then choose Cancel.
  2. Click `Xóa vĩnh viễn` then choose Cancel.
- Expected:
  - No action executed when canceled.

13. Editor to post lifecycle
- Steps:
  1. Create a post using CKEditor with text formatting.
  2. Verify render on public page.
  3. Move that post to trash.
  4. Restore post.
  5. Move to trash again and permanently delete.
- Expected:
    - Formatting renders correctly before delete.
    - Restored post is accessible again.
    - Content inaccessible after permanent delete.

## Regression Checks
11. Other CMS actions still work after delete feature
- Update SEO/flags still works.
- Create category still works.
- Create post still works.
- Comment moderation still works.

## Optional Automation Ideas
- Add Playwright E2E:
  - login-admin.spec
  - create-post.spec
  - delete-post.spec
  - unauthorized-delete.spec
