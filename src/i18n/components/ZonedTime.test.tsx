import { describe, expect, it } from 'vitest';
import { render, screen } from '../../test/render';
import { ZonedTime } from './ZonedTime';

// 23:30 UTC is already the next morning in Tokyo. Asserting the rendered text
// for an explicit zone keeps this independent of the test machine's zone.
describe('ZonedTime', () => {
  it('renders an instant in an explicit zone inside a machine-readable <time>', () => {
    render(<ZonedTime value="2026-10-18T23:30:00.000Z" timeZone="Asia/Tokyo" mode="time" />);

    const time = screen.getByText('08:30 AM');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', '2026-10-18T23:30:00.000Z');
  });

  it('shows the calendar day that belongs to the requested zone', () => {
    render(<ZonedTime value="2026-10-18T23:30:00.000Z" timeZone="UTC" mode="date" />);

    expect(screen.getByText('Oct 18, 2026')).toBeInTheDocument();
  });

  it('falls back to a dash for a missing value instead of "Invalid Date"', () => {
    render(<ZonedTime value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
