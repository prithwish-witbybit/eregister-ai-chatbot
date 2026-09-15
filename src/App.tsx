import { useEffect, useRef, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { AlertCircleIcon, CheckIcon, LinkIcon, MessageSquarePlusIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { LoginScreen } from '@/components/auth/login-screen';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ReadOnlyChatPanel } from '@/components/chat/read-only-chat-panel';
import { ThreadSidebar } from '@/components/sidebar/thread-sidebar';
import { useCompanies, isValidCompanyId } from '@/hooks/use-companies';
import { useThreads } from '@/hooks/use-threads';
import { useAuth } from '@/providers/auth-provider';

export function App() {
	const { status } = useAuth();

	if (status === 'loading') {
		return (
			<div className='grid min-h-full place-items-center'>
				<Spinner className='size-5 text-muted-foreground' />
			</div>
		);
	}

	return status === 'signed-out' ? <LoginScreen /> : <Workspace />;
}

function Workspace() {
	const { getToken, email, signOut } = useAuth();
	const { companies, companyId, setCompanyId, loading: loadingCompanies } = useCompanies(getToken);
	const {
		threads,
		threadsCompanyId,
		activeTicket,
		activeReadTicket,
		isNewThread,
		opening,
		loadingThreads,
		error,
		clearError,
		open,
		close,
		remove,
		rename,
		refresh
	} = useThreads(getToken, companyId);
	const [pendingDelete, setPendingDelete] = useState<string | null>(null);

	const activeThreadPid = activeTicket?.threadPid ?? activeReadTicket?.threadPid ?? null;
	const activeThread = threads.find(thread => thread.publicId === activeThreadPid);

	// The URL is the shareable record of what's open: /companies/:companyId[/chats/:threadPid].
	const navigate = useNavigate();
	const chatMatch = useMatch('/companies/:companyId/chats/:threadPid');
	const companyMatch = useMatch('/companies/:companyId');
	const routeCompanyId = chatMatch?.params.companyId ?? companyMatch?.params.companyId ?? null;
	const routeThreadPid = chatMatch?.params.threadPid ?? null;
	// Thread the URL asks for, held until that company's thread list has loaded — `open` needs it
	// to tell the caller's own threads (full ticket) from other users' (read-only ticket).
	const pendingThreadPid = useRef<string | null>(null);

	// URL → state. Runs only when the URL changes: sidebar clicks, back/forward, or a pasted link.
	useEffect(() => {
		if (routeCompanyId && routeCompanyId !== companyId) setCompanyId(routeCompanyId);
		pendingThreadPid.current = routeThreadPid;
		if (!routeThreadPid) close();
		// Deliberately keyed on the URL alone — reacting to `companyId` would undo the picker.
	}, [routeCompanyId, routeThreadPid]);

	useEffect(() => {
		const target = pendingThreadPid.current;
		if (!target || opening || threadsCompanyId !== companyId || routeCompanyId !== companyId) return;
		pendingThreadPid.current = null;
		if (target === activeThreadPid) return;
		void open(target).then(opened => {
			// Deleted, or no access — don't leave a URL pointing at a chat that isn't shown.
			if (!opened) navigate(`/companies/${companyId}`, { replace: true });
		});
	}, [routeThreadPid, routeCompanyId, companyId, threadsCompanyId, opening, activeThreadPid, open, navigate]);

	// State → URL for company changes made outside the URL: the picker, or falling back to the
	// first company when the stored/linked one isn't accessible. Also normalises `/` and unknown paths.
	useEffect(() => {
		if (isValidCompanyId(companyId) && routeCompanyId !== companyId) navigate(`/companies/${companyId}`, { replace: true });
		// Deliberately keyed on the company alone — reacting to the URL would fight back/forward.
	}, [companyId]);

	const threadPath = (threadPid: string) => `/companies/${companyId}/chats/${encodeURIComponent(threadPid)}`;

	const startNewChat = () =>
		void open().then(threadPid => {
			if (threadPid) navigate(threadPath(threadPid));
		});

	return (
		<div className='flex h-full'>
			<ThreadSidebar
				companies={companies}
				companyId={companyId}
				loadingCompanies={loadingCompanies}
				onCompanyChange={setCompanyId}
				threads={threads}
				activeThreadPid={activeThreadPid}
				opening={opening}
				loadingThreads={loadingThreads}
				onNewChat={startNewChat}
				onOpenThread={threadPid => navigate(threadPath(threadPid))}
				onDeleteThread={setPendingDelete}
				onRenameThread={(threadPid, title) => void rename(threadPid, title)}
				email={email}
				onSignOut={() => void signOut()}
			/>

			<main className='flex min-h-0 min-w-0 flex-1 flex-col'>
				{(activeTicket || activeReadTicket) && (
					<header className='flex h-14 shrink-0 items-center gap-2 border-b border-border px-6'>
						<h1 className='min-w-0 flex-1 truncate font-heading text-sm font-medium'>{activeThread?.title ?? 'New chat'}</h1>
						<CopyLinkButton />
					</header>
				)}

				{error && (
					<Alert variant='destructive' className='mx-6 mt-4 w-auto' onClick={clearError}>
						<AlertCircleIcon />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{activeTicket ? (
					<ChatPanel
						key={activeTicket.name}
						initialTicket={activeTicket}
						companyId={companyId}
						getToken={getToken}
						isNewThread={isNewThread}
						onTurnFinished={refresh}
					/>
				) : activeReadTicket ? (
					<ReadOnlyChatPanel key={activeReadTicket.name} ticket={activeReadTicket} ownerName={activeThread?.ownerName ?? null} />
				) : (
					<NoThreadSelected
						canStart={isValidCompanyId(companyId)}
						loading={loadingCompanies}
						busy={opening}
						onNewChat={startNewChat}
					/>
				)}
			</main>

			<AlertDialog open={pendingDelete !== null} onOpenChange={isOpen => !isOpen && setPendingDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this chat?</AlertDialogTitle>
						<AlertDialogDescription>This permanently removes the conversation and its history.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant='destructive'
							onClick={() => {
								if (pendingDelete === routeThreadPid) navigate(`/companies/${companyId}`, { replace: true });
								if (pendingDelete) void remove(pendingDelete);
								setPendingDelete(null);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function CopyLinkButton() {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [copied]);

	return (
		<Button
			variant='ghost'
			size='sm'
			onClick={() => void navigator.clipboard.writeText(window.location.href).then(() => setCopied(true))}
		>
			{copied ? <CheckIcon /> : <LinkIcon />}
			{copied ? 'Copied' : 'Copy link'}
		</Button>
	);
}

interface NoThreadSelectedProps {
	canStart: boolean;
	loading: boolean;
	busy: boolean;
	onNewChat: () => void;
}

function NoThreadSelected({ canStart, loading, busy, onNewChat }: NoThreadSelectedProps) {
	if (loading) {
		return (
			<div className='flex flex-1 items-center justify-center'>
				<Spinner className='size-5 text-muted-foreground' />
			</div>
		);
	}

	return (
		<Empty className='flex-1'>
			<EmptyHeader>
				<EmptyMedia variant='icon' className='size-10 rounded-xl'>
					<MessageSquarePlusIcon className='size-5' />
				</EmptyMedia>
				<EmptyTitle className='text-base'>{canStart ? 'No chat open' : 'Choose a company'}</EmptyTitle>
				<EmptyDescription>
					{canStart
						? 'Pick a conversation from the sidebar, or start a new one.'
						: 'Select a company to load its chats and start talking to your registers.'}
				</EmptyDescription>
			</EmptyHeader>
			{canStart && (
				<Button disabled={busy} onClick={onNewChat}>
					<MessageSquarePlusIcon />
					New chat
				</Button>
			)}
		</Empty>
	);
}
