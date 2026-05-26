# User Profile Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/profile` page where any authenticated user can edit their name, email, phone, and change their password, with the AppBar username linking to it.

**Architecture:** Two independent backend endpoints (`PUT /me` extended for profile fields, `POST /me/password` for credentials) feed two separate form sections on a single frontend page. Profile changes update Zustand auth store immediately so the AppBar name reflects changes without a reload.

**Tech Stack:** Laravel 11 (PHPUnit, Hash, Sanctum), Next.js 14, TypeScript, MUI v9, React Query (@tanstack/react-query), Zustand

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/Http/Controllers/Api/V1/MeController.php` | Modify | Add email to update(), add changePassword(), add phone to userPayload() |
| `routes/api.php` | Modify | Register POST me/password route |
| `tests/Feature/Auth/AuthTest.php` | Modify | Add 5 new backend test cases |
| `src/store/auth.ts` | Modify | Add `phone` field to User interface |
| `src/store/auth.test.ts` | Modify | Update mockUser to include phone |
| `src/hooks/useProfile.ts` | Create | useUpdateProfile and useChangePassword mutations |
| `src/hooks/useProfile.test.ts` | Create | Tests for both mutations |
| `src/app/(app)/profile/page.tsx` | Create | Profile page with two form sections |
| `src/app/(app)/profile/page.test.tsx` | Create | Tests for profile page behaviour |
| `src/components/AppShell.tsx` | Modify | Wrap username in Link to /profile |
| `src/components/AppShell.test.tsx` | Modify | Assert username links to /profile |

---

## Task 1: Backend — extend PUT /me to accept email, expose phone

**Files:**
- Modify: `app/Http/Controllers/Api/V1/MeController.php`
- Modify: `tests/Feature/Auth/AuthTest.php`

- [ ] **Step 1: Write failing tests**

Add these four test methods to `tests/Feature/Auth/AuthTest.php` inside the `AuthTest` class:

```php
public function test_me_returns_phone_in_payload(): void
{
    $user = User::where('email', 'admin@demo.test')->first();
    $user->update(['phone' => '+94 77 123 4567']);

    $this->actingAs($user)
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.user.phone', '+94 77 123 4567');
}

public function test_user_can_update_email(): void
{
    $user = User::where('email', 'admin@demo.test')->first();

    $this->actingAs($user)
        ->putJson('/api/v1/me', ['email' => 'newemail@demo.test'])
        ->assertOk()
        ->assertJsonPath('data.email', 'newemail@demo.test');

    $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'newemail@demo.test']);
}

public function test_user_can_keep_own_email_on_update(): void
{
    $user = User::where('email', 'admin@demo.test')->first();

    // Sending own email should NOT trigger a uniqueness error
    $this->actingAs($user)
        ->putJson('/api/v1/me', ['email' => 'admin@demo.test'])
        ->assertOk()
        ->assertJsonPath('data.email', 'admin@demo.test');
}

