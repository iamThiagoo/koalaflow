import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/**
 *  Keeps Nest decorator metadata, which esbuild drops.
 */
export const swcPlugin = swc.vite({
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
  },
});

export default defineConfig({
  plugins: [swcPlugin],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
