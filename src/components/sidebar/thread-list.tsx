import { useState } from 'react';
import { MessageSquareIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatThreadTime, groupThreadsByDate } from '@/lib/format';
import type { ChatThread } from '@/lib/api';

// Matches ai_chat_threads.title VARCHAR(200).
const TITLE_MAX_LENGTH = 200;

export type ThreadFilter = 'mine' | 'all';

interface ThreadListProps {
	/** Already filtered; `filter` only picks the empty-state wording. */
	threads: ChatThread[];
	filter: ThreadFilter;
	onShowAll: () => void;
	activeThreadPid: string | null;
	disabled: boolean;
	/** First load of the list for this company — distinct from `disabled`, which just blocks clicks. */
	loading: boolean;
	onOpen: (threadPid: string) => void;
	onDelete: (threadPid: string) => void;
	onRename: (threadPid: string, title: string) => void;
}

function ThreadListSkeleton() {
	return (
		<div className='flex flex-col gap-0.5 px-2 py-1'>
			{[85, 65, 90, 50].map((width, i) => (
				<div key={i} className='flex items-center gap-2 px-0 py-2'>
					<Skeleton className='size-3.5 shrink-0 rounded-full' />
					<Skeleton className='h-3.5' style={{ width: `${width}%` }} />
				</div>
			))}
		</div>
	);
}

export function ThreadList({ threads, filter, onShowAll, activeThreadPid, disabled, loading, onOpen, onDelete, onRename }: ThreadListProps) {
	if (loading && !threads.length) return <ThreadListSkeleton />;

	if (!threads.length && filter === 'mine') {
		return (
			<div className='flex flex-col items-center gap-1 px-3 py-6 text-center text-xs text-muted-foreground'>
				<p>You haven&apos;t started any chats yet.</p>
				<button type='button' onClick={onShowAll} className='font-medium text-foreground underline-offset-2 hover:underline'>
					Show all chats
				</button>
			</div>
		);
	}

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
							onRename={title => onRename(thread.publicId, title)}
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
	onRename: (title: string) => void;
}

function ThreadRow({ thread, active, disabled, onOpen, onDelete, onRename }: ThreadRowProps) {
	const [editing, setEditing] = useState(false);

	if (editing) {
		return (
			<RenameInput
				initialTitle={thread.title ?? ''}
				onSubmit={title => {
					setEditing(false);
					if (title !== thread.title) onRename(title);
				}}
				onCancel={() => setEditing(false)}
			/>
		);
	}

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
				onDoubleClick={() => thread.isOwner && setEditing(true)}
				className='flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'
			>
				<MessageSquareIcon className={cn('size-3.5 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />
				<span className='min-w-0 flex-1 truncate text-sm'>
					{thread.title ?? 'Untitled chat'}
					{!thread.isOwner && <span className='ms-1.5 text-xs text-muted-foreground'>— {thread.ownerName ?? 'other user'}</span>}
				</span>
				<span className='shrink-0 text-xs text-muted-foreground tabular-nums group-hover/thread:invisible'>
					{formatThreadTime(thread.createdOn)}
				</span>
			</button>

			{thread.isOwner && (
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
						<DropdownMenuItem onClick={() => setEditing(true)}>
							<PencilIcon />
							Rename chat
						</DropdownMenuItem>
						<DropdownMenuItem variant='destructive' onClick={onDelete}>
							<Trash2Icon />
							Delete chat
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}

interface RenameInputProps {
	initialTitle: string;
	onSubmit: (title: string) => void;
	onCancel: () => void;
}

function RenameInput({ initialTitle, onSubmit, onCancel }: RenameInputProps) {
	const [value, setValue] = useState(initialTitle);

	const commit = () => {
		const title = value.trim();
		if (title) onSubmit(title);
		else onCancel();
	};

	return (
		<div className='flex items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-1'>
			<MessageSquareIcon className='size-3.5 shrink-0 text-foreground' />
			<Input
				// Opened from the dropdown menu, which restores focus to its trigger on close; defer so the input wins.
				ref={el => {
					if (el && document.activeElement !== el) requestAnimationFrame(() => el.select());
				}}
				aria-label='Chat title'
				value={value}
				maxLength={TITLE_MAX_LENGTH}
				onChange={e => setValue(e.target.value)}
				onBlur={commit}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commit();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						onCancel();
					}
				}}
				className='h-7 px-1.5'
			/>
		</div>
	);
}
