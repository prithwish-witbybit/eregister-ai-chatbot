import { useState } from 'react';
import { AlertCircleIcon, MessageSquarePlusIcon } from 'lucide-react';
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
	const { companies, companyId, setCompanyId } = useCompanies(getToken);
	const { threads, activeTicket, opening, error, clearError, open, remove, refresh } = useThreads(getToken, companyId);
	const [pendingDelete, setPendingDelete] = useState<string | null>(null);

	const activeThread = threads.find(thread => thread.publicId === activeTicket?.threadPid);

	return (
		<div className='flex h-full'>
			<ThreadSidebar
				companies={companies}
				companyId={companyId}
				onCompanyChange={setCompanyId}
				threads={threads}
				activeThreadPid={activeTicket?.threadPid ?? null}
				opening={opening}
				onNewChat={() => void open()}
				onOpenThread={threadPid => void open(threadPid)}
				onDeleteThread={setPendingDelete}
				email={email}
				onSignOut={() => void signOut()}
			/>

			<main className='flex min-h-0 min-w-0 flex-1 flex-col'>
				{activeTicket && (
					<header className='flex h-14 shrink-0 items-center border-b border-border px-6'>
						<h1 className='truncate font-heading text-sm font-medium'>{activeThread?.title ?? 'New chat'}</h1>
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
						onTurnFinished={refresh}
					/>
				) : (
					<NoThreadSelected canStart={isValidCompanyId(companyId)} busy={opening} onNewChat={() => void open()} />
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

function NoThreadSelected({ canStart, busy, onNewChat }: { canStart: boolean; busy: boolean; onNewChat: () => void }) {
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
