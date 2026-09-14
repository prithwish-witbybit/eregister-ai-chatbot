const env = import.meta.env;

export const config = {
	apiBase: env.VITE_API_BASE,
	wsBase: env.VITE_WS_BASE,
	authEnabled: env.VITE_AUTH !== 'none',
	firebase: {
		apiKey: env.VITE_FIREBASE_API_KEY,
		authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
		projectId: env.VITE_FIREBASE_PROJECT_ID,
		appId: env.VITE_FIREBASE_APP_ID
	}
};
