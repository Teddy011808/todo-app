import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // e2e tests use their own database so they never touch your real todos
    env: { DB_NAME: 'todo_test' },
    fileParallelism: false,
  },
});
