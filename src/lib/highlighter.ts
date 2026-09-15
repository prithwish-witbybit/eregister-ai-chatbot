import type { HighlighterCore, ThemedToken } from 'shiki/core';

/**
 * Syntax highlighting via Shiki, loaded on first use so it stays out of the main bundle.
 * Only the grammars the agent actually writes are bundled; the JavaScript regex engine avoids
 * shipping Oniguruma's WASM.
 */

const ALIASES: Record<string, string> = {
	ts: 'typescript',
	typescript: 'typescript',
	tsx: 'tsx',
	js: 'javascript',
	javascript: 'javascript',
	mjs: 'javascript',
	cjs: 'javascript',
	jsx: 'jsx',
	json: 'json',
	sh: 'bash',
	shell: 'bash',
	bash: 'bash',
	zsh: 'bash',
	sql: 'sql'
};

/** Maps a markdown fence tag (or file extension) to a loaded grammar, or null when we don't highlight it. */
export function resolveLanguage(language: string | null | undefined): string | null {
	return language ? (ALIASES[language.toLowerCase()] ?? null) : null;
}

export function languageFromFilename(filename: string): string | null {
	return resolveLanguage(filename.match(/\.([a-z0-9]+)$/i)?.[1]);
}

let highlighter: HighlighterCore | null = null;
let loading: Promise<HighlighterCore> | null = null;
const listeners = new Set<() => void>();

export function loadHighlighter(): Promise<HighlighterCore> {
	loading ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')])
		.then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
			createHighlighterCore({
				themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
				langs: [
					import('shiki/langs/typescript.mjs'),
					import('shiki/langs/tsx.mjs'),
					import('shiki/langs/javascript.mjs'),
					import('shiki/langs/jsx.mjs'),
					import('shiki/langs/json.mjs'),
					import('shiki/langs/bash.mjs'),
					import('shiki/langs/sql.mjs')
				],
				engine: createJavaScriptRegexEngine()
			})
		)
		.then(loaded => {
			highlighter = loaded;
			listeners.forEach(listener => listener());
			return loaded;
		})
		.catch(err => {
			// Let a later code block retry; until then blocks render as plain text.
			loading = null;
			throw err;
		});
	return loading;
}

export function getHighlighter(): HighlighterCore | null {
	return highlighter;
}

export function subscribeHighlighter(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * Tokenises with both themes at once: each token carries the light colour as `color` and the dark
 * one as `--shiki-dark`, which styles.css swaps in under `.dark` — no re-highlight on theme change.
 */
export function tokenize(loaded: HighlighterCore, code: string, language: string): ThemedToken[][] | null {
	try {
		return loaded.codeToTokens(code, { lang: language, themes: { light: 'github-light', dark: 'github-dark' } }).tokens;
	} catch {
		return null;
	}
}
