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
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Alice Updated' } });
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
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockPasswordMutate).not.toHaveBeenCalled();
  });

  it('calls useChangePassword mutate with correct payload', () => {
    render(<ProfilePage />);
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpass123' } });
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
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'newpass123' } });
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
