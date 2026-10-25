import { createServer, type Server, type Socket } from 'node:net';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { startApp, type TestApp } from './support/start-app.js';

let app: TestApp;
let silentServer: Server;
const sockets: Socket[] = [];

beforeAll(async () => {
  silentServer = createServer((socket) => sockets.push(socket));
  await new Promise<void>((resolve) =>
    silentServer.listen(0, '127.0.0.1', resolve),
  );
  const { port } = silentServer.address() as { port: number };
  app = await startApp({ env: { REDIS_URL: `redis://127.0.0.1:${port}` } });
});

afterAll(async () => {
  for (const socket of sockets) socket.destroy();
  await app.close();
  silentServer.close();
});

it('reports not ready within 3 seconds', async () => {
  const started = Date.now();
  const response = await fetch(`${app.url}/api/health/ready`);

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    status: 'error',
    checks: { database: 'up', cache: 'down' },
  });
  expect(Date.now() - started).toBeLessThan(3000);
});
