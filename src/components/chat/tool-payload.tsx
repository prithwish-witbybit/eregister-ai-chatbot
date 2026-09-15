import { CodeBlock } from '@/components/chat/code-block';
import { languageFromFilename } from '@/lib/highlighter';
import { splitPayload } from '@/lib/message-parts';

const PAYLOAD_PRE =
	'max-h-90 scrollbar-thin scrollbar-thumb-muted-foreground/25 scrollbar-track-transparent bg-muted/60 transition-colors hover:scrollbar-thumb-muted-foreground/45';

/** Renders a tool's input or output, lifting any embedded file contents into their own code blocks. */
export function ToolPayload({ value }: { value: unknown }) {
	if (value === undefined) return null;
	const { json, files } = splitPayload(value);

	return (
		<>
			{typeof json === 'string' ? (
				<CodeBlock code={json} preClassName={PAYLOAD_PRE} />
			) : (
				<CodeBlock code={JSON.stringify(json, null, 2)} language='json' preClassName={PAYLOAD_PRE} />
			)}
			{files.map((file, i) => (
				<div key={i} className='flex flex-col gap-1'>
					<span className='font-mono text-xs text-muted-foreground'>{file.label}</span>
					<CodeBlock code={file.content} language={languageFromFilename(file.label)} preClassName={PAYLOAD_PRE} />
				</div>
			))}
		</>
	);
}