public function test_email_must_be_unique_on_update(): void
{
    $user = User::where('email', 'admin@demo.test')->first();
    // admin@platform.test is a different user (super admin seeded)
    $this->actingAs($user)
        ->putJson('/api/v1/me', ['email' => 'admin@platform.test'])
        ->assertStatus(422);
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test --filter="test_me_returns_phone_in_payload|test_user_can_update_email|test_user_can_keep_own_email_on_update|test_email_must_be_unique_on_update" 2>&1 | tail -15
```

Expected: 4 failures (phone not in payload, email not accepted).

- [ ] **Step 3: Update MeController**

Replace the entire `MeController.php` with:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MeController extends BaseApiController
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'user'      => $this->userPayload($user),
            'companies' => $this->companiesPayload($user),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return $this->success($this->userPayload($user->fresh()), 'Profile updated.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password'      => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return $this->error('Current password is incorrect.', 422, 'WRONG_PASSWORD');
        }

        $user->update(['password' => Hash::make($request->password)]);

        return $this->success(null, 'Password updated.');
    }

    public function companies(Request $request): JsonResponse
    {
        return $this->success($this->companiesPayload($request->user()));
    }

    public function switchCompany(Request $request): JsonResponse
    {
        $request->validate([
            'company_id' => 'required|integer|exists:companies,id',
        ]);

        $user    = $request->user();
        $company = Company::find($request->company_id);

        if (! $user->belongsToCompany($company)) {
            return $this->forbidden('You do not have access to this company.');
        }

        if (! $company->status->canUsePlatform()) {
            return $this->error('Company is not active.', 403, 'COMPANY_INACTIVE');
        }

        $company->load('activeModules');

        $isDefault = (bool) $user->companies()
            ->where('companies.id', $company->id)
            ->first()?->pivot->is_default;

        return $this->success([
            'id'              => $company->id,
            'name'            => $company->name,
            'slug'            => $company->slug,
            'status'          => $company->status->value,
            'enabled_modules' => $company->activeModules->pluck('key'),
            'is_default'      => $isDefault,
        ]);
    }

    // ── Private helpers ──────────────────────────────────────────────

    private function userPayload(\App\Models\User $user): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'phone'          => $user->phone,
            'is_super_admin' => $user->is_super_admin,
        ];
    }

    private function companiesPayload(\App\Models\User $user): \Illuminate\Support\Collection
    {
        return $user->activeCompanies()
            ->with('activeModules')
            ->get()
            ->map(fn ($company) => [
                'id'              => $company->id,
                'name'            => $company->name,
                'slug'            => $company->slug,
                'status'          => $company->status->value,
                'enabled_modules' => $company->activeModules->pluck('key'),
                'is_default'      => (bool) $company->pivot->is_default,
            ]);
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test --filter="test_me_returns_phone_in_payload|test_user_can_update_email|test_user_can_keep_own_email_on_update|test_email_must_be_unique_on_update" 2>&1 | tail -10
```

Expected: 4 tests pass.

- [ ] **Step 5: Run full backend suite to catch regressions**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness
git add app/Http/Controllers/Api/V1/MeController.php tests/Feature/Auth/AuthTest.php
git commit -m "feat: extend PUT /me to accept email + expose phone in user payload"
```

---

## Task 2: Backend — add POST /me/password endpoint

**Files:**
- Modify: `routes/api.php`
- Modify: `tests/Feature/Auth/AuthTest.php`

(MeController already has `changePassword()` from Task 1 — just needs the route.)

- [ ] **Step 1: Write failing tests**

Add these three test methods to `tests/Feature/Auth/AuthTest.php`:

```php
public function test_user_can_change_password(): void
{
    $user = User::where('email', 'admin@demo.test')->first();

    $this->actingAs($user)
        ->postJson('/api/v1/me/password', [
            'current_password'      => 'password',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Password updated.');

    // Verify new password actually works
    $this->postJson('/api/v1/auth/login', [
        'email'    => 'admin@demo.test',
        'password' => 'newpassword123',
    ])->assertOk();
}

public function test_wrong_current_password_returns_422(): void
{
    $user = User::where('email', 'admin@demo.test')->first();

    $this->actingAs($user)
        ->postJson('/api/v1/me/password', [
            'current_password'      => 'wrongpassword',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'WRONG_PASSWORD');
}

public function test_new_password_must_be_at_least_8_chars(): void
{
    $user = User::where('email', 'admin@demo.test')->first();

    $this->actingAs($user)
        ->postJson('/api/v1/me/password', [
            'current_password'      => 'password',
            'password'              => 'short',
            'password_confirmation' => 'short',
        ])
        ->assertStatus(422);
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test --filter="test_user_can_change_password|test_wrong_current_password_returns_422|test_new_password_must_be_at_least_8_chars" 2>&1 | tail -10
```

Expected: 3 failures (route not found — 404).

- [ ] **Step 3: Register the route**

In `routes/api.php`, inside the `Route::prefix('v1')->middleware('auth:sanctum')` group, add the new route after `Route::post('me/switch-company', ...)`:

```php
Route::post('me/password', [MeController::class, 'changePassword']);
```

The full authenticated group should look like:

```php
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get ('me',                [MeController::class, 'show']);
    Route::put ('me',                [MeController::class, 'update']);
    Route::get ('me/companies',      [MeController::class, 'companies']);
    Route::post('me/switch-company', [MeController::class, 'switchCompany']);
    Route::post('me/password',       [MeController::class, 'changePassword']);
});
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test --filter="test_user_can_change_password|test_wrong_current_password_returns_422|test_new_password_must_be_at_least_8_chars" 2>&1 | tail -10
```

Expected: 3 tests pass.

- [ ] **Step 5: Run full backend suite**

```bash
cd /home/priyadarshana/Project/aibusiness
php artisan test 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness
git add routes/api.php tests/Feature/Auth/AuthTest.php
git commit -m "feat: add POST /me/password endpoint for password change"
```

---

## Task 3: Frontend — add phone to User type

**Files:**
- Modify: `src/store/auth.ts`
- Modify: `src/store/auth.test.ts`

- [ ] **Step 1: Update User interface in auth.ts**

In `src/store/auth.ts`, change the `User` interface from:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
}
```

to:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_super_admin: boolean;
}
```

- [ ] **Step 2: Update mockUser in auth.test.ts**

In `src/store/auth.test.ts`, change `mockUser` from:

```ts
const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  is_super_admin: false,
};
```

to:

```ts
const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  phone: null,
  is_super_admin: false,
};
```

- [ ] **Step 3: Run frontend tests**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest --no-coverage 2>&1 | tail -8
```

