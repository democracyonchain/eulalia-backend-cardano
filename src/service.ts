import type { BlockchainProvider } from './blockchain.js';
import type { TransactionStore } from './persistence.js';
import { buildMetadata } from './metadata.js';
import { validateInput } from './validation.js';
import type { EventType, TransactionInput, TransactionRecord } from './types.js';

export class TransactionService {
  private readonly inFlight = new Map<string, Promise<TransactionRecord>>();

  constructor(
    private readonly store: TransactionStore,
    private readonly blockchain: BlockchainProvider,
    private readonly schemaVersion: string,
  ) {}

  async create(eventType: EventType, body: unknown): Promise<TransactionRecord> {
    const input = validateInput(body, eventType);
    const running = this.inFlight.get(input.eventId);
    if (running) return running;

    const operation = this.createOrGet(eventType, input);
    this.inFlight.set(input.eventId, operation);
    try {
      return await operation;
    } finally {
      this.inFlight.delete(input.eventId);
    }
  }

  private async createOrGet(
    eventType: EventType,
    input: TransactionInput,
  ): Promise<TransactionRecord> {
    const existing = await this.store.get(input.eventId);
    if (existing) return existing;
    return this.submitOnce(eventType, input);
  }

  private async submitOnce(
    eventType: EventType,
    input: TransactionInput,
  ): Promise<TransactionRecord> {
    const now = new Date().toISOString();
    const pending: TransactionRecord = {
      ...input,
      eventType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await this.store.save(pending);
    try {
      const txHash = await this.blockchain.submit(
        buildMetadata(eventType, input, this.schemaVersion, now),
      );
      const submitted = {
        ...pending,
        txHash,
        status: 'submitted' as const,
        updatedAt: new Date().toISOString(),
      };
      await this.store.save(submitted);
      return submitted;
    } catch {
      const failed = {
        ...pending,
        status: 'failed' as const,
        errorCode: 'BLOCKCHAIN_SUBMISSION_FAILED',
        updatedAt: new Date().toISOString(),
      };
      await this.store.save(failed);
      return failed;
    }
  }

  get(eventId: string): Promise<TransactionRecord | undefined> {
    return this.store.get(eventId);
  }

  async refresh(eventId: string): Promise<TransactionRecord | undefined> {
    const record = await this.store.get(eventId);
    if (!record || !record.txHash || record.status === 'confirmed' || record.status === 'failed')
      return record;
    const status = await this.blockchain.status(record.txHash);
    const updated = { ...record, status, updatedAt: new Date().toISOString() };
    await this.store.save(updated);
    return updated;
  }
}
