import type { ChatThread } from '@/lib/api';

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatThreadTime(iso: string): string {
	const date = new Date(iso);
	const elapsed = Date.now() - date.getTime();

	if (elapsed < DAY_MS) return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
	if (elapsed < 7 * DAY_MS) return date.toLocaleDateString(undefined, { weekday: 'short' });
	return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Buckets threads into the date headings a chat sidebar shows, newest first, dropping empty buckets. */
export function groupThreadsByDate(threads: ChatThread[]): { label: string; threads: ChatThread[] }[] {
	const buckets: { label: string; maxAgeMs: number; threads: ChatThread[] }[] = [
		{ label: 'Today', maxAgeMs: DAY_MS, threads: [] },
		{ label: 'Previous 7 days', maxAgeMs: 7 * DAY_MS, threads: [] },
		{ label: 'Previous 30 days', maxAgeMs: 30 * DAY_MS, threads: [] },
		{ label: 'Older', maxAgeMs: Infinity, threads: [] }
	];

	const sorted = [...threads].sort((a, b) => Date.parse(b.createdOn) - Date.parse(a.createdOn));
	for (const thread of sorted) {
		const elapsed = Date.now() - Date.parse(thread.createdOn);
		buckets.find(bucket => elapsed < bucket.maxAgeMs)?.threads.push(thread);
	}

	return buckets.filter(bucket => bucket.threads.length > 0).map(({ label, threads }) => ({ label, threads }));
}
