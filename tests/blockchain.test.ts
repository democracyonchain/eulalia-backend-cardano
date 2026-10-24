import { describe, expect, it, vi } from 'vitest';
import { LucidBlockchainProvider } from '../src/blockchain.js';
import type { AppConfig } from '../src/config.js';

const mocks = vi.hoisted(() => {
  const utxos = [{ txHash: 'funding-tx', outputIndex: 0 }];
  const withPrivateKey = vi.fn().mockReturnValue({
    complete: vi.fn().mockResolvedValue({ submit: vi.fn().mockResolvedValue('tx-hash') }),
  });
  const complete = vi.fn().mockResolvedValue({ sign: { withPrivateKey } });
  const newTx = vi.fn().mockReturnValue({
    attachMetadata: vi.fn().mockReturnValue({ complete }),
  });
  const utxosAt = vi.fn().mockResolvedValue(utxos);
  const fromAddress = vi.fn();
  return { complete, fromAddress, newTx, utxos, utxosAt, withPrivateKey };
});

vi.mock('@lucid-evolution/lucid', () => ({
  Blockfrost: vi.fn(),
  Lucid: vi.fn().mockResolvedValue({
    utxosAt: mocks.utxosAt,
    selectWallet: { fromAddress: mocks.fromAddress },
    newTx: mocks.newTx,
  }),
}));

const config: AppConfig = {
  port: 3000,
  host: '127.0.0.1',
  network: 'Preview',
  blockfrostUrl: 'https://cardano-preview.blockfrost.io/api/v0',
  blockfrostProjectId: 'project-id',
  cneAddress: 'addr_test1funded',
  cnePrivateKey: 'private-key',
  internalApiToken: 'api-token',
  metadataLabel: 1967n,
  metadataSchemaVersion: '1.0.0',
  dataFile: './data/transactions.json',
};

describe('Lucid blockchain provider', () => {
  it('balances from the configured funded address and signs with its private key', async () => {
    const provider = new LucidBlockchainProvider(config);

    await expect(
      provider.submit({
        eventType: 'affiliation',
        eventId: 'evt-1',
        affiliationId: 'aff-1',
        organizationId: 'org-1',
        recordHash: 'a'.repeat(64),
        schemaVersion: '1.0.0',
        timestamp: '2026-01-01T00:00:00.000Z',
      }),
    ).resolves.toBe('tx-hash');

    expect(mocks.utxosAt).toHaveBeenCalledWith(config.cneAddress);
    expect(mocks.fromAddress).toHaveBeenCalledWith(config.cneAddress, mocks.utxos);
    expect(mocks.withPrivateKey).toHaveBeenCalledWith(config.cnePrivateKey);
    expect(mocks.complete).toHaveBeenCalledOnce();
  });
});
