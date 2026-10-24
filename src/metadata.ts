import type { EventType, TransactionInput, TransactionMetadata } from './types.js';

const MAX_METADATA_BYTES = 1600;

export function buildMetadata(
  eventType: EventType,
  input: TransactionInput,
  schemaVersion: string,
  timestamp = new Date().toISOString(),
): TransactionMetadata {
  const metadata: TransactionMetadata = { eventType, ...input, schemaVersion, timestamp };
  const encoded = Buffer.byteLength(JSON.stringify(metadata), 'utf8');
  if (encoded > MAX_METADATA_BYTES)
    throw new Error('Transaction metadata exceeds the safety bound');
  return metadata;
}
