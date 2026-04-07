# CMS RBAC + Workflow Test README

Tai lieu nay tong hop bo test cho workflow bien tap va phan quyen theo role trong CMS.

## Muc tieu

- Dam bao day du cac action UI chinh:
  - Len cho duyet
  - Len cho xuat ban
  - Sua
  - Xoa
  - Tra ve kho
  - Tra ve cho xuat ban
- Dam bao phan quyen dung theo role va edge case.
- Dam bao cac transition workflow quan trong co test bao phu.

## Vai tro

- EDITOR_IN_CHIEF
- MANAGING_EDITOR
- TEAM_LEAD
- REPORTER_TRANSLATOR
- CONTRIBUTOR

## File test chinh

- tests/permissions-matrix.test.ts
  - Test ma tran quyen theo tung role:
    - canApprovePendingReview
    - canPublishNow
    - canSubmitPendingPublish
    - canViewAllPosts
    - canDeleteAnyMedia
    - canCreateSubordinateAccount
  - Test canEditByStatus cho cac trang thai:
    - DRAFT
    - PENDING_REVIEW
    - PENDING_PUBLISH
    - PUBLISHED
    - REJECTED
  - Test getAllowedSubmitActions theo role.
  - Test roleCanCreate edge cases.

- tests/workflow-edge-cases.test.ts
  - Test ton tai server actions cho cac transition can thiet.
  - Test edge case permission/ownership/not_found/redirect cho:
    - submitPostToPendingReview
    - promotePostToPendingPublish
    - returnPostToDraft
  - Test co day du label nut action tren UI Kho bai.
  - Test wiring action vao app/admin/page.tsx.

- tests/role-based-data.test.ts
  - Test data scoping theo role cho posts/personal/trash/media.
  - Test ownership guard trong server actions.

- tests/editorial-workflow.test.ts
  - Test wiring workflow giua actions va UI.

- tests/permission-and-auth.test.ts
  - Test encode/decode session.
  - Test auth guards o muc source assertions.

## Ma tran action theo role (tom tat)

- EDITOR_IN_CHIEF
  - Duoc: len cho duyet, len cho xuat ban, xuat ban, tra ve kho, tra ve cho xuat ban, sua, xoa tat ca.
- MANAGING_EDITOR
  - Duoc: len cho duyet, len cho xuat ban, xuat ban, tra ve kho, tra ve cho xuat ban, sua, xoa tat ca.
- TEAM_LEAD
  - Duoc: len cho duyet, len cho xuat ban, sua, xoa (trong pham vi bai cua minh & chua xuat ban).
  - Khong duoc: xuat ban, tra ve cho xuat ban, xoa bai/media cua nguoi khac.
- REPORTER_TRANSLATOR
  - Duoc: len cho duyet, sua, xoa (trong pham vi bai cua minh & chua xuat ban).
  - Khong duoc: len cho xuat ban, xuat ban, tra ve cho xuat ban, xoa bai/media cua nguoi khac.
- CONTRIBUTOR
  - Duoc: len cho duyet, sua, xoa (trong pham vi bai cua minh & chua xuat ban).
  - Khong duoc: view all posts, len cho xuat ban, xuat ban, tra ve cho xuat ban, xoa bai/media cua nguoi khac.

Luu y: Vi tri hien nut tren UI con phu thuoc vao trang thai bai va capability gate.

## Lenh chay test

Chay typecheck:

```bash
bun run typecheck
```

Chay toan bo test:

```bash
bun test
```

Chay rieng test ma tran role:

```bash
bun test tests/permissions-matrix.test.ts
```

Chay rieng test edge case workflow:

```bash
bun test tests/workflow-edge-cases.test.ts
```

## Ket qua hien tai

- 111 pass
- 0 fail

## Scope va gioi han

- Phan lon test hien tai la source assertions + matrix capability.
- Chua mock DB transaction chi tiet theo tung endpoint runtime.
- Neu can UAT gan san xuat, nen bo sung e2e test role-based click flow.
