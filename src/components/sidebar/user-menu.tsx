import { LogOutIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { config } from '@/lib/config';

export function UserMenu({ email, onSignOut }: { email: string | null; onSignOut: () => void }) {
	const label = email ?? 'Signed in';
	const initial = label.trim().charAt(0).toUpperCase() || '?';

	const account = (
		<div className='flex min-w-0 flex-1 items-center gap-2'>
			<Avatar className='size-6'>
				<AvatarFallback className='text-xs'>{initial}</AvatarFallback>
			</Avatar>
			<span className='min-w-0 flex-1 truncate text-start text-xs text-muted-foreground'>{label}</span>
		</div>
	);

	if (!config.authEnabled) return <div className='flex items-center px-2 py-1.5'>{account}</div>;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant='ghost' className='h-auto w-full justify-start px-2 py-1.5' aria-label='Account' />}
			>
				{account}
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' className='w-(--anchor-width)'>
				<DropdownMenuItem onClick={onSignOut}>
					<LogOutIcon />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
