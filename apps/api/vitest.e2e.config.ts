import { defineConfig } from 'vitest/config';
import { swcPlugin } from './vitest.config.js';

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    environment: 'node',
    include: ['test/**/*.e2e.test.ts'],
    hookTimeout: 30_000,
  },
});
