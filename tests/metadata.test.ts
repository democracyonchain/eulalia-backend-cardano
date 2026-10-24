import { describe, expect, it } from 'vitest';
import { buildMetadata } from '../src/metadata.js';

describe('metadata privacy', () => {
  it('contains only the approved commitment fields', () => {
    const metadata = buildMetadata(
      'cancellation',
      { eventId: 'e', affiliationId: 'a', organizationId: 'o', recordHash: 'b'.repeat(64) },
      '1.0.0',
    );
    expect(metadata).toMatchObject({
      eventType: 'cancellation',
      eventId: 'e',
      recordHash: 'b'.repeat(64),
    });
    expect(JSON.stringify(metadata)).not.toContain('cedula');
  });
});
