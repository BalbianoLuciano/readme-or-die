/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// Path base para GitHub Pages: el repo se sirve en /readme-or-die/
export default defineConfig({
  base: '/readme-or-die/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
