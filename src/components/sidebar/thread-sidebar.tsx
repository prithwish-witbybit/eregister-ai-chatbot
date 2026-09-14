import { PlusIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CompanySelect } from '@/components/sidebar/company-select';
import { ThreadList } from '@/components/sidebar/thread-list';
import { UserMenu } from '@/components/sidebar/user-menu';
import { isValidCompanyId } from '@/hooks/use-companies';
import type { ChatThread, Company } from '@/lib/api';

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
				<ThreadList
					threads={threads}
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
