import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: {
      'config': path.resolve(__dirname, './src/config'),
      'controllers': path.resolve(__dirname, './src/controllers'),
      'routes': path.resolve(__dirname, './src/routes'),
      'services': path.resolve(__dirname, './src/services'),
      'models': path.resolve(__dirname, './src/models'),
      'utils': path.resolve(__dirname, './src/utils'),
      'middlewares': path.resolve(__dirname, './src/middlewares'),
      'middleware': path.resolve(__dirname, './src/middleware'),
      'src': path.resolve(__dirname, './src'),
    },
  },
});
