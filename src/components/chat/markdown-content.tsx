import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAnimatedText } from '@/hooks/use-animated-text';
import { cn } from '@/lib/utils';

/**
 * react-markdown renders plain HTML tags, so the prose rhythm is applied with descendant
 * selectors here rather than per-element classes.
 */
const prose = cn(
	'min-w-0 text-sm leading-relaxed',
	'[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
	'[&_p]:my-2',
	'[&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold',
	'[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold',
	'[&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold',
	'[&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-0.5',
	'[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
	'[&_blockquote]:my-2 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground',
	'[&_hr]:my-4 [&_hr]:border-border',
	'[&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em]',
	'[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs',
	'[&_table]:my-2 [&_table]:block [&_table]:w-fit [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-xs',
	'[&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-start [&_th]:font-medium',
	'[&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:text-start'
);

interface MarkdownContentProps {
	children: string;
	/** True only while this part is actively receiving tokens — drives the word-by-word reveal. */
	streaming?: boolean;
	className?: string;
}

export function MarkdownContent({ children, streaming = false, className }: MarkdownContentProps) {
	const revealed = useAnimatedText(children, streaming);
	// The cursor outlives `streaming`: the last batch usually arrives well before the reveal has
	// caught up with it, and dropping the cursor at that moment reads as the reply having stalled.
	const revealing = streaming || revealed.length < children.length;

	return (
		<div className={cn(prose, revealing && 'md-streaming', className)}>
			<Markdown remarkPlugins={[remarkGfm]}>{revealed}</Markdown>
		</div>
	);
}