Expected: all tests pass (TypeScript should be happy with the added field).

- [ ] **Step 4: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness-web
git add src/store/auth.ts src/store/auth.test.ts
git commit -m "feat: add phone field to User type in auth store"
```

---

## Task 4: Frontend — useProfile hooks

**Files:**
- Create: `src/hooks/useProfile.ts`
- Create: `src/hooks/useProfile.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useProfile.test.ts`:

```ts
// src/hooks/useProfile.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUpdateProfile, useChangePassword } from './useProfile';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { put: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  act(() => {
    useAuthStore.setState({
      token: 'tok_abc',
      user: { id: 1, name: 'Alice', email: 'alice@example.com', phone: null, is_super_admin: false },
      activeCompany: null,
    });
  });
});

describe('useUpdateProfile', () => {
  it('calls PUT /me and updates auth store on success', async () => {
    const updatedUser = { id: 1, name: 'Alice Updated', email: 'alice@new.com', phone: '+1 555 0000', is_super_admin: false };
    // Backend envelope: { success, message, data: User }
    // Axios wraps in r.data, so mock returns { data: { data: updatedUser } }
    mockedApi.put.mockResolvedValue({ data: { data: updatedUser } });

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: 'Alice Updated', email: 'alice@new.com', phone: '+1 555 0000' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/me', {
      name: 'Alice Updated',
      email: 'alice@new.com',
      phone: '+1 555 0000',
    });

    // Auth store should be updated with new user data
    const { user } = useAuthStore.getState();
    expect(user?.name).toBe('Alice Updated');
    expect(user?.email).toBe('alice@new.com');
  });

  it('does not update auth store on failure', async () => {
    mockedApi.put.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    act(() => {
      result.current.mutate({ name: 'Alice Updated', email: 'alice@new.com', phone: null });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Auth store user name should be unchanged
    expect(useAuthStore.getState().user?.name).toBe('Alice');
  });
});

