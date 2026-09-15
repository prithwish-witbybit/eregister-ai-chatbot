import { useEffect, useSyncExternalStore } from 'react';
import { getHighlighter, loadHighlighter, subscribeHighlighter } from '@/lib/highlighter';

/** The shared Shiki highlighter, or null until it has loaded. Starts loading once `enabled` is true. */
export function useHighlighter(enabled: boolean) {
	const highlighter = useSyncExternalStore(subscribeHighlighter, getHighlighter);

	useEffect(() => {
		if (enabled && !highlighter) loadHighlighter().catch(() => {});
	}, [enabled, highlighter]);

	return highlighter;
}
