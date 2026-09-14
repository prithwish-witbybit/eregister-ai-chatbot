import { useState, type FormEvent } from 'react';
import { AlertCircleIcon, SparklesIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/providers/auth-provider';

export function LoginScreen() {
	const { signInWithGoogle, signInWithEmail } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		setError(null);
		try {
			await action();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const submit = (event: FormEvent) => {
		event.preventDefault();
		void run(() => signInWithEmail(email, password));
	};

	return (
		<div className='grid min-h-full place-items-center p-4'>
			<div className='w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm'>
				<div className='mb-6 flex flex-col items-center gap-3 text-center'>
					<div className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
						<SparklesIcon className='size-5' />
					</div>
					<div>
						<h1 className='font-heading text-lg font-semibold'>eRegister AI Chat</h1>
						<p className='text-sm text-muted-foreground'>Sign in to talk to your registers.</p>
					</div>
				</div>

				<Button className='w-full justify-center' disabled={busy} onClick={() => void run(signInWithGoogle)}>
					Continue with Google
				</Button>

				<div className='my-5 flex items-center gap-3'>
					<Separator className='flex-1' />
					<span className='text-xs text-muted-foreground'>or</span>
					<Separator className='flex-1' />
				</div>

				<form className='flex flex-col gap-3' onSubmit={submit}>
					<Input
						type='email'
						placeholder='Email'
						autoComplete='email'
						value={email}
						onChange={event => setEmail(event.target.value)}
						required
					/>
					<Input
						type='password'
						placeholder='Password'
						autoComplete='current-password'
						value={password}
						onChange={event => setPassword(event.target.value)}
						required
					/>
					<Button type='submit' variant='outline' className='w-full justify-center' disabled={busy}>
						{busy && <Spinner />}
						Sign in
					</Button>
				</form>

				{error && (
					<Alert variant='destructive' className='mt-4'>
						<AlertCircleIcon />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	);
}
