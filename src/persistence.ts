import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TransactionRecord } from './types.js';

export interface TransactionStore {
  get(eventId: string): Promise<TransactionRecord | undefined>;
  save(record: TransactionRecord): Promise<void>;
}

export class JsonTransactionStore implements TransactionStore {
  private records = new Map<string, TransactionRecord>();
  private loaded = false;

  constructor(private readonly filePath: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const content = await readFile(this.filePath, 'utf8');
      for (const record of JSON.parse(content) as TransactionRecord[])
        this.records.set(record.eventId, record);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  async get(eventId: string): Promise<TransactionRecord | undefined> {
    await this.load();
    return this.records.get(eventId);
  }

  async save(record: TransactionRecord): Promise<void> {
    await this.load();
    this.records.set(record.eventId, record);
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(
      this.filePath,
      `${JSON.stringify([...this.records.values()], null, 2)}\n`,
      'utf8',
    );
  }
}
