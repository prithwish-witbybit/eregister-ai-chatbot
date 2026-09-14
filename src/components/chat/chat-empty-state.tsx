import { BarChart3Icon, ListChecksIcon, SparklesIcon, TableIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

const SUGGESTIONS = [
	{ icon: TableIcon, label: 'Summarise my registers', prompt: 'Give me a summary of the registers in this company.' },
	{ icon: BarChart3Icon, label: 'Build a report', prompt: 'Build a report showing entries from the last 30 days.' },
	{ icon: ListChecksIcon, label: 'Create an action', prompt: 'Create an action that notifies me when a new entry is added.' }
];

/** Opening screen of an empty thread: what the agent can do, plus one-tap starters. */
export function ChatEmptyState({ onPick }: { onPick: (prompt: string) => void }) {
	return (
		<Empty className='my-auto'>
			<EmptyHeader>
				<EmptyMedia variant='icon' className='size-10 rounded-xl bg-primary/10 text-primary'>
					<SparklesIcon className='size-5' />
				</EmptyMedia>
				<EmptyTitle className='text-base'>How can I help?</EmptyTitle>
				<EmptyDescription>
					Ask about your registers and data, or ask me to build a report, an action, or a whole new register.
				</EmptyDescription>
			</EmptyHeader>
			<div className='flex flex-wrap justify-center gap-2'>
				{SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
					<Button key={label} variant='outline' size='sm' onClick={() => onPick(prompt)}>
						<Icon />
						{label}
					</Button>
				))}
			</div>
		</Empty>
	);
}
