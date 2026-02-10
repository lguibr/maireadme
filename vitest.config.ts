import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],

      exclude: [
        'src/cli/main.ts',
        'src/api/types.ts',
        'src/core/types.ts',
        'src/**/*.d.ts',
        'tests/**/*',
      ],
      thresholds: {
        lines: 99,
        functions: 99,
        branches: 97,
        statements: 99,
      },
    },
  },
});
