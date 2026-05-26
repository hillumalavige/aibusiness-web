import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('renders "Active" with success color for active status', () => {
    render(<StatusChip status="active" />);
    const chip = screen.getByText('Active');
    expect(chip).toBeInTheDocument();
  });

  it('renders "Trial" with info color for trial status', () => {
    render(<StatusChip status="trial" />);
    expect(screen.getByText('Trial')).toBeInTheDocument();
  });

  it('renders "Suspended" with error color for suspended status', () => {
    render(<StatusChip status="suspended" />);
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('renders "Cancelled" with default color for cancelled status', () => {
    render(<StatusChip status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders "Granted" with success color for granted status', () => {
    render(<StatusChip status="granted" />);
    expect(screen.getByText('Granted')).toBeInTheDocument();
  });

  it('renders "Not Granted" with default color for not-granted status', () => {
    render(<StatusChip status="not-granted" />);
    expect(screen.getByText('Not Granted')).toBeInTheDocument();
  });
});
