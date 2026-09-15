import { Fragment, useMemo, type CSSProperties } from 'react';
import { CopyButton } from '@/components/chat/copy-button';
import { useHighlighter } from '@/hooks/use-highlighter';
import { resolveLanguage, tokenize } from '@/lib/highlighter';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
	code: string;
	/** Fence tag or grammar name; unknown or missing languages render as plain text. */
	language?: string | null;
	/** Applied to the wrapper — use for outer spacing. */
	className?: string;
	/** Applied to the `<pre>` — use for height limits and background. */
	preClassName?: string;
}

/** Shiki's inline styles are CSS declarations (`font-style`, `--shiki-dark`); React wants camelCase for real properties. */
function toReactStyle(style: Record<string, string> | undefined, color: string | undefined): CSSProperties | undefined {
	if (!style) return color ? { color } : undefined;
	return Object.fromEntries(
		Object.entries(style).map(([key, value]) => [key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), value])
	) as CSSProperties;
}

/**
 * Highlighted, copyable code. Renders plain text until the highlighter has loaded, then swaps in
 * coloured tokens in place — same text, same metrics, so nothing shifts.
 */
export function CodeBlock({ code, language, className, preClassName }: CodeBlockProps) {
	const grammar = resolveLanguage(language);
	const highlighter = useHighlighter(grammar !== null);
	const lines = useMemo(
		() => (highlighter && grammar ? tokenize(highlighter, code, grammar) : null),
		[highlighter, grammar, code]
	);

	return (
		<div data-slot='code-block' className={cn('group/code relative', className)}>
			<pre className={cn('overflow-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed whitespace-pre', preClassName)}>
				<code>
					{lines
						? lines.map((line, i) => (
								<Fragment key={i}>
									{i > 0 && '\n'}
									{line.map((token, j) => (
										<span key={j} className='shiki-token' style={toReactStyle(token.htmlStyle, token.color)}>
											{token.content}
										</span>
									))}
								</Fragment>
							))
						: code}
				</code>
			</pre>
			{/* Inset past a vertical scrollbar so the two don't overlap. */}
			<CopyButton getText={() => code} className='absolute top-2 end-4' />
		</div>
	);
}
