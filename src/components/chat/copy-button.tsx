import { useEffect, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
	/** Read at click time, so callers can copy what's rendered right now (e.g. a streaming block). */
	getText: () => string;
	label?: string;
	className?: string;
}

/**
 * Icon button that copies text and confirms with a check. Revealed on hover of the nearest
 * `group/code` ancestor on pointer devices; always visible on touch, where there's no hover.
 */
export function CopyButton({ getText, label = 'Copy code', className }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [copied]);

	return (
		<button
			type='button'
			aria-label={copied ? 'Copied' : label}
			title={copied ? 'Copied' : label}
			onClick={() => void navigator.clipboard.writeText(getText()).then(() => setCopied(true))}
			className={cn(
				'flex size-7 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground backdrop-blur-sm transition-[opacity,color] outline-none hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50',
				'pointer-fine:opacity-0 pointer-fine:group-hover/code:opacity-100',
				copied && 'text-foreground pointer-fine:opacity-100',
				className
			)}
		>
			{copied ? <CheckIcon className='size-3.5' /> : <CopyIcon className='size-3.5' />}
		</button>
	);
}
