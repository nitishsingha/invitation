# Security Specification — Universal Digital Invitation Platform

## 1. Data Invariants

1. **User Isolation**: Every `/users/{userId}` document is readable and writable only by the matching authenticated `request.auth.uid` with `email_verified == true`.
2. **Invitation Ownership**: Every `/invitations/{invitationId}` document belongs to an immutable `userId == request.auth.uid`; non-owners cannot read, list, update, or delete invitations.
3. **Photo Cap Enforcement**: An invitation's `images` list is strictly bounded to `size() <= 5`.
4. **PII Isolation**: Guest phone numbers (`phone`) are stored exclusively inside `/invitations/{invitationId}/guests/{guestId}` and are never copied into `/guestInvites/{token}`.
5. **Token-Gated Receiver Access**: Unauthenticated receivers can `get` `/guestInvites/{token}` only when they know the exact random token ID and `isActive == true`. `allow list` on `/guestInvites` requires `request.auth.uid == resource.data.ownerId`.
6. **Immutable Snapshot & Constrained Receiver Actions**: Unauthenticated receivers may only (a) record first-open / increment `openCount` by 1 and (b) submit an RSVP (`accepted | declined | maybe`) when `rsvpEnabled == true`. They cannot alter `ownerId`, `guestName`, `invitationSnapshot`, or `isActive`.

## 2. Adversarial Test Payloads ("Dirty Dozen")

1. **Identity Spoofing on Invitation Create**: `userId` set to another user's UID -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: Extra key `isAdmin: true` on `/users/{uid}` or `/invitations/{id}` -> `PERMISSION_DENIED`.
3. **Oversized Photo Array**: `images` array with 6 elements -> `PERMISSION_DENIED`.
4. **Unauthenticated List Scraping on `/guestInvites`**: `getDocs(collection(db, 'guestInvites'))` without auth -> `PERMISSION_DENIED`.
5. **Cross-Owner Guest List Read**: Signed-in User B reading `/invitations/{invA}/guests` -> `PERMISSION_DENIED`.
6. **Inactive Token Access**: Unauthenticated `getDoc` on `/guestInvites/{revokedToken}` where `isActive == false` -> `PERMISSION_DENIED`.
7. **Receiver Tampering with Snapshot**: Unauthenticated update modifying `invitationSnapshot` or `guestName` on `/guestInvites/{token}` -> `PERMISSION_DENIED`.
8. **RSVP Bypass When Disabled**: Unauthenticated update setting `rsvpStatus: 'accepted'` when `rsvpEnabled == false` -> `PERMISSION_DENIED`.
9. **First-Open Overwrite**: Unauthenticated update trying to overwrite an existing non-null `firstOpenedAt` -> `PERMISSION_DENIED`.
10. **ID Poisoning**: Document creation with 1,500-character ID or invalid characters (`../foo`) -> `PERMISSION_DENIED`.
11. **Timestamp Forgery**: `createdAt` set to a client-chosen past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
12. **Unverified Email Write**: Authenticated user with `email_verified == false` attempting to create an invitation -> `PERMISSION_DENIED`.
