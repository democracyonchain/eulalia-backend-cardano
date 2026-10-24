# Eulalia Cardano Backend

Standalone demo backend for recording CNE affiliation and cancellation events on Cardano Preview. It accepts only privacy-safe commitments, builds bounded transaction metadata, signs with a CNE wallet key held in the server environment, submits through Blockfrost, and stores demo state in a local JSON file.

## Prerequisites

- Node.js 20 or newer
- A Blockfrost Preview project ID
- Preview ADA from the Cardano faucet

Blockfrost provides node/provider access. It cannot create a wallet or create/sign transactions. The CNE private key remains server-side and is never returned in API responses or written to logs.

## Generate a CNE Preview wallet

The command does not run during server startup and does not print the private key:

```bash
npm install
npm run wallet:generate -- .secrets/cne-preview-wallet.json
```

If an existing wallet file is already funded, do not generate or fund another wallet: copy its `address` into `CNE_ADDRESS` and keep its `privateKey` in `CNE_PRIVATE_KEY`. Otherwise, record the generated Preview address, fund it with ADA from the Cardano Preview faucet, and copy both fields from the protected local file into `.env`. Treat that file and key as demo-only secret material.

## Configure and run

```bash
copy .env.example .env
# Edit .env with BLOCKFROST_PROJECT_ID, CNE_ADDRESS, CNE_PRIVATE_KEY, and INTERNAL_API_TOKEN
npm run typecheck
npm test
npm run build
npm start
```

The service rejects networks other than `Preview`. `DATA_FILE` defaults to `./data/transactions.json`; this file is intentionally simple demo persistence and is ignored by git.

## API

Health is public:

```bash
curl http://127.0.0.1:3000/health
```

Transaction endpoints require `Authorization: Bearer <INTERNAL_API_TOKEN>`. Do not send cedula, biometrics, names, raw records, or other personal data. `recordHash` must be a SHA-256 hexadecimal commitment.

```bash
curl -X POST http://127.0.0.1:3000/api/transactions/affiliations ^
  -H "Authorization: Bearer replace-with-a-long-random-token" ^
  -H "Content-Type: application/json" ^
  -d "{\"eventId\":\"evt-001\",\"affiliationId\":\"aff-001\",\"organizationId\":\"org-001\",\"recordHash\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\"}"
```

Use the same request shape at `/api/transactions/cancellations`. `GET /api/transactions/:eventId` returns the stored status. `POST /api/transactions/:eventId/refresh` asks Blockfrost for the current status. Repeating an `eventId` returns the original record and never submits a second transaction.

## Flow and failure behavior

The flow is explicit: validate input, persist `pending`, build metadata, sign and submit, then persist `submitted` and `txHash`. Provider failures persist `failed` with a safe error code; provider details and secrets are not returned.

Metadata is bounded and contains only event type, event ID, affiliation ID, organization ID, record hash, schema version, and timestamp under the configured metadata label.

## Production warnings

This is a Preview demo, not a production custody design. Use a Vault or HSM, preferably multisig, for institutional signing. Keep Preview and Mainnet configurations and credentials completely separate. Never publish raw PII or reversible personal data on-chain. Replace JSON persistence with durable transactional storage, add operational authentication and authorization, audit access, rate limits, retries, and key rotation before production.

No end-to-end blockchain success is claimed until valid Preview credentials, a funded wallet, and network access are supplied.
