import { splitPayload } from '@/lib/message-parts';

function CodeBlock({ children }: { children: string }) {
	return (
		<pre className='max-h-90 scrollbar-thin scrollbar-thumb-muted-foreground/25 scrollbar-track-transparent overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed whitespace-pre transition-colors hover:scrollbar-thumb-muted-foreground/45'>
			{children}
		</pre>
	);
}

/** Renders a tool's input or output, lifting any embedded file contents into their own code blocks. */
export function ToolPayload({ value }: { value: unknown }) {
	if (value === undefined) return null;
	const { json, files } = splitPayload(value);

	return (
		<>
			<CodeBlock>{typeof json === 'string' ? json : JSON.stringify(json, null, 2)}</CodeBlock>
			{files.map((file, i) => (
				<div key={i} className='flex flex-col gap-1'>
					<span className='font-mono text-xs text-muted-foreground'>{file.label}</span>
					<CodeBlock>{file.content}</CodeBlock>
				</div>
			))}
		</>
	);
}
