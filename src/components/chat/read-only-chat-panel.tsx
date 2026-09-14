import { EyeIcon } from 'lucide-react';
import { ChatTranscript } from '@/components/chat/chat-transcript';
import { ChatTranscriptSkeleton } from '@/components/chat/chat-transcript-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReadOnlyThread } from '@/hooks/use-read-only-thread';
import type { ReadTicket } from '@/lib/api';

interface ReadOnlyChatPanelProps {
	ticket: ReadTicket;
	ownerName: string | null;
}

const noop = () => {};

/** Static, non-interactive view of another company user's thread — see aiChatRoutes.ts's docblock. */
export function ReadOnlyChatPanel({ ticket, ownerName }: ReadOnlyChatPanelProps) {
	const { messages, loading, error } = useReadOnlyThread(ticket);

	return (
		<div className='flex min-h-0 flex-1 flex-col'>
			<Alert className='mx-4 mt-4 w-auto'>
				<EyeIcon />
				<AlertDescription>Viewing {ownerName ?? 'another user'}&apos;s chat — read-only.</AlertDescription>
			</Alert>

			{error ? (
				<Alert variant='destructive' className='mx-4 mt-4 w-auto'>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : loading ? (
				<div className='flex-1 overflow-hidden'>
					<ChatTranscriptSkeleton />
				</div>
			) : (
				<ChatTranscript
					messages={messages}
					thinking={false}
					loadingHistory={false}
					streaming={false}
					onApproval={noop}
					onAnswer={noop}
					onPickSuggestion={noop}
				/>
			)}
		</div>
	);
}
