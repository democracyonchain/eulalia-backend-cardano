import { describe, expect, it } from 'vitest';
import { validateInput } from '../src/validation.js';

const valid = {
  eventId: 'evt-1',
  affiliationId: 'aff-1',
  organizationId: 'org-1',
  recordHash: 'a'.repeat(64),
};

describe('validation', () => {
  it('accepts bounded commitments and identifiers', () =>
    expect(validateInput(valid, 'affiliation')).toEqual(valid));
  it('rejects personal data fields and non-commitments', () => {
    expect(() => validateInput({ ...valid, cedula: '123' }, 'affiliation')).toThrow(
      'Unknown request field',
    );
    expect(() =>
      validateInput({ ...valid, recordHash: 'raw-personal-data' }, 'affiliation'),
    ).toThrow('SHA-256');
  });
});
