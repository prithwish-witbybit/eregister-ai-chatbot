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
import { cn } from '@/lib/utils';
import type { Answer } from '@/lib/message-parts';

interface ChatTranscriptProps {
	messages: UIMessage[];
	/** True between sending a message and the first token of the reply. */
	thinking: boolean;
	/** True while an existing thread's history is still in flight over the socket. */
	loadingHistory: boolean;
	/** True for the whole turn — parks the scrollbar so the reveal doesn't resize the thumb. */
	streaming: boolean;
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

export function ChatTranscript({ messages, thinking, loadingHistory, streaming, onApproval, onAnswer, onPickSuggestion }: ChatTranscriptProps) {
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
				{/*
				  The reveal grows the content a word at a time, and every growth re-measures the
				  thumb — which reads as the scrollbar twitching for the length of the reply. Parking
				  its colors hides that; `scrollbar-gutter-stable` on the viewport means the track
				  still occupies its space, so nothing reflows when the thumb comes back.
				*/}
				<MessageScrollerViewport
					className={cn(streaming && 'scrollbar-thumb-transparent scrollbar-track-transparent hover:scrollbar-thumb-transparent')}
				>
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
