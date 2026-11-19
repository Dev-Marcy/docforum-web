import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../test/render';
import { createFormatters } from '../../../i18n/format';
import { getBrowserTimeZone } from '../../../i18n/time-zone';
import { useRedeliverWebhook, useWebhookDeliveries } from '../hooks/useIntegrations';
import { WebhookDeliveries } from './WebhookDeliveries';
import type { WebhookDelivery } from '../../../types/models';

vi.mock('../hooks/useIntegrations');

const DELIVERED_AT = '2026-10-18T23:30:00.000Z';

function delivery(overrides: Partial<WebhookDelivery> = {}): WebhookDelivery {
  return {
    id: 'del-1',
    endpointId: 'wh-1',
    event: 'order.created',
    status: 'success',
    responseStatusCode: 200,
    errorMessage: null,
    attemptCount: 1,
    deliveredAt: DELIVERED_AT,
    createdAt: DELIVERED_AT,
    ...overrides,
  };
}

const expectedTime = createFormatters('en-US', getBrowserTimeZone()).formatTime(DELIVERED_AT);

beforeEach(() => {
  vi.mocked(useWebhookDeliveries).mockReturnValue({
    data: [delivery()],
    isLoading: false,
  } as never);
  vi.mocked(useRedeliverWebhook).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as never);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('WebhookDeliveries timestamps', () => {
  it('shows the delivery time through the shared formatter', () => {
    render(<WebhookDeliveries facilityId="fac-1" endpointId="wh-1" />);

    const time = screen.getByText(expectedTime);
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', DELIVERED_AT);
  });

  it('renders a dash for a delivery that never landed', () => {
    vi.mocked(useWebhookDeliveries).mockReturnValue({
      data: [delivery({ id: 'del-2', status: 'failed', deliveredAt: null })],
      isLoading: false,
    } as never);

    render(<WebhookDeliveries facilityId="fac-1" endpointId="wh-1" />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
