import { defineConfig } from 'vitest/config';

export default defineConfig({

  server: {
    host: "0.0.0.0", // Bind to all interfaces for Docker compatibility
    port: 3001, //doesnt break testing? needed for vite host?
  },
  
  test: {
    globals: true, // This makes functions like `beforeAll`, `describe`, etc., available globally
    environment: 'node', // Use Node environment if working on server-side code
  },
});