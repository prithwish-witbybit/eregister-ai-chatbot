import { useEffect, useState } from 'react';
import type { UIMessage } from 'ai';
import { fetchReadOnlyMessages, type ReadTicket } from '@/lib/api';

/** Fetches the static transcript for a reader ticket once — no socket, no live updates. */
export function useReadOnlyThread(ticket: ReadTicket) {
	const [messages, setMessages] = useState<UIMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchReadOnlyMessages(ticket)
			.then(msgs => {
				if (!cancelled) setMessages(msgs);
			})
			.catch(err => {
				if (!cancelled) setError((err as Error).message);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [ticket]);

	return { messages, loading, error };
}
