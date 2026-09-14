/**
 * shadcn styles dark mode off a `.dark` class, so mirror the OS preference onto the
 * document. Swap this for a stored preference when a manual theme toggle is added.
 */
export function watchSystemTheme(): void {
	const query = window.matchMedia('(prefers-color-scheme: dark)');
	const apply = () => document.documentElement.classList.toggle('dark', query.matches);
	apply();
	query.addEventListener('change', apply);
}
