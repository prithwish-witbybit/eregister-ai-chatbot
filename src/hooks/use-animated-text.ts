import { useEffect, useRef, useState } from 'react';

/** Index just past the next whole word at or after `from`. Leading whitespace rides along with it. */
function wordEnd(text: string, from: number): number {
	let i = from;
	while (i < text.length && /\s/.test(text[i])) i++;
	while (i < text.length && !/\s/.test(text[i])) i++;
	return i;
}

/**
 * Reveals `text` one word at a time, decoupled from the batched updates the agent socket
 * actually delivers. Only animates text that was genuinely observed mid-stream — a message
 * loaded from thread history starts (and stays) `isStreaming: false`, so it renders in full
 * immediately rather than replaying the reveal over content that already exists.
 */
export function useAnimatedText(text: string, isStreaming: boolean): string {
	const everStreamed = useRef(isStreaming);
	if (isStreaming) everStreamed.current = true;

	const [visible, setVisible] = useState(() => (isStreaming ? 0 : text.length));

	useEffect(() => {
		if (!everStreamed.current || visible >= text.length) return;

		// The further behind the reveal is, the faster it steps — a large batch lands promptly
		// instead of crawling, while a steady trickle keeps an even reading pace.
		const behind = text.length - visible;
		const delay = behind > 600 ? 8 : behind > 200 ? 18 : 36;

		const id = setTimeout(() => setVisible(v => wordEnd(text, v)), delay);
		return () => clearTimeout(id);
	}, [text, visible]);

	return text.slice(0, visible);
}
