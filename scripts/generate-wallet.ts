import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateSeedPhrase, walletFromSeed } from '@lucid-evolution/lucid';

const output = resolve(process.argv[2] ?? '.secrets/cne-preview-wallet.json');
const seedPhrase = generateSeedPhrase();
// Keep the generated address and payment key together so the address can be
// copied into CNE_ADDRESS and the key into CNE_PRIVATE_KEY.
const wallet = walletFromSeed(seedPhrase, {
  network: 'Preview',
});
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ network: 'Preview', address: wallet.address, privateKey: wallet.paymentKey }, null, 2)}\n`,
  { encoding: 'utf8', mode: 0o600 },
);
console.log(`Preview wallet generated at ${output}`);
console.log(`Address: ${wallet.address}`);
console.log(
  'Fund this address from the Cardano Preview faucet, then copy address into CNE_ADDRESS and privateKey into CNE_PRIVATE_KEY.',
);
console.log(
  'The generated private key is demo-only. It was written to the protected output file and not printed.',
);
