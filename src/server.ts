import { buildApp } from './app.js';
import { LucidBlockchainProvider } from './blockchain.js';
import { loadConfig } from './config.js';
import { JsonTransactionStore } from './persistence.js';
import { TransactionService } from './service.js';

const config = loadConfig();
const service = new TransactionService(
  new JsonTransactionStore(config.dataFile),
  new LucidBlockchainProvider(config),
  config.metadataSchemaVersion,
);
const app = buildApp(service, config.internalApiToken);

app.listen({ port: config.port, host: config.host }).catch((error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});
