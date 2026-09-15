import { BarChart3Icon, BracesIcon, DatabaseIcon, LayoutTemplateIcon, ScanSearchIcon, SparklesIcon, ZapIcon } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

// Picking one sends `prompt` straight away, so each must stand on its own. The agent can ask
// follow-up questions, so prompts leave register-specific details for it to ask about.
const SUGGESTIONS = [
	{
		icon: DatabaseIcon,
		label: 'Create a register',
		description: 'Design fields for something new to track',
		prompt: 'Help me create a new register. Ask me what I want to track, then propose the fields and their types before building it.'
	},
	{
		icon: BracesIcon,
		label: 'Write a code block',
		description: 'Validate or calculate values on save',
		prompt: 'Write a code block for one of my registers — for example validation rules or a calculated field. Ask me which register and what it should do.'
	},
	{
		icon: LayoutTemplateIcon,
		label: 'Design a layout',
		description: 'Arrange a form into clear sections',
		prompt: 'Design a layout for one of my registers that groups related fields into sections. Ask me which register to use.'
	},
	{
		icon: BarChart3Icon,
		label: 'Build a report',
		description: 'Summarise entries by status or date',
		prompt: 'Build a report showing entries from the last 30 days, grouped by status. Ask me which register to report on.'
	},
	{
		icon: ZapIcon,
		label: 'Create an action',
		description: 'Automate notifications and updates',
		prompt: 'Create an action that notifies someone when a new entry is added. Ask me which register and who should be notified.'
	},
	{
		icon: ScanSearchIcon,
		label: 'Explore my registers',
		description: 'See what exists in this company',
		prompt: 'Give me a summary of the registers in this company — what each one tracks and roughly how many entries it has.'
	}
];

/** Opening screen of an empty thread: what the agent can do, plus one-tap starters. */
export function ChatEmptyState({ onPick }: { onPick: (prompt: string) => void }) {
	return (
		<Empty className='my-auto gap-6'>
			<EmptyHeader>
				<EmptyMedia variant='icon' className='size-10 rounded-lg bg-primary/10 text-primary'>
					<SparklesIcon className='size-5' />
				</EmptyMedia>
				<EmptyTitle className='text-base'>How can I help?</EmptyTitle>
				<EmptyDescription>Build registers, layouts, code blocks, reports and actions — or ask about your data.</EmptyDescription>
			</EmptyHeader>
			<div className='grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
				{SUGGESTIONS.map(({ icon: Icon, label, description, prompt }) => (
					<button
						key={label}
						type='button'
						onClick={() => onPick(prompt)}
						className='group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-start transition-colors outline-none hover:border-foreground/20 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50'
					>
						<Icon className='mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary' />
						<span className='flex min-w-0 flex-col gap-0.5'>
							<span className='text-sm font-medium text-foreground'>{label}</span>
							<span className='text-xs text-muted-foreground'>{description}</span>
						</span>
					</button>
				))}
			</div>
		</Empty>
	);
}
