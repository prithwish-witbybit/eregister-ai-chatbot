import { Suspense } from 'react';
import { AlertCircleIcon, LoaderIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatComposer } from '@/components/chat/chat-composer';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import { useChatSession } from '@/hooks/use-chat-session';
import type { GetToken, WsTicket } from '@/lib/api';

interface ChatPanelProps {
	initialTicket: WsTicket;
	companyId: string;
	getToken: GetToken;
	onTurnFinished: () => void;
}

function ConnectingState() {
	return (
		<div className='flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground'>
			<LoaderIcon className='size-4 animate-spin' />
			Connecting…
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

function Conversation({ initialTicket, companyId, getToken, onTurnFinished }: ChatPanelProps) {
	const chat = useChatSession({ initialTicket, companyId, getToken, onTurnFinished });
	const { messages, busy, awaitingUser, error, connectionError, isRecovering } = chat;

	const lastMessage = messages[messages.length - 1];
	const thinking = busy && lastMessage?.role !== 'assistant';

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
