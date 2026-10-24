import { Blockfrost, Lucid } from '@lucid-evolution/lucid';
import type { AppConfig } from './config.js';
import type { TransactionMetadata, TransactionStatus } from './types.js';

export interface BlockchainProvider {
  submit(metadata: TransactionMetadata): Promise<string>;
  status(txHash: string): Promise<TransactionStatus>;
}

export class LucidBlockchainProvider implements BlockchainProvider {
  constructor(private readonly config: AppConfig) {}

  async submit(metadata: TransactionMetadata): Promise<string> {
    const lucid = await Lucid(
      new Blockfrost(this.config.blockfrostUrl, this.config.blockfrostProjectId),
      'Preview',
    );
    const utxos = await lucid.utxosAt(this.config.cneAddress);
    lucid.selectWallet.fromAddress(this.config.cneAddress, utxos);
    const tx = await lucid
      .newTx()
      .attachMetadata(Number(this.config.metadataLabel), { ...metadata })
      .complete();
    const signed = await tx.sign.withPrivateKey(this.config.cnePrivateKey).complete();
    return signed.submit();
  }

  async status(txHash: string): Promise<TransactionStatus> {
    const lucid = await Lucid(
      new Blockfrost(this.config.blockfrostUrl, this.config.blockfrostProjectId),
      'Preview',
    );
    const response = await fetch(`${this.config.blockfrostUrl}/txs/${encodeURIComponent(txHash)}`, {
      headers: { project_id: this.config.blockfrostProjectId },
    });
    if (response.ok) return 'confirmed';
    if (response.status === 404) return 'pending';
    return 'failed';
  }
}