describe('useChangePassword', () => {
  it('calls POST /me/password with correct payload', async () => {
    mockedApi.post.mockResolvedValue({ data: { success: true, message: 'Password updated.', data: null } });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    act(() => {
      result.current.mutate({
        current_password: 'oldpass',
        password: 'newpass123',
        password_confirmation: 'newpass123',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/me/password', {
      current_password: 'oldpass',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    });
  });

  it('surfaces error on wrong current password', async () => {
    mockedApi.post.mockRejectedValue({ response: { status: 422, data: { message: 'Current password is incorrect.' } } });

    const { result } = renderHook(() => useChangePassword(), { wrapper });

    act(() => {
      result.current.mutate({
        current_password: 'wrongpass',
        password: 'newpass123',
        password_confirmation: 'newpass123',
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest useProfile --no-coverage 2>&1 | tail -10
```

Expected: fail — module not found.

- [ ] **Step 3: Create useProfile.ts**

Create `src/hooks/useProfile.ts`:

```ts
// src/hooks/useProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore, User } from '@/store/auth';

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<User, Error, UpdateProfileInput>({
    mutationFn: (input) =>
      api
        .put<{ data: User }>('/me', input)
        .then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      // Sync AppBar name immediately — no page reload needed
      const { token, setAuth } = useAuthStore.getState();
      if (token) setAuth(token, updatedUser);
      // Invalidate useMe() so any other consumers refresh
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordInput>({
    mutationFn: (input) =>
      api
        .post('/me/password', input)
        .then(() => undefined),
  });
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest useProfile --no-coverage 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness-web
git add src/hooks/useProfile.ts src/hooks/useProfile.test.ts
git commit -m "feat: add useUpdateProfile and useChangePassword hooks"
```

---

## Task 5: Frontend — profile page

**Files:**
- Create: `src/app/(app)/profile/page.tsx`
- Create: `src/app/(app)/profile/page.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/app/(app)/profile/page.test.tsx`:

```tsx
// src/app/(app)/profile/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './page';
import * as meHooks from '@/hooks/useMe';
import * as profileHooks from '@/hooks/useProfile';

jest.mock('@/hooks/useMe');
jest.mock('@/hooks/useProfile');

const mockMe = meHooks as jest.Mocked<typeof meHooks>;
const mockProfile = profileHooks as jest.Mocked<typeof profileHooks>;

const mockMutate = jest.fn();
const mockPasswordMutate = jest.fn();

const mockUser = {
  id: 1, name: 'Alice', email: 'alice@example.com', phone: '+1 555 0000', is_super_admin: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockMe.useMe.mockReturnValue({ data: mockUser, isLoading: false } as any);
  mockProfile.useUpdateProfile.mockReturnValue({
    mutate: mockMutate, isPending: false, isError: false, isSuccess: false,
  } as any);
  mockProfile.useChangePassword.mockReturnValue({
    mutate: mockPasswordMutate, isPending: false, isError: false, isSuccess: false,
  } as any);
});

describe('ProfilePage', () => {
  it('shows loading spinner while fetching user', () => {
    mockMe.useMe.mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<ProfilePage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('pre-fills form fields with current user data', () => {
    render(<ProfilePage />);
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1 555 0000')).toBeInTheDocument();
  });

  it('calls useUpdateProfile mutate with form values on save', () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alice Updated' }),
      expect.any(Object),
    );
  });

  it('shows success alert after profile save', async () => {
    mockProfile.useUpdateProfile.mockReturnValue({
      mutate: (_input: any, opts: any) => opts?.onSuccess?.(),
      isPending: false, isError: false, isSuccess: false,
    } as any);
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(screen.getByText(/profile updated/i)).toBeInTheDocument());
  });

  it('shows error alert when profile save fails', () => {
    mockProfile.useUpdateProfile.mockReturnValue({
      mutate: mockMutate, isPending: false, isError: true, isSuccess: false,
    } as any);
    render(<ProfilePage />);
    expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
  });

  it('rejects password change when new passwords do not match', () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockPasswordMutate).not.toHaveBeenCalled();
  });

  it('calls useChangePassword mutate with correct payload', () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(mockPasswordMutate).toHaveBeenCalledWith(
      { current_password: 'oldpass', password: 'newpass123', password_confirmation: 'newpass123' },
      expect.any(Object),
    );
  });

  it('shows success alert and resets password fields after password change', async () => {
    mockProfile.useChangePassword.mockReturnValue({
      mutate: (_input: any, opts: any) => opts?.onSuccess?.(),
      isPending: false, isError: false, isSuccess: false,
    } as any);
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(screen.getByText(/password updated/i)).toBeInTheDocument());
    // Fields should be reset
    expect(screen.getByLabelText(/current password/i)).toHaveValue('');
  });

  it('shows error alert when password change fails', () => {
    mockProfile.useChangePassword.mockReturnValue({
      mutate: mockPasswordMutate, isPending: false, isError: true, isSuccess: false,
    } as any);
    render(<ProfilePage />);
    expect(screen.getByText(/failed to update password/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest "profile/page" --no-coverage 2>&1 | tail -10
```

Expected: fail — module not found.

- [ ] **Step 3: Create the profile page**

Create `src/app/(app)/profile/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMe } from '@/hooks/useMe';
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <ProfileForm user={user} />
      <Divider sx={{ my: 4 }} />
      <PasswordForm />
    </Box>
  );
}

// ── Profile section ──────────────────────────────────────────────────────────

function ProfileForm({ user }: { user?: { name: string; email: string; phone: string | null } }) {
  const [name, setName]   = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [success, setSuccess] = useState(false);

  const updateMutation = useUpdateProfile();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    updateMutation.mutate(
      { name, email, phone: phone || null },
      { onSuccess: () => setSuccess(true) },
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h5" sx={{ mb: 3 }}>Edit Profile</Typography>

      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update profile. Please try again.
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Profile updated.
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          inputProps={{ 'aria-label': 'Name' }}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          inputProps={{ 'aria-label': 'Email' }}
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          inputProps={{ 'aria-label': 'Phone' }}
        />
        <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
          Save Profile
        </Button>
      </Stack>
    </Box>
  );
}

// ── Password section ─────────────────────────────────────────────────────────

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [matchError,      setMatchError]      = useState('');
  const [success,         setSuccess]         = useState(false);

  const passwordMutation = useChangePassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMatchError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setMatchError('Passwords do not match.');
      return;
    }

    passwordMutation.mutate(
      { current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  }

  const apiError = passwordMutation.isError
    ? ((passwordMutation.error as any)?.response?.data?.message ?? 'Failed to update password. Please try again.')
    : null;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" sx={{ mb: 3 }}>Change Password</Typography>

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Password updated.
        </Alert>
      )}
      {matchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {matchError}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          fullWidth
          inputProps={{ 'aria-label': 'Current password' }}
        />
        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
          inputProps={{ 'aria-label': 'New password' }}
        />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          fullWidth
          inputProps={{ 'aria-label': 'Confirm new password' }}
        />
        <Button type="submit" variant="outlined" disabled={passwordMutation.isPending}>
          Update Password
        </Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest "profile/page" --no-coverage 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Run full frontend suite**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest --no-coverage 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness-web
git add src/app/\(app\)/profile/page.tsx src/app/\(app\)/profile/page.test.tsx
git commit -m "feat: add profile page with edit profile and change password sections"
```

---

## Task 6: Frontend — AppShell username links to /profile

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/AppShell.test.tsx`

- [ ] **Step 1: Write the failing test**

In `src/components/AppShell.test.tsx`, add this test inside the `describe('AppShell')` block:

```tsx
it('renders the username as a link to /profile', () => {
  render(<AppShell><div>Content</div></AppShell>);
  const link = screen.getByRole('link', { name: 'Alice Smith' });
  expect(link).toHaveAttribute('href', '/profile');
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest AppShell --no-coverage 2>&1 | tail -10
```

Expected: fail — "Alice Smith" is not a link.

- [ ] **Step 3: Update AppShell.tsx**

In `src/components/AppShell.tsx`, add the `Link` import and wrap the user name:

```tsx
// Add import at the top with other imports:
import Link from 'next/link';
```

Then change the user name rendering block from:

```tsx
{userName && (
  <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
    {userName}
  </Typography>
)}
```

to:

```tsx
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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest AppShell --no-coverage 2>&1 | tail -10
```

Expected: all AppShell tests pass.

- [ ] **Step 5: Run full frontend suite**

```bash
cd /home/priyadarshana/Project/aibusiness-web
npx jest --no-coverage 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/priyadarshana/Project/aibusiness-web
git add src/components/AppShell.tsx src/components/AppShell.test.tsx
git commit -m "feat: link username in AppBar to /profile page"
```

---

## Done

At completion:
- `GET /api/v1/me` returns `phone` in the user payload
- `PUT /api/v1/me` accepts `name`, `email`, `phone`
- `POST /api/v1/me/password` validates and changes password
- `/profile` page accessible by clicking the username in the AppBar
- Profile form pre-filled, saves immediately update the AppBar name
- Password form with client-side match validation and API error surfacing
- 62+ backend tests + 104+ frontend tests all green
