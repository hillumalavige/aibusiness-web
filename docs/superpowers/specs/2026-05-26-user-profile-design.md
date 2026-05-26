# User Profile Page — Design Spec

**Date:** 2026-05-26  
**Status:** Approved  
**Scope:** Full profile editing — name, phone, email, and password change

---

## Overview

Add a `/profile` page where any authenticated user can update their personal details and change their password. The page is accessible by clicking the user's name in the top AppBar.

---

## Backend Changes

### 1. Extend `PUT /api/v1/me`

**File:** `app/Http/Controllers/Api/V1/MeController.php`

Add `email` to the accepted fields with uniqueness validation that ignores the current user:

```
'name'  => 'sometimes|string|max:255'
'phone' => 'sometimes|nullable|string|max:20'
'email' => 'sometimes|email|max:255|unique:users,email,{$user->id}'
```

Update `userPayload()` to include `phone` so the frontend can pre-fill it:

```php
return [
    'id'             => $user->id,
    'name'           => $user->name,
    'email'          => $user->email,
    'phone'          => $user->phone,
    'is_super_admin' => $user->is_super_admin,
];
```

### 2. Add `POST /api/v1/me/password`

**Method:** `MeController::changePassword()`

Validation:
```
'current_password'      => 'required|string'
'password'              => 'required|string|min:8|confirmed'
'password_confirmation' => 'required|string'
```

Logic:
1. Load authenticated user
2. `Hash::check($request->current_password, $user->password)` — return 422 with `"Current password is incorrect."` if it fails
3. `$user->update(['password' => Hash::make($request->password)])`
4. Return `$this->success(null, 'Password updated.')`

### 3. New Route

**File:** `routes/api.php` — inside the `v1` authenticated group:

```php
Route::post('me/password', [MeController::class, 'changePassword']);
```

---

## Frontend Changes

### New Files

#### `src/hooks/useProfile.ts`

Two mutations built on top of the existing API client:

**`useUpdateProfile()`**
- `useMutation` → `PUT /me` with `{ name, phone, email }`
- Response type: `{ data: User }` (same envelope as login)
- On success: call `useAuthStore.getState().setAuth(token, updatedUser)` to sync the AppBar name immediately
- Invalidates `['me']` React Query cache

**`useChangePassword()`**
- `useMutation` → `POST /me/password` with `{ current_password, password, password_confirmation }`
- On success: no store update needed (password not stored client-side)

#### `src/app/(app)/profile/page.tsx`

Client component. Layout follows the existing company edit page pattern (`maxWidth: 600`).

**Section 1 — Profile Info**

Heading: `Typography variant="h5"` — "Edit Profile"

Fields:
- Name (required TextField)
- Email (required TextField, type="email")
- Phone (optional TextField)

Pre-filled from `useMe()` hook on mount (same hook already used in the app). While loading, show `CircularProgress`.

Success alert: "Profile updated." (dismissible)  
Error alert: "Failed to update profile. Please try again."  
Save button disabled while `isPending`.

**Section 2 — Change Password**

Separated by a `<Divider sx={{ my: 4 }} />` — matches the company edit page's module section separator.

Heading: `Typography variant="h6"` — "Change Password"

Fields:
- Current password (required, type="password")
- New password (required, type="password", min 8 chars)
- Confirm new password (required, type="password")

Client-side validation: new password and confirm must match before submitting.

Success alert: "Password updated." (dismissible) — form fields reset on success  
Error alert: "Current password is incorrect." (surfaced from API 422) or generic fallback  
Update button disabled while `isPending`.

### Modified Files

#### `src/store/auth.ts`

Add `phone` to the `User` interface:
```ts
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_super_admin: boolean;
}
```

#### `src/components/AppShell.tsx`

Wrap the existing user name `Typography` in a `Next.js Link` pointing to `/profile`:

```tsx
import Link from 'next/link';
// ...
{userName && (
  <Typography
    component={Link}
    href="/profile"
    variant="body2"
    sx={{ mr: 2, opacity: 0.9, color: 'inherit', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  >
    {userName}
  </Typography>
)}
```

---

## Data Flow

```
User edits profile fields → clicks Save Profile
  → useUpdateProfile.mutate({ name, phone, email })
  → PUT /api/v1/me
  → Backend validates + updates user
  → Response: { success, message, data: { id, name, email, phone, is_super_admin } }
  → useAuthStore.setAuth(token, updatedUser)   ← AppBar name updates instantly
  → ['me'] query invalidated                  ← useMe() hook refreshes
  → Success alert shown

User fills password fields → clicks Update Password
  → client validates new === confirm
  → useChangePassword.mutate({ current_password, password, password_confirmation })
  → POST /api/v1/me/password
  → Backend: Hash::check → update password
  → On success: form reset, success alert
  → On 422: "Current password is incorrect." error alert
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Profile save network error | Generic error alert, form stays filled |
| Email already taken | API returns 422; show "Email is already taken." |
| Wrong current password | API returns 422; show "Current password is incorrect." |
| New password < 8 chars | Client-side validation before submit |
| New password ≠ confirm | Client-side validation before submit |

---

## Testing

**Backend (PHPUnit):**
- `test_user_can_update_name_and_email` — PUT /me with valid data
- `test_email_must_be_unique` — PUT /me with another user's email → 422
- `test_user_can_change_password` — POST /me/password with correct current password
- `test_wrong_current_password_returns_422` — POST /me/password with wrong current_password

**Frontend (Jest + React Testing Library):**
- Profile form pre-fills with data from `useMe()`
- Save Profile calls `useUpdateProfile.mutate` with correct payload
- Success alert shown after save
- Password form: client validation rejects mismatched passwords
- Password form: resets after successful submit
- Error alert shown on API failure

---

## Files Changed Summary

| File | Change |
|---|---|
| `app/Http/Controllers/Api/V1/MeController.php` | Extend update(), add changePassword(), add phone to userPayload() |
| `routes/api.php` | Add `POST me/password` route |
| `src/store/auth.ts` | Add `phone` to User interface |
| `src/hooks/useProfile.ts` | New — useUpdateProfile, useChangePassword |
| `src/app/(app)/profile/page.tsx` | New — profile page |
| `src/components/AppShell.tsx` | Wrap user name in Link to /profile |
