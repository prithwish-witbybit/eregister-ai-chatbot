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
}

export interface WsTicket {
	ticket: string;
	expiresAt: string;
	threadPid: string;
	agent: string;
	name: string;
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

/** Omit threadPid to create a new thread; the returned ticket names it. */
export async function fetchTicket(getToken: GetToken, companyId: string, threadPid?: string): Promise<WsTicket> {
	const body = await request<Envelope<WsTicket>>(getToken, `${chatPath(companyId)}/ws-ticket`, {
		method: 'POST',
		body: JSON.stringify(threadPid ? { threadPid } : {})
	});
	return body.data;
}
