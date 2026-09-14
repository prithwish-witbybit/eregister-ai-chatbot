import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { config } from './config';
import { deleteThread, fetchTicket, listCompanies, listThreads, type ChatThread, type Company, type WsTicket } from './api';
import { ChatView } from './ChatView';
import { LoginScreen } from './LoginScreen';

const COMPANY_KEY = 'chat-web:companyId';

function readStoredCompany(): string {
	try {
		return localStorage.getItem(COMPANY_KEY) ?? '';
	} catch {
		return '';
	}
}

export function App() {
	const { status } = useAuth();
	if (status === 'loading') return <div className='center muted'>Loading…</div>;
	if (status === 'signed-out') return <LoginScreen />;
	return <Workspace />;
}

function Workspace() {
	const { getToken, email, signOut } = useAuth();
	const [companies, setCompanies] = useState<Company[]>([]);
	const [companyId, setCompanyId] = useState(readStoredCompany);
	const [threads, setThreads] = useState<ChatThread[]>([]);
	const [active, setActive] = useState<WsTicket | null>(null);
	const [opening, setOpening] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		listCompanies(getToken)
			.then(list => {
				setCompanies(list);
				setCompanyId(prev => (list.some(c => c.id === prev) ? prev : (list[0]?.id ?? prev)));
			})
			// Local no-auth mode may not resolve a user; the free-text company id field covers that.
			.catch(() => setCompanies([]));
	}, [getToken]);

	useEffect(() => {
		try {
			localStorage.setItem(COMPANY_KEY, companyId);
		} catch {
			// Storage blocked (private window) — the picker still works for this session.
		}
	}, [companyId]);

	const refreshThreads = useCallback(async () => {
		if (!/^\d+$/.test(companyId)) return setThreads([]);
		try {
			setThreads(await listThreads(getToken, companyId));
		} catch (err) {
			setError((err as Error).message);
		}
	}, [getToken, companyId]);

	useEffect(() => {
		setActive(null);
		void refreshThreads();
	}, [refreshThreads]);

	const open = async (threadPid?: string) => {
		setOpening(true);
		setError(null);
		try {
			setActive(await fetchTicket(getToken, companyId, threadPid));
			if (!threadPid) void refreshThreads();
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setOpening(false);
		}
	};

	const remove = async (threadPid: string) => {
		if (!confirm('Delete this chat?')) return;
		try {
			await deleteThread(getToken, companyId, threadPid);
			if (active?.threadPid === threadPid) setActive(null);
			await refreshThreads();
		} catch (err) {
			setError((err as Error).message);
		}
	};

	return (
		<div className='layout'>
			<aside className='sidebar'>
				<div className='sidebar-head'>
					{companies.length ? (
						<select value={companyId} onChange={e => setCompanyId(e.target.value)}>
							{companies.map(c => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
					) : (
						<input placeholder='Company id' value={companyId} onChange={e => setCompanyId(e.target.value.trim())} />
					)}
					<button className='primary' disabled={!/^\d+$/.test(companyId) || opening} onClick={() => void open()}>
						+ New chat
					</button>
				</div>
				<ul className='threads'>
					{threads.map(t => (
						<li key={t.publicId} className={active?.threadPid === t.publicId ? 'active' : ''}>
							<button className='thread' disabled={opening} onClick={() => void open(t.publicId)}>
								<span>{t.title ?? 'Untitled chat'}</span>
								<small>{new Date(t.createdOn).toLocaleString()}</small>
							</button>
							<button className='icon' title='Delete chat' onClick={() => void remove(t.publicId)}>
								×
							</button>
						</li>
					))}
				</ul>
				<div className='sidebar-foot'>
					<span className='muted'>{email}</span>
					{config.authEnabled && <button onClick={() => void signOut()}>Sign out</button>}
				</div>
			</aside>
			<main className='main'>
				{error && (
					<div className='banner error' onClick={() => setError(null)}>
						{error}
					</div>
				)}
				{active ? (
					<ChatView
						key={active.name}
						initialTicket={active}
						companyId={companyId}
						getToken={getToken}
						onTurnFinished={refreshThreads}
					/>
				) : (
					<div className='center muted'>{companyId ? 'Pick a chat or start a new one.' : 'Choose a company.'}</div>
				)}
			</main>
		</div>
	);
}
