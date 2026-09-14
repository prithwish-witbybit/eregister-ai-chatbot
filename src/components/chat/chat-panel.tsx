import { Suspense } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import { ChatTranscriptSkeleton } from '@/components/chat/chat-transcript-skeleton';
import { useChatSession } from '@/hooks/use-chat-session';
import type { GetToken, WsTicket } from '@/lib/api';

interface ChatPanelProps {
	initialTicket: WsTicket;
	companyId: string;
	getToken: GetToken;
	/** Skips the "loading history" skeleton — a freshly created thread has nothing to wait for. */
	isNewThread: boolean;
	onTurnFinished: () => void;
}

/**
 * `useAgent`'s query resolves through `use()`, so the socket handshake suspends this whole
 * subtree. The skeleton here is what's on screen for that handshake; `ChatTranscript` takes
 * over with the same skeleton once the socket is open but history hasn't arrived yet, so there's
 * no visual seam between "connecting" and "loading history".
 */
function ConnectingState() {
	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<div className='flex-1 overflow-hidden'>
				<ChatTranscriptSkeleton />
			</div>
		</div>
	);
}

/** The conversation for one thread. Remounted per thread by its key in the workspace. */
export function ChatPanel(props: ChatPanelProps) {
	return (
		<Suspense fallback={<ConnectingState />}>
			<Conversation {...props} />
		</Suspense>
	);
}

function Conversation({ initialTicket, companyId, getToken, isNewThread, onTurnFinished }: ChatPanelProps) {
	const chat = useChatSession({ initialTicket, companyId, getToken, onTurnFinished });
	const { messages, busy, awaitingUser, error, connectionError, isRecovering } = chat;

	const lastMessage = messages[messages.length - 1];
	const thinking = busy && lastMessage?.role !== 'assistant';
	const loadingHistory = !isNewThread && messages.length === 0;

	const notice = connectionError
		? 'Connection lost — reconnecting…'
		: error
			? error.message
			: isRecovering
				? 'Recovering interrupted turn…'
				: null;

	const send = (text: string) => void chat.sendMessage({ text });

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<ChatTranscript
				messages={messages}
				thinking={thinking}
				loadingHistory={loadingHistory}
				onApproval={(id, approved) => void chat.addToolApprovalResponse({ id, approved })}
				onAnswer={(toolCallId, answers) => chat.addToolOutput({ toolCallId, toolName: 'ask_user', output: { answers } })}
				onPickSuggestion={send}
			/>

			<div className='mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-2 px-4 pb-4'>
				{notice && (
					<Alert variant='destructive'>
						<AlertCircleIcon />
						<AlertDescription>{notice}</AlertDescription>
					</Alert>
				)}
				<ChatComposer busy={busy} awaitingUser={awaitingUser} onSend={send} onStop={() => void chat.stop()} />
			</div>
		</div>
	);
}
