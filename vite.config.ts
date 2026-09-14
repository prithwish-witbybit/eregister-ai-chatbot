import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
	},
	// 3002 is already in the API worker's test/feature CORS_WHITELIST, so `dev:test` works against deployed backends.
	server: { port: 3002, strictPort: true }
});
