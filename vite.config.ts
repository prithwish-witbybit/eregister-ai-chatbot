import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	// 3002 is already in the API worker's test/feature CORS_WHITELIST, so `dev:test` works against deployed backends.
	server: { port: 3002, strictPort: true }
});
