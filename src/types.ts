export type EventType = 'affiliation' | 'cancellation';

export type TransactionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed' | 'not_found';

export interface TransactionInput {
  eventId: string;
  affiliationId: string;
  organizationId: string;
  recordHash: string;
}

export interface TransactionMetadata {
  eventType: EventType;
  eventId: string;
  affiliationId: string;
  organizationId: string;
  recordHash: string;
  schemaVersion: string;
  timestamp: string;
}

export interface TransactionRecord {
  eventId: string;
  eventType: EventType;
  affiliationId: string;
  organizationId: string;
  recordHash: string;
  status: TransactionStatus;
  txHash?: string;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}
