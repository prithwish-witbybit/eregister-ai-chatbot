import { getToolApproval, getToolPartState } from 'agents/chat/react';
import { getToolName } from 'ai';
import { CheckIcon, ChevronRightIcon, WrenchIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';
import { AskUserForm } from '@/components/chat/ask-user-form';
import { ToolPayload } from '@/components/chat/tool-payload';
import { cn } from '@/lib/utils';
import {
	isAskingUser,
	isToolFailed,
	isToolRunning,
	TOOL_STATE_LABEL,
	type Answer,
	type AskUserInput,
	type ToolPart
} from '@/lib/message-parts';

interface ToolCallCardProps {
	part: ToolPart;
	onApproval: (approvalId: string, approved: boolean) => void;
	onAnswer: (toolCallId: string, answers: Answer[]) => void;
}

/** One tool invocation, collapsed by default and expanded automatically when it needs the user. */
export function ToolCallCard({ part, onApproval, onAnswer }: ToolCallCardProps) {
	const name = getToolName(part);
	const state = getToolPartState(part);
	const approval = state === 'waiting-approval' ? getToolApproval(part) : undefined;
	const askingUser = isAskingUser(part);
	// Keyed off the state, not the resolved approval, so the card still reads as blocked
	// during the tick before the approval metadata arrives.
	const needsUser = askingUser || state === 'waiting-approval';

	return (
		<Collapsible
			defaultOpen={needsUser}
			className={cn(
				'w-full overflow-hidden rounded-xl border bg-card transition-colors',
				needsUser ? 'border-primary/40 bg-primary/5' : 'border-border'
			)}
		>
			<CollapsibleTrigger
				className={cn(
					'group flex w-full items-center gap-2 px-3 py-2 text-start text-sm outline-none',
					'hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50'
				)}
			>
				<ChevronRightIcon className='size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90' />
				<WrenchIcon className='size-3.5 shrink-0 text-muted-foreground' />
				<span className='min-w-0 flex-1 truncate font-mono text-xs'>{name}</span>
				{isToolRunning(state) && !askingUser && <Spinner className='size-3.5 text-muted-foreground' />}
				<Badge variant={isToolFailed(state) ? 'destructive' : needsUser ? 'default' : 'secondary'} className='shrink-0'>
					{askingUser ? 'Needs your answer' : TOOL_STATE_LABEL[state]}
				</Badge>
			</CollapsibleTrigger>

			<CollapsibleContent className='flex flex-col gap-2 border-t border-border/60 p-3'>
				{askingUser ? (
					<AskUserForm input={part.input as AskUserInput} onSubmit={answers => onAnswer(part.toolCallId, answers)} />
				) : (
					<ToolPayload value={part.input} />
				)}

				{approval && (
					<div className='flex flex-wrap gap-2'>
						<Button size='sm' onClick={() => onApproval(approval.id, true)}>
							<CheckIcon />
							Apply
						</Button>
						<Button size='sm' variant='outline' onClick={() => onApproval(approval.id, false)}>
							<XIcon />
							Reject
						</Button>
					</div>
				)}

				{part.state === 'output-available' && <ToolPayload value={part.output} />}
				{part.state === 'output-error' && (
					<pre className='overflow-x-auto rounded-lg bg-destructive/10 p-3 font-mono text-xs text-destructive'>{part.errorText}</pre>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
