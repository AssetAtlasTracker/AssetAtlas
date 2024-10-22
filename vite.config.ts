import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // This makes functions like `beforeAll`, `describe`, etc., available globally
    environment: 'node', // Use Node environment if working on server-side code
  },
});