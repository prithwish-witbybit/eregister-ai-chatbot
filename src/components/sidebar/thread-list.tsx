import { MessageSquareIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatThreadTime, groupThreadsByDate } from '@/lib/format';
import type { ChatThread } from '@/lib/api';

interface ThreadListProps {
	threads: ChatThread[];
	activeThreadPid: string | null;
	disabled: boolean;
	onOpen: (threadPid: string) => void;
	onDelete: (threadPid: string) => void;
}

export function ThreadList({ threads, activeThreadPid, disabled, onOpen, onDelete }: ThreadListProps) {
	if (!threads.length) {
		return (
			<p className='px-3 py-6 text-center text-xs text-muted-foreground'>
				No chats yet. Start one to see it here.
			</p>
		);
	}

	return (
		<div className='flex flex-col gap-4'>
			{groupThreadsByDate(threads).map(group => (
				<div key={group.label} className='flex flex-col gap-0.5'>
					<h3 className='px-2 pb-1 text-xs font-medium text-muted-foreground'>{group.label}</h3>
					{group.threads.map(thread => (
						<ThreadRow
							key={thread.publicId}
							thread={thread}
							active={thread.publicId === activeThreadPid}
							disabled={disabled}
							onOpen={() => onOpen(thread.publicId)}
							onDelete={() => onDelete(thread.publicId)}
						/>
					))}
				</div>
			))}
		</div>
	);
}

interface ThreadRowProps {
	thread: ChatThread;
	active: boolean;
	disabled: boolean;
	onOpen: () => void;
	onDelete: () => void;
}

function ThreadRow({ thread, active, disabled, onOpen, onDelete }: ThreadRowProps) {
	return (
		<div
			className={cn(
				'group/thread relative flex items-center rounded-lg transition-colors',
				active ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/60'
			)}
		>
			<button
				type='button'
				disabled={disabled}
				onClick={onOpen}
				className='flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'
			>
				<MessageSquareIcon className={cn('size-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />
				<span className='min-w-0 flex-1 truncate text-sm'>{thread.title ?? 'Untitled chat'}</span>
				<span className='shrink-0 text-xs text-muted-foreground tabular-nums group-hover/thread:invisible'>
					{formatThreadTime(thread.createdOn)}
				</span>
			</button>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant='ghost'
							size='icon-sm'
							aria-label='Chat options'
							className='invisible absolute end-1 rounded-md group-hover/thread:visible data-[popup-open]:visible'
						/>
					}
				>
					<MoreHorizontalIcon />
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-auto'>
					<DropdownMenuItem variant='destructive' onClick={onDelete}>
						<Trash2Icon />
						Delete chat
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
