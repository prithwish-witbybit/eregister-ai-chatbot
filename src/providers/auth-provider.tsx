import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import {
	getAuth,
	GoogleAuthProvider,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut as firebaseSignOut,
	type Auth,
	type User
} from 'firebase/auth';
import { config } from '@/lib/config';

type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

interface AuthContextValue {
	status: AuthStatus;
	email: string | null;
	getToken: () => Promise<string | undefined>;
	signInWithGoogle: () => Promise<void>;
	signInWithEmail: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let firebaseAuth: Auth | null = null;
const getFirebaseAuth = (): Auth => (firebaseAuth ??= getAuth(initializeApp(config.firebase)));

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [status, setStatus] = useState<AuthStatus>(config.authEnabled ? 'loading' : 'signed-in');

	useEffect(() => {
		if (!config.authEnabled) return;
		return onAuthStateChanged(getFirebaseAuth(), next => {
			setUser(next);
			setStatus(next ? 'signed-in' : 'signed-out');
		});
	}, []);

	// getIdToken() serves the cached token and only refreshes near expiry, so calling it per request is cheap.
	const getToken = useCallback(async () => (user ? user.getIdToken() : undefined), [user]);

	const value = useMemo<AuthContextValue>(
		() => ({
			status,
			email: config.authEnabled ? (user?.email ?? null) : 'Local dev (no auth)',
			getToken,
			signInWithGoogle: async () => {
				await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
			},
			signInWithEmail: async (email, password) => {
				await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
			},
			signOut: async () => {
				if (config.authEnabled) await firebaseSignOut(getFirebaseAuth());
			}
		}),
		[status, user, getToken]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
	return ctx;
}
