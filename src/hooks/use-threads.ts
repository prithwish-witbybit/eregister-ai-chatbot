import { useCallback, useEffect, useState } from 'react';
import {
	deleteThread,
	fetchReadTicket,
	fetchTicket,
	listThreads,
	renameThread,
	type ChatThread,
	type GetToken,
	type ReadTicket,
	type WsTicket
} from '@/lib/api';
import { isValidCompanyId } from '@/hooks/use-companies';

/**
 * Owns the thread list for one company plus the ticket for whichever thread is open.
 * Opening the caller's own thread mints a full WebSocket ticket; opening another company
 * user's thread mints a read-only ticket instead (see `ReadTicket` — no WebSocket, no reply).
 * The chat panel branches on `activeReadTicket` vs. `activeTicket` to render accordingly.
 */
export function useThreads(getToken: GetToken, companyId: string) {
	const [threads, setThreads] = useState<ChatThread[]>([]);
	// Which company `threads` belongs to — stale for a moment after switching companies.
	const [threadsCompanyId, setThreadsCompanyId] = useState<string | null>(null);
	const [activeTicket, setActiveTicket] = useState<WsTicket | null>(null);
	const [activeReadTicket, setActiveReadTicket] = useState<ReadTicket | null>(null);
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
			setThreadsCompanyId(companyId);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoadingThreads(false);
		}
	}, [getToken, companyId]);

	// Switching companies invalidates both the open thread and the list.
	useEffect(() => {
		setActiveTicket(null);
		setActiveReadTicket(null);
		void refresh();
	}, [refresh]);

	/**
	 * Omit `threadPid` to start a new thread (always the caller's own — always full access).
	 * Resolves to the opened thread's id, or null if it couldn't be opened.
	 */
	const open = useCallback(
		async (threadPid?: string): Promise<string | null> => {
			setOpening(true);
			setError(null);
			try {
				const thread = threadPid ? threads.find(t => t.publicId === threadPid) : undefined;
				if (threadPid && thread && !thread.isOwner) {
					const ticket = await fetchReadTicket(getToken, companyId, threadPid);
					setActiveReadTicket(ticket);
					setActiveTicket(null);
					return ticket.threadPid;
				}
				const ticket = await fetchTicket(getToken, companyId, threadPid);
				setActiveTicket(ticket);
				setActiveReadTicket(null);
				setIsNewThread(!threadPid);
				if (!threadPid) void refresh();
				return ticket.threadPid;
			} catch (err) {
				setError((err as Error).message);
				return null;
			} finally {
				setOpening(false);
			}
		},
		[getToken, companyId, threads, refresh]
	);

	const remove = useCallback(
		async (threadPid: string) => {
			try {
				await deleteThread(getToken, companyId, threadPid);
				setActiveTicket(current => (current?.threadPid === threadPid ? null : current));
				setActiveReadTicket(current => (current?.threadPid === threadPid ? null : current));
				await refresh();
			} catch (err) {
				setError((err as Error).message);
			}
		},
		[getToken, companyId, refresh]
	);

	const rename = useCallback(
		async (threadPid: string, title: string) => {
			const previous = threads.find(t => t.publicId === threadPid)?.title ?? null;
			setThreads(current => current.map(t => (t.publicId === threadPid ? { ...t, title } : t)));
			try {
				await renameThread(getToken, companyId, threadPid, title);
			} catch (err) {
				setThreads(current => current.map(t => (t.publicId === threadPid ? { ...t, title: previous } : t)));
				setError((err as Error).message);
			}
		},
		[getToken, companyId, threads]
	);

	return {
		threads,
		threadsCompanyId,
		activeTicket,
		activeReadTicket,
		isNewThread,
		opening,
		loadingThreads,
		error,
		clearError: () => setError(null),
		open,
		close: useCallback(() => {
			setActiveTicket(null);
			setActiveReadTicket(null);
		}, []),
		remove,
		rename,
		refresh
	};
}
