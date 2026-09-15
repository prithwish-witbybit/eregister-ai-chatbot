import { useEffect, useState } from 'react';
import { PlusIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CompanySelect } from '@/components/sidebar/company-select';
import { ThreadList, type ThreadFilter } from '@/components/sidebar/thread-list';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/sidebar/user-menu';
import { isValidCompanyId } from '@/hooks/use-companies';
import type { ChatThread, Company } from '@/lib/api';

const FILTER_STORAGE_KEY = 'chat-web:threadFilter';

function readStoredFilter(): ThreadFilter {
	try {
		return localStorage.getItem(FILTER_STORAGE_KEY) === 'all' ? 'all' : 'mine';
	} catch {
		return 'mine';
	}
}

/** Mine/All choice for the thread list, remembered across reloads. */
function useThreadFilter() {
	const [filter, setFilter] = useState<ThreadFilter>(readStoredFilter);

	useEffect(() => {
		try {
			localStorage.setItem(FILTER_STORAGE_KEY, filter);
		} catch {
			// Storage blocked (private window) — the toggle still works for this session.
		}
	}, [filter]);

	return [filter, setFilter] as const;
}

const FILTER_OPTIONS: { value: ThreadFilter; label: string }[] = [
	{ value: 'mine', label: 'My chats' },
	{ value: 'all', label: 'All chats' }
];

function ThreadFilterToggle({ value, onChange }: { value: ThreadFilter; onChange: (value: ThreadFilter) => void }) {
	return (
		<div role='radiogroup' aria-label='Show chats' className='mb-3 grid grid-cols-2 gap-0.5 rounded-lg bg-muted p-0.5'>
			{FILTER_OPTIONS.map(option => (
				<button
					key={option.value}
					type='button'
					role='radio'
					aria-checked={value === option.value}
					onClick={() => onChange(option.value)}
					className={cn(
						'rounded-md px-2 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
						value === option.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}

interface ThreadSidebarProps {
	companies: Company[];
	companyId: string;
	loadingCompanies: boolean;
	onCompanyChange: (companyId: string) => void;
	threads: ChatThread[];
	activeThreadPid: string | null;
	opening: boolean;
	loadingThreads: boolean;
	onNewChat: () => void;
	onOpenThread: (threadPid: string) => void;
	onDeleteThread: (threadPid: string) => void;
	onRenameThread: (threadPid: string, title: string) => void;
	email: string | null;
	onSignOut: () => void;
}

export function ThreadSidebar({
	companies,
	companyId,
	loadingCompanies,
	onCompanyChange,
	threads,
	activeThreadPid,
	opening,
	loadingThreads,
	onNewChat,
	onOpenThread,
	onDeleteThread,
	onRenameThread,
	email,
	onSignOut
}: ThreadSidebarProps) {
	const [filter, setFilter] = useThreadFilter();
	const visibleThreads = filter === 'mine' ? threads.filter(t => t.isOwner) : threads;

	return (
		<aside className='flex h-full min-h-0 w-72 shrink-0 flex-col border-e border-sidebar-border bg-sidebar'>
			<div className='flex flex-col gap-3 p-3'>
				<div className='flex items-center gap-2 px-1'>
					<div className='flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground'>
						<SparklesIcon className='size-3.5' />
					</div>
					<span className='font-heading text-sm font-semibold'>eRegister AI</span>
				</div>

				<CompanySelect companies={companies} companyId={companyId} loading={loadingCompanies} onChange={onCompanyChange} />

				<Button
					className='w-full justify-center'
					disabled={!isValidCompanyId(companyId) || opening || loadingCompanies}
					onClick={onNewChat}
				>
					<PlusIcon />
					New chat
				</Button>
			</div>

			<Separator />

			<div className='min-h-0 flex-1 overflow-y-auto p-2'>
				<ThreadFilterToggle value={filter} onChange={setFilter} />
				<ThreadList
					threads={visibleThreads}
					filter={filter}
					onShowAll={() => setFilter('all')}
					activeThreadPid={activeThreadPid}
					disabled={opening}
					loading={loadingThreads}
					onOpen={onOpenThread}
					onDelete={onDeleteThread}
					onRename={onRenameThread}
				/>
			</div>

			<Separator />

			<div className='p-2'>
				<UserMenu email={email} onSignOut={onSignOut} />
			</div>
		</aside>
	);
}
