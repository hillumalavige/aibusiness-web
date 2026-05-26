// src/components/admin/CompanyForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyForm from './CompanyForm';

const mockSubmit = jest.fn();

describe('CompanyForm', () => {
  beforeEach(() => mockSubmit.mockClear());

  it('renders all 6 fields', () => {
    render(<CompanyForm onSubmit={mockSubmit} isLoading={false} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /country/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    render(<CompanyForm onSubmit={mockSubmit} isLoading={false} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('pre-fills fields from initialValues', () => {
    render(
      <CompanyForm
        onSubmit={mockSubmit}
        isLoading={false}
        initialValues={{ name: 'Acme Corp', email: 'info@acme.com', city: 'Colombo', country: 'LK' }}
      />,
    );
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('info@acme.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Colombo')).toBeInTheDocument();
  });

  it('shows error when name is empty and form is submitted', async () => {
    render(<CompanyForm onSubmit={mockSubmit} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeInTheDocument());
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form values when name is filled', async () => {
    render(<CompanyForm onSubmit={mockSubmit} isLoading={false} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'New Company');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Company' }),
      ),
    );
  });

  it('disables Save button while isLoading is true', () => {
    render(<CompanyForm onSubmit={mockSubmit} isLoading={true} />);
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
});
