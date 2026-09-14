import { isToolUIPart, type UIMessage } from 'ai';
import { SparklesIcon } from 'lucide-react';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { ToolCallCard } from '@/components/chat/tool-call-card';
import { messageText, type Answer } from '@/lib/message-parts';

interface ChatMessageProps {
	message: UIMessage;
	onApproval: (approvalId: string, approved: boolean) => void;
	onAnswer: (toolCallId: string, answers: Answer[]) => void;
}

/** Assistant turns can be several parts tall, so the avatar tracks the top rather than the bubble baseline. */
export function AssistantAvatar() {
	return (
		<MessageAvatar className='size-7 min-w-0 self-start bg-primary/10 text-primary'>
			<SparklesIcon className='size-3.5' />
		</MessageAvatar>
	);
}

export function ChatMessage({ message, onApproval, onAnswer }: ChatMessageProps) {
	if (message.role === 'system') return null;

	if (message.role === 'user') {
		return (
			<Message align='end'>
				<MessageContent>
					<Bubble>
						<BubbleContent className='whitespace-pre-wrap'>{messageText(message)}</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
		);
	}

	return (
		<Message align='start'>
			<AssistantAvatar />
			<MessageContent>
				{message.parts.map((part, index) => {
					if (part.type === 'text' && part.text.trim()) {
						return (
							<Bubble key={index} variant='ghost'>
								<BubbleContent>
									<MarkdownContent streaming={part.state === 'streaming'}>{part.text}</MarkdownContent>
								</BubbleContent>
							</Bubble>
						);
					}

					if (isToolUIPart(part)) {
						return <ToolCallCard key={part.toolCallId} part={part} onApproval={onApproval} onAnswer={onAnswer} />;
					}

					return null;
				})}
			</MessageContent>
		</Message>
	);
}
