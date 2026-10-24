import type { EventType, TransactionInput } from './types.js';

const identifier = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const sha256 = /^[a-fA-F0-9]{64}$/;

export function validateInput(value: unknown, eventType: EventType): TransactionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid request body');
  const body = value as Record<string, unknown>;
  const fields = ['eventId', 'affiliationId', 'organizationId', 'recordHash'];
  if (Object.keys(body).some((key) => !fields.includes(key)))
    throw new Error('Unknown request field');
  for (const field of fields)
    if (typeof body[field] !== 'string') throw new Error(`${field} is required`);

  const input = body as unknown as TransactionInput;
  if (!identifier.test(input.eventId)) throw new Error('eventId must be a bounded identifier');
  if (!identifier.test(input.affiliationId))
    throw new Error('affiliationId must be a bounded identifier');
  if (!identifier.test(input.organizationId))
    throw new Error('organizationId must be a bounded identifier');
  if (!sha256.test(input.recordHash))
    throw new Error('recordHash must be a SHA-256 hex commitment');
  void eventType;
  return input;
}
