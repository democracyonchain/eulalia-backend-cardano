import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import sensible from '@fastify/sensible';
import type { TransactionService } from './service.js';

function requireAuth(request: FastifyRequest, token: string): void {
  const header = request.headers.authorization;
  if (header !== `Bearer ${token}`) throw new Error('Unauthorized');
}

export function buildApp(service: TransactionService, internalApiToken: string): FastifyInstance {
  const app = Fastify({ logger: { redact: ['req.headers.authorization'] } });
  void app.register(sensible);
  app.get('/health', async () => ({ status: 'ok', network: 'Preview' }));

  const create = (eventType: 'affiliation' | 'cancellation') => async (request: FastifyRequest) => {
    requireAuth(request, internalApiToken);
    return service.create(eventType, request.body);
  };
  app.post('/api/transactions/affiliations', create('affiliation'));
  app.post('/api/transactions/cancellations', create('cancellation'));
  app.get<{ Params: { eventId: string } }>('/api/transactions/:eventId', async (request, reply) => {
    requireAuth(request, internalApiToken);
    const record = await service.get(request.params.eventId);
    if (!record) return reply.notFound('Transaction event not found');
    return record;
  });
  app.post<{ Params: { eventId: string } }>(
    '/api/transactions/:eventId/refresh',
    async (request, reply) => {
      requireAuth(request, internalApiToken);
      const record = await service.refresh(request.params.eventId);
      if (!record) return reply.notFound('Transaction event not found');
      return record;
    },
  );
  app.setErrorHandler((error, _request, reply) => {
    const message = error instanceof Error ? error.message : 'Unknown request error';
    if (message === 'Unauthorized') return reply.code(401).send({ error: 'Unauthorized' });
    if (
      message.includes('required') ||
      message.includes('must be') ||
      message.includes('Unknown') ||
      message === 'Invalid request body'
    )
      return reply.code(400).send({ error: message });
    requestSafeLog(message);
    return reply.code(500).send({ error: 'Internal server error' });
  });
  return app;
}

function requestSafeLog(message: string): void {
  console.error('Request failed:', message);
}
