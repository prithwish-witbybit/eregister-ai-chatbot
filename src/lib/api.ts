import type { UIMessage } from 'ai';
import { config } from '@/lib/config';

export type GetToken = () => Promise<string | undefined>;

export interface Company {
	id: string;
	name: string;
}

export interface ChatThread {
	publicId: string;
	title: string | null;
	createdOn: string;
	modifiedOn: string;
	/** Owner's company_users.name; null if that company_users row was removed. */
	ownerName: string | null;
	/** True when the signed-in user owns this thread. False means it's someone else's, visible read-only. */
	isOwner: boolean;
}

export interface WsTicket {
	ticket: string;
	expiresAt: string;
	threadPid: string;
	agent: string;
	name: string;
}

/** A 60s ticket good only for GET .../get-messages on the ai-chat worker — no WebSocket, no write tools. */
export interface ReadTicket extends WsTicket {
	isOwner: boolean;
}

interface Envelope<T> {
	isSuccess: boolean;
	message: string;
	data: T;
}

async function request<T>(getToken: GetToken, path: string, init: RequestInit = {}): Promise<T> {
	const token = await getToken();
	const res = await fetch(`${config.apiBase}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
	});
	const body = await res.json().catch(() => null);
	if (!res.ok) throw new Error(body?.message ?? `${res.status} ${res.statusText}`);
	return body as T;
}

const chatPath = (companyId: string) => `/api/p/companies/${encodeURIComponent(companyId)}/ai-chat`;

// /user-companies goes through callableWrapper, so it returns the bare payload rather than the chat routes' envelope.
export async function listCompanies(getToken: GetToken): Promise<Company[]> {
	const body = await request<{ companies: { info: { id: string; name: string } | null }[] }>(getToken, '/api/p/user-companies');
	return body.companies.flatMap(c => (c.info?.id ? [{ id: String(c.info.id), name: c.info.name }] : []));
}

export async function listThreads(getToken: GetToken, companyId: string): Promise<ChatThread[]> {
	return (await request<Envelope<ChatThread[]>>(getToken, `${chatPath(companyId)}/threads`)).data ?? [];
}

export async function deleteThread(getToken: GetToken, companyId: string, threadPid: string): Promise<void> {
	await request(getToken, `${chatPath(companyId)}/threads/${encodeURIComponent(threadPid)}`, { method: 'DELETE' });
}

export async function renameThread(getToken: GetToken, companyId: string, threadPid: string, title: string): Promise<void> {
	await request(getToken, `${chatPath(companyId)}/threads/${encodeURIComponent(threadPid)}`, {
		method: 'PATCH',
		body: JSON.stringify({ title })
	});
}

/** Omit threadPid to create a new thread; the returned ticket names it. */
export async function fetchTicket(getToken: GetToken, companyId: string, threadPid?: string): Promise<WsTicket> {
	const body = await request<Envelope<WsTicket>>(getToken, `${chatPath(companyId)}/ws-ticket`, {
		method: 'POST',
		body: JSON.stringify(threadPid ? { threadPid } : {})
	});
	return body.data;
}

/** Mints a read-only ticket for any thread in the company, including one the caller doesn't own. */
export async function fetchReadTicket(getToken: GetToken, companyId: string, threadPid: string): Promise<ReadTicket> {
	const body = await request<Envelope<ReadTicket>>(getToken, `${chatPath(companyId)}/threads/${encodeURIComponent(threadPid)}/read-ticket`, {
		method: 'POST'
	});
	return body.data;
}

/** http(s) origin the ai-chat worker itself answers on, derived from the ws(s) one used for the live socket. */
const chatWorkerHttpOrigin = config.wsBase.replace(/^ws/, 'http');

/** Fetches the transcript for a read ticket over plain HTTP (the same shape `useAgentChat` hydrates from on connect). */
export async function fetchReadOnlyMessages(ticket: ReadTicket): Promise<UIMessage[]> {
	const url = `${chatWorkerHttpOrigin}/agents/${ticket.agent}/${ticket.name}/get-messages?ticket=${encodeURIComponent(ticket.ticket)}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to load thread: ${res.status} ${res.statusText}`);
	const text = await res.text();
	// The ai-chat worker's get-messages route is agents-framework code; it returns the same UIMessage[] JSON useAgentChat hydrates from.
	return text.trim() ? (JSON.parse(text) as UIMessage[]) : [];
}
