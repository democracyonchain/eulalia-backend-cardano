import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('configuration', () => {
  it('fails closed when wallet or provider credentials are absent', () => {
    expect(() => loadConfig({ CARDANO_NETWORK: 'Preview' })).toThrow('BLOCKFROST_PROJECT_ID');
  });

  it('rejects a missing CNE address after provider credentials are present', () => {
    expect(() =>
      loadConfig({
        CARDANO_NETWORK: 'Preview',
        BLOCKFROST_PROJECT_ID: 'project-id',
        CNE_PRIVATE_KEY: 'private-key',
        INTERNAL_API_TOKEN: 'api-token',
      }),
    ).toThrow('CNE_ADDRESS');
  });

  it('loads the original funded address without changing the Preview network', () => {
    expect(
      loadConfig({
        CARDANO_NETWORK: 'Preview',
        BLOCKFROST_PROJECT_ID: 'project-id',
        CNE_ADDRESS: 'addr_test1funded',
        CNE_PRIVATE_KEY: 'private-key',
        INTERNAL_API_TOKEN: 'api-token',
      }),
    ).toMatchObject({ network: 'Preview', cneAddress: 'addr_test1funded' });
  });
  it('rejects non-Preview networks', () => {
    expect(() => loadConfig({ CARDANO_NETWORK: 'Mainnet' })).toThrow('Preview');
  });
});
