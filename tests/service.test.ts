import { describe, expect, it } from 'vitest';
import { TransactionService } from '../src/service.js';
import type { BlockchainProvider } from '../src/blockchain.js';
import type { TransactionRecord } from '../src/types.js';

class MemoryStore {
  records = new Map<string, TransactionRecord>();
  async get(id: string) {
    return this.records.get(id);
  }
  async save(record: TransactionRecord) {
    this.records.set(record.eventId, record);
  }
}

const input = {
  eventId: 'evt-1',
  affiliationId: 'aff-1',
  organizationId: 'org-1',
  recordHash: 'a'.repeat(64),
};

describe('transaction service', () => {
  it('does not submit twice for the same eventId', async () => {
    let submissions = 0;
    const provider: BlockchainProvider = {
      submit: async () => {
        submissions++;
        return 'tx-1';
      },
      status: async () => 'confirmed',
    };
    const service = new TransactionService(new MemoryStore(), provider, '1.0.0');
    await service.create('affiliation', input);
    const second = await service.create('affiliation', input);
    expect(submissions).toBe(1);
    expect(second.txHash).toBe('tx-1');
  });

  it('persists a safe failure when the provider fails', async () => {
    const provider: BlockchainProvider = {
      submit: async () => {
        throw new Error('secret provider detail');
      },
      status: async () => 'failed',
    };
    const service = new TransactionService(new MemoryStore(), provider, '1.0.0');
    await expect(service.create('affiliation', input)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'BLOCKCHAIN_SUBMISSION_FAILED',
    });
  });
});
