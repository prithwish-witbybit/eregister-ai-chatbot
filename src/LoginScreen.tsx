import { useState, type FormEvent } from 'react';
import { useAuth } from './auth';

export function LoginScreen() {
	const { signInWithGoogle, signInWithEmail } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const run = async (fn: () => Promise<void>) => {
		setBusy(true);
		setError(null);
		try {
			await fn();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const submit = (e: FormEvent) => {
		e.preventDefault();
		void run(() => signInWithEmail(email, password));
	};

	return (
		<div className='center'>
			<form className='login' onSubmit={submit}>
				<h1>eRegister AI Chat</h1>
				<button type='button' className='primary' disabled={busy} onClick={() => void run(signInWithGoogle)}>
					Continue with Google
				</button>
				<div className='divider'>or</div>
				<input
					type='email'
					placeholder='Email'
					autoComplete='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
				/>
				<input
					type='password'
					placeholder='Password'
					autoComplete='current-password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
				/>
				<button type='submit' disabled={busy}>
					Sign in
				</button>
				{error && <p className='error'>{error}</p>}
			</form>
		</div>
	);
}
