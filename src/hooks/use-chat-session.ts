import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgent } from 'agents/react';
import { useAgentChat } from 'agents/chat/react';
import { fetchTicket, type GetToken, type WsTicket } from '@/lib/api';
import { config } from '@/lib/config';
import { isAwaitingUser } from '@/lib/message-parts';

const wsUrl = new URL(config.wsBase);

/** How long after the socket opens to stop waiting for a history frame. */
const HISTORY_GRACE_MS = 1500;

interface ChatSessionOptions {
	initialTicket: WsTicket;
	companyId: string;
	getToken: GetToken;
	onTurnFinished: () => void;
}

/**
 * Connects one thread to its agent over the WebSocket and exposes the chat state.
 *
 * `useAgent` resolves its async query through React `use()`, so the first render of any
 * component calling this hook suspends — keep it under a Suspense boundary.
 */
export function useChatSession({ initialTicket, companyId, getToken, onTurnFinished }: ChatSessionOptions) {
	const [ticket, setTicket] = useState(initialTicket);
	const renewing = useRef(false);
	const [historyLoaded, setHistoryLoaded] = useState(false);
	const historyFallback = useRef<ReturnType<typeof setTimeout>>(undefined);

	// Tickets live 60s and are checked only at WebSocket upgrade. Renewing on close (not on a timer) means a
	// healthy socket is never torn down, while a reconnect after a drop gets a ticket the worker will accept.
	const renewIfExpired = useCallback(async () => {
		if (renewing.current || Date.parse(ticket.expiresAt) - Date.now() > 5_000) return;
		renewing.current = true;
		try {
			setTicket(await fetchTicket(getToken, companyId, ticket.threadPid));
		} catch {
			// Next close retries; the status line already shows the connection error.
		} finally {
			renewing.current = false;
		}
	}, [ticket, getToken, companyId]);

	const agent = useAgent({
		agent: ticket.agent,
		name: ticket.name,
		host: wsUrl.host,
		protocol: wsUrl.protocol === 'wss:' ? 'wss' : 'ws',
		query: async () => ({ ticket: ticket.ticket }),
		queryDeps: [ticket.ticket],
		// A fresh ticket changes queryDeps; a TTL-driven re-query would only force needless reconnects.
		cacheTtl: 24 * 60 * 60 * 1000,
		onOpen: () => {
			// A server may skip the history frame for a thread with no messages; don't wait on it forever.
			clearTimeout(historyFallback.current);
			historyFallback.current = setTimeout(() => setHistoryLoaded(true), HISTORY_GRACE_MS);
		},
		onClose: () => void renewIfExpired()
	});

	// History arrives over the socket on connect; the HTTP /get-messages fetch would need CORS on the ai-chat worker.
	const chat = useAgentChat({ agent, getInitialMessages: null });

	// `messages` stays empty both while history is in flight and for a thread that has none, so
	// watch for the history frame itself to tell the two apart.
	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (typeof event.data !== 'string' || !event.data.includes('"cf_agent_chat_messages"')) return;
			try {
				if (JSON.parse(event.data).type === 'cf_agent_chat_messages') setHistoryLoaded(true);
			} catch {
				// Not JSON — not ours to handle.
			}
		};
		agent.addEventListener('message', onMessage);
		return () => {
			agent.removeEventListener('message', onMessage);
			clearTimeout(historyFallback.current);
		};
	}, [agent]);

	const busy = chat.isStreaming || chat.isRecovering || chat.status === 'submitted';
	const awaitingUser = chat.messages.some(m => m.parts.some(isAwaitingUser));

	// Thread titles are generated server-side once a turn lands, so refresh the list when one ends.
	const wasBusy = useRef(false);
	useEffect(() => {
		if (wasBusy.current && !busy) onTurnFinished();
		wasBusy.current = busy;
	}, [busy, onTurnFinished]);

	return { ...chat, busy, awaitingUser, historyLoaded };
}

export type ChatSession = ReturnType<typeof useChatSession>;
