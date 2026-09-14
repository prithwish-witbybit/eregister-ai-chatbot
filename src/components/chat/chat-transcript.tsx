import type { UIMessage } from 'ai';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport
} from '@/components/ui/message-scroller';
import { Message, MessageContent } from '@/components/ui/message';
import { AssistantAvatar, ChatMessage } from '@/components/chat/chat-message';
import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatTranscriptSkeleton } from '@/components/chat/chat-transcript-skeleton';
import type { Answer } from '@/lib/message-parts';

interface ChatTranscriptProps {
	messages: UIMessage[];
	/** True between sending a message and the first token of the reply. */
	thinking: boolean;
	/** True while an existing thread's history is still in flight over the socket. */
	loadingHistory: boolean;
	onApproval: (approvalId: string, approved: boolean) => void;
	onAnswer: (toolCallId: string, answers: Answer[]) => void;
	onPickSuggestion: (prompt: string) => void;
}

function ThinkingIndicator() {
	return (
		<Message align='start'>
			<AssistantAvatar />
			<MessageContent>
				<div className='flex h-7 items-center gap-1'>
					{[0, 150, 300].map(delay => (
						<span
							key={delay}
							className='size-1.5 animate-bounce rounded-full bg-muted-foreground/60'
							style={{ animationDelay: `${delay}ms` }}
						/>
					))}
				</div>
			</MessageContent>
		</Message>
	);
}

export function ChatTranscript({ messages, thinking, loadingHistory, onApproval, onAnswer, onPickSuggestion }: ChatTranscriptProps) {
	if (loadingHistory) {
		return (
			<div className='flex-1 overflow-hidden'>
				<ChatTranscriptSkeleton />
			</div>
		);
	}

	return (
		<MessageScrollerProvider autoScroll defaultScrollPosition='last-anchor' scrollPreviousItemPeek={64}>
			<MessageScroller className='flex-1'>
				<MessageScrollerViewport>
					<MessageScrollerContent className='mx-auto w-full max-w-3xl px-4 py-6'>
						{messages.length === 0 && !thinking ? (
							<ChatEmptyState onPick={onPickSuggestion} />
						) : (
							<>
								{messages.map(message => (
									<MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === 'user'}>
										<ChatMessage message={message} onApproval={onApproval} onAnswer={onAnswer} />
									</MessageScrollerItem>
								))}
								{thinking && (
									<MessageScrollerItem messageId='thinking'>
										<ThinkingIndicator />
									</MessageScrollerItem>
								)}
							</>
						)}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton className='rounded-full shadow-md' />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}
