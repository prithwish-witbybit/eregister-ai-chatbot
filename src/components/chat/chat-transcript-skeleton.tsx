import { Skeleton } from '@/components/ui/skeleton';

/** Mimics the transcript layout while an existing thread's history is still loading over the socket. */
export function ChatTranscriptSkeleton() {
	return (
		<div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6'>
			<div className='flex justify-end'>
				<Skeleton className='h-9 w-2/5 rounded-2xl' />
			</div>
			<div className='flex gap-2'>
				<Skeleton className='size-7 shrink-0 rounded-full' />
				<div className='flex w-3/5 flex-col gap-2 pt-1'>
					<Skeleton className='h-3.5 w-full' />
					<Skeleton className='h-3.5 w-11/12' />
					<Skeleton className='h-3.5 w-2/3' />
				</div>
			</div>
			<div className='flex justify-end'>
				<Skeleton className='h-9 w-1/3 rounded-2xl' />
			</div>
		</div>
	);
}
