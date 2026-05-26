import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('renders "Active" with success color for active status', () => {
    render(<StatusChip status="active" />);
    const chip = screen.getByText('Active').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorSuccess');
  });

  it('renders "Trial" with info color for trial status', () => {
    render(<StatusChip status="trial" />);
    const chip = screen.getByText('Trial').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorInfo');
  });

  it('renders "Suspended" with error color for suspended status', () => {
    render(<StatusChip status="suspended" />);
    const chip = screen.getByText('Suspended').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorError');
  });

  it('renders "Cancelled" with default color for cancelled status', () => {
    render(<StatusChip status="cancelled" />);
    const chip = screen.getByText('Cancelled').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorDefault');
  });

  it('renders "Granted" with success color for granted status', () => {
    render(<StatusChip status="granted" />);
    const chip = screen.getByText('Granted').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorSuccess');
  });

  it('renders "Not Granted" with default color for not-granted status', () => {
    render(<StatusChip status="not-granted" />);
    const chip = screen.getByText('Not Granted').closest('.MuiChip-root');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('MuiChip-colorDefault');
  });
});
