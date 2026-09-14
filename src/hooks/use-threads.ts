import { useCallback, useEffect, useState } from 'react';
import { deleteThread, fetchTicket, listThreads, type ChatThread, type GetToken, type WsTicket } from '@/lib/api';
import { isValidCompanyId } from '@/hooks/use-companies';

/**
 * Owns the thread list for one company plus the ticket for whichever thread is open.
 * Opening a thread means minting a WebSocket ticket for it; the chat panel takes it from there.
 */
export function useThreads(getToken: GetToken, companyId: string) {
	const [threads, setThreads] = useState<ChatThread[]>([]);
	const [activeTicket, setActiveTicket] = useState<WsTicket | null>(null);
	// A freshly created thread has no history to wait for; a reopened one does — the chat
	// panel uses this to tell "empty because it's new" apart from "empty because it hasn't
	// loaded yet".
	const [isNewThread, setIsNewThread] = useState(false);
	const [opening, setOpening] = useState(false);
	const [loadingThreads, setLoadingThreads] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!isValidCompanyId(companyId)) return setThreads([]);
		setLoadingThreads(true);
		try {
			setThreads(await listThreads(getToken, companyId));
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoadingThreads(false);
		}
	}, [getToken, companyId]);

	// Switching companies invalidates both the open thread and the list.
	useEffect(() => {
		setActiveTicket(null);
		void refresh();
	}, [refresh]);

	/** Omit `threadPid` to start a new thread. */
	const open = useCallback(
		async (threadPid?: string) => {
			setOpening(true);
			setError(null);
			try {
				setActiveTicket(await fetchTicket(getToken, companyId, threadPid));
				setIsNewThread(!threadPid);
				if (!threadPid) void refresh();
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setOpening(false);
			}
		},
		[getToken, companyId, refresh]
	);

	const remove = useCallback(
		async (threadPid: string) => {
			try {
				await deleteThread(getToken, companyId, threadPid);
				setActiveTicket(current => (current?.threadPid === threadPid ? null : current));
				await refresh();
			} catch (err) {
				setError((err as Error).message);
			}
		},
		[getToken, companyId, refresh]
	);

	return {
		threads,
		activeTicket,
		isNewThread,
		opening,
		loadingThreads,
		error,
		clearError: () => setError(null),
		open,
		remove,
		refresh
	};
}
