import { getToolPartState } from 'agents/chat/react';
import { getToolName, isToolUIPart, type DynamicToolUIPart, type ToolUIPart, type UIMessage } from 'ai';

export type MessagePart = UIMessage['parts'][number];
export type ToolPart = ToolUIPart | DynamicToolUIPart;
export type ToolState = ReturnType<typeof getToolPartState>;

/** Input shape of the agent's `ask_user` tool. */
export interface AskUserInput {
	questions?: { prompt: string; options?: string[] }[];
}

export interface Answer {
	prompt: string;
	answer: string;
}

export const ASK_USER_TOOL = 'ask_user';

export const TOOL_STATE_LABEL: Record<ToolState, string> = {
	loading: 'Running',
	streaming: 'Preparing',
	'waiting-approval': 'Needs approval',
	approved: 'Approved',
	complete: 'Done',
	error: 'Error',
	denied: 'Rejected'
};

export function isToolRunning(state: ToolState): boolean {
	return state === 'loading' || state === 'streaming';
}

export function isToolFailed(state: ToolState): boolean {
	return state === 'error' || state === 'denied';
}

/** True while a tool part blocks the turn on the user answering a question or approving a call. */
export function isAwaitingUser(part: MessagePart): boolean {
	if (!isToolUIPart(part)) return false;
	return (getToolName(part) === ASK_USER_TOOL && part.state === 'input-available') || part.state === 'approval-requested';
}

export function isAskingUser(part: ToolPart): boolean {
	return getToolName(part) === ASK_USER_TOOL && part.state === 'input-available';
}

export interface RenderedFile {
	label: string;
	content: string;
}

/**
 * Pulls `files: [{ name, content }]` out of write_codeblock / build_action payloads so source
 * renders as code rather than escaped-newline JSON. Same rule as scripts/chat-cli.ts.
 */
export function extractFiles(value: unknown, owner: string, out: RenderedFile[]): unknown {
	if (Array.isArray(value)) return value.map(v => extractFiles(v, owner, out));
	if (!value || typeof value !== 'object') return value;

	const obj = value as Record<string, unknown>;
	const label = typeof obj.key === 'string' ? obj.key : typeof obj.name === 'string' ? obj.name : owner;
	const stripped: Record<string, unknown> = {};

	for (const [key, v] of Object.entries(obj)) {
		if (key === 'files' && Array.isArray(v)) {
			for (const file of v) {
				const { name, content } = (file ?? {}) as { name?: unknown; content?: unknown };
				if (typeof content === 'string') out.push({ label: `${label} / ${typeof name === 'string' ? name : 'file'}`, content });
			}
			stripped[key] = `[${v.length} file(s) below]`;
		} else {
			stripped[key] = extractFiles(v, label, out);
		}
	}

	return stripped;
}

/** Splits a payload into its JSON skeleton and any file blobs lifted out of it. */
export function splitPayload(value: unknown): { json: unknown; files: RenderedFile[] } {
	const files: RenderedFile[] = [];
	return { json: extractFiles(value, 'file', files), files };
}

export function messageText(message: UIMessage): string {
	return message.parts.map(part => (part.type === 'text' ? part.text : '')).join('');
}
