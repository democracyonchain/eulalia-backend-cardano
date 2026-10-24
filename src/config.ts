import 'dotenv/config';

export interface AppConfig {
  port: number;
  host: string;
  network: 'Preview';
  blockfrostUrl: string;
  blockfrostProjectId: string;
  cneAddress: string;
  cnePrivateKey: string;
  internalApiToken: string;
  metadataLabel: bigint;
  metadataSchemaVersion: string;
  dataFile: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value || value.startsWith('replace-with'))
    throw new Error(`Missing required configuration: ${name}`);
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const network = env.CARDANO_NETWORK ?? 'Preview';
  if (network !== 'Preview') throw new Error('Only Cardano Preview is supported by this demo');

  const metadataLabel = BigInt(env.METADATA_LABEL ?? '1967');
  if (metadataLabel < 0n || metadataLabel > 65535n)
    throw new Error('METADATA_LABEL must be 0..65535');

  return {
    port: Number(env.PORT ?? '3000'),
    host: env.HOST ?? '127.0.0.1',
    network,
    blockfrostUrl: env.BLOCKFROST_URL ?? 'https://cardano-preview.blockfrost.io/api/v0',
    blockfrostProjectId: required(env, 'BLOCKFROST_PROJECT_ID'),
    cneAddress: required(env, 'CNE_ADDRESS'),
    cnePrivateKey: required(env, 'CNE_PRIVATE_KEY'),
    internalApiToken: required(env, 'INTERNAL_API_TOKEN'),
    metadataLabel,
    metadataSchemaVersion: env.METADATA_SCHEMA_VERSION ?? '1.0.0',
    dataFile: env.DATA_FILE ?? './data/transactions.json',
  };
}
