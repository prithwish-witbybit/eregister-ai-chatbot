import { useLayoutEffect, useRef, useState } from 'react';
import { isToolUIPart, type UIMessage } from 'ai';
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from 'lucide-react';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import { MarkdownContent } from '@/components/chat/markdown-content';
import { ToolCallCard } from '@/components/chat/tool-call-card';
import { messageText, type Answer } from '@/lib/message-parts';
import { cn } from '@/lib/utils';

// Collapse only when there's meaningfully more to hide than a line or two past the clamp (max-h-80).
const COLLAPSE_THRESHOLD_PX = 400;

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

/** A user turn, clamped with a fade when it's long — pasted code otherwise fills the whole transcript. */
function UserMessageText({ text }: { text: string }) {
	const textRef = useRef<HTMLDivElement>(null);
	const [overflowing, setOverflowing] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const collapsed = overflowing && !expanded;

	// scrollHeight reports the full content height even while clamped, so this is stable across toggles.
	useLayoutEffect(() => {
		const el = textRef.current;
		if (!el) return;
		const measure = () => setOverflowing(el.scrollHeight > COLLAPSE_THRESHOLD_PX);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, [text]);

	return (
		<BubbleContent className='flex flex-col gap-1.5'>
			<div ref={textRef} className={cn('relative whitespace-pre-wrap', collapsed && 'max-h-80 overflow-hidden')}>
				{text}
				{collapsed && <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-primary to-transparent' />}
			</div>
			{overflowing && (
				<button
					type='button'
					aria-expanded={expanded}
					onClick={() => setExpanded(value => !value)}
					className='flex items-center gap-1 self-start rounded text-xs font-medium text-primary-foreground/80 outline-none hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50'
				>
					{expanded ? <ChevronUpIcon className='size-3.5' /> : <ChevronDownIcon className='size-3.5' />}
					{expanded ? 'Show less' : 'Show more'}
				</button>
			)}
		</BubbleContent>
	);
}

export function ChatMessage({ message, onApproval, onAnswer }: ChatMessageProps) {
	if (message.role === 'system') return null;

	if (message.role === 'user') {
		return (
			<Message align='end'>
				<MessageContent>
					<Bubble>
						<UserMessageText text={messageText(message)} />
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
