/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE: string;
	readonly VITE_WS_BASE: string;
	/** 'none' only against a local API worker running with RUN_MODE=test-api, which skips Firebase. */
	readonly VITE_AUTH: 'firebase' | 'none';
	readonly VITE_FIREBASE_API_KEY?: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
	readonly VITE_FIREBASE_PROJECT_ID?: string;
	readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
