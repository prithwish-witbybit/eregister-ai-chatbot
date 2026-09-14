import { useState, type KeyboardEvent } from 'react';
import { ArrowUpIcon, SquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatComposerProps {
	/** Blocks sending while the agent is mid-turn; the button becomes Stop. */
	busy: boolean;
	/** The agent asked a question in the transcript, so the composer stands down until it is answered. */
	awaitingUser: boolean;
	onSend: (text: string) => void;
	onStop: () => void;
}

export function ChatComposer({ busy, awaitingUser, onSend, onStop }: ChatComposerProps) {
	const [draft, setDraft] = useState('');
	const canSend = !!draft.trim() && !busy && !awaitingUser;

	const send = () => {
		if (!canSend) return;
		onSend(draft.trim());
		setDraft('');
	};

	const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			send();
		}
	};

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'>
				<Textarea
					rows={1}
					value={draft}
					disabled={awaitingUser}
					placeholder={awaitingUser ? 'Answer the question above to continue' : 'Ask anything about your registers…'}
					className='max-h-48 min-h-9 resize-none border-none bg-transparent py-1.5 shadow-none focus-visible:border-none focus-visible:ring-0 dark:bg-transparent dark:disabled:bg-transparent'
					onChange={event => setDraft(event.target.value)}
					onKeyDown={onKeyDown}
				/>
				{busy ? (
					<Button size='icon' variant='secondary' className='rounded-full' aria-label='Stop generating' onClick={onStop}>
						<SquareIcon className='fill-current' />
					</Button>
				) : (
					<Button size='icon' className='rounded-full' aria-label='Send message' disabled={!canSend} onClick={send}>
						<ArrowUpIcon />
					</Button>
				)}
			</div>
			<p className='px-1 text-center text-xs text-muted-foreground'>
				Enter to send, Shift + Enter for a new line. The agent can make mistakes — check important results.
			</p>
		</div>
	);
}
