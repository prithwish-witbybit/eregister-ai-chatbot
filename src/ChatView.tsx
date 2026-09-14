import { Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useAgent } from 'agents/react';
import { getToolApproval, getToolPartState, useAgentChat } from 'agents/chat/react';
import { getToolName, isToolUIPart, type DynamicToolUIPart, type ToolUIPart, type UIMessage } from 'ai';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchTicket, type GetToken, type WsTicket } from './api';
import { config } from './config';

interface ChatViewProps {
	initialTicket: WsTicket;
	companyId: string;
	getToken: GetToken;
	onTurnFinished: () => void;
}

type ToolPart = ToolUIPart | DynamicToolUIPart;
type AskUserInput = { questions?: { prompt: string; options?: string[] }[] };
type Answer = { prompt: string; answer: string };

const wsUrl = new URL(config.wsBase);

const STATE_LABEL: Record<ReturnType<typeof getToolPartState>, string> = {
	loading: 'running',
	streaming: 'preparing',
	'waiting-approval': 'needs approval',
	approved: 'approved',
	complete: 'done',
	error: 'error',
	denied: 'rejected'
};

const isAwaitingUser = (part: UIMessage['parts'][number]): boolean =>
	isToolUIPart(part) && ((getToolName(part) === 'ask_user' && part.state === 'input-available') || part.state === 'approval-requested');

// useAgent resolves its async query through React `use()`, so the first render suspends.
export function ChatView(props: ChatViewProps) {
	return (
		<Suspense fallback={<div className='center muted'>Connecting…</div>}>
			<Chat {...props} />
		</Suspense>
	);
}

function Chat({ initialTicket, companyId, getToken, onTurnFinished }: ChatViewProps) {
	const [ticket, setTicket] = useState(initialTicket);
	const renewing = useRef(false);

	// Tickets live 60s and are checked only at WebSocket upgrade. Renewing on close (not on a timer) means a
	// healthy socket is never torn down, while a reconnect after a drop gets a ticket the worker will accept.
	const renewIfExpired = useCallback(async () => {
		if (renewing.current || Date.parse(ticket.expiresAt) - Date.now() > 5_000) return;
		renewing.current = true;
		try {
			setTicket(await fetchTicket(getToken, companyId, ticket.threadPid));
		} catch {
			// Next close retries; the status line already shows the connection error.
		} finally {
			renewing.current = false;
		}
	}, [ticket, getToken, companyId]);

	const agent = useAgent({
		agent: ticket.agent,
		name: ticket.name,
		host: wsUrl.host,
		protocol: wsUrl.protocol === 'wss:' ? 'wss' : 'ws',
		query: async () => ({ ticket: ticket.ticket }),
		queryDeps: [ticket.ticket],
		// A fresh ticket changes queryDeps; a TTL-driven re-query would only force needless reconnects.
		cacheTtl: 24 * 60 * 60 * 1000,
		onClose: () => void renewIfExpired()
	});

	// History arrives over the socket on connect; the HTTP /get-messages fetch would need CORS on the ai-chat worker.
	const {
		messages,
		sendMessage,
		stop,
		status,
		error,
		addToolOutput,
		addToolApprovalResponse,
		isStreaming,
		isRecovering,
		connectionError
	} = useAgentChat({ agent, getInitialMessages: null });

	const busy = isStreaming || isRecovering || status === 'submitted';
	const pending = messages.some(m => m.parts.some(isAwaitingUser));

	const wasBusy = useRef(false);
	useEffect(() => {
		if (wasBusy.current && !busy) onTurnFinished();
		wasBusy.current = busy;
	}, [busy, onTurnFinished]);

	const bottomRef = useRef<HTMLDivElement>(null);
	useEffect(() => bottomRef.current?.scrollIntoView({ block: 'end' }), [messages]);

	const [draft, setDraft] = useState('');
	const send = () => {
		const text = draft.trim();
		if (!text || busy || pending) return;
		setDraft('');
		void sendMessage({ text });
	};
	const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
			e.preventDefault();
			send();
		}
	};

	const statusText = connectionError
		? 'Connection lost — reconnecting…'
		: error
			? error.message
			: isRecovering
				? 'Recovering interrupted turn…'
				: busy
					? 'Thinking…'
					: pending
						? 'Waiting for your answer above.'
						: '';

	return (
		<div className='chat'>
			<div className='messages'>
				{messages.length === 0 && (
					<div className='muted'>Ask about your registers and data, or ask it to build a report, action, or register.</div>
				)}
				{messages.map(m => (
					<Message
						key={m.id}
						message={m}
						onApproval={(id, approved) => void addToolApprovalResponse({ id, approved })}
						onAnswer={(toolCallId, answers) => addToolOutput({ toolCallId, toolName: 'ask_user', output: { answers } })}
					/>
				))}
				<div ref={bottomRef} />
			</div>
			<div className='status'>{statusText}</div>
			<div className='composer'>
				<textarea
					rows={2}
					placeholder={pending ? 'Answer the question above first' : 'Message (Enter to send, Shift+Enter for a new line)'}
					value={draft}
					disabled={pending}
					onChange={e => setDraft(e.target.value)}
					onKeyDown={onKeyDown}
				/>
				{busy ? (
					<button onClick={() => void stop()}>Stop</button>
				) : (
					<button className='primary' disabled={!draft.trim() || pending} onClick={send}>
						Send
					</button>
				)}
			</div>
		</div>
	);
}

interface MessageProps {
	message: UIMessage;
	onApproval: (approvalId: string, approved: boolean) => void;
	onAnswer: (toolCallId: string, answers: Answer[]) => void;
}

function Message({ message, onApproval, onAnswer }: MessageProps) {
	if (message.role === 'system') return null;
	if (message.role === 'user') {
		return <div className='msg user'>{message.parts.map(p => (p.type === 'text' ? p.text : '')).join('')}</div>;
	}
	return (
		<div className='msg assistant'>
			{message.parts.map((part, i) => {
				if (part.type === 'text')
					return (
						<Markdown key={i} remarkPlugins={[remarkGfm]}>
							{part.text}
						</Markdown>
					);
				if (isToolUIPart(part)) return <ToolCard key={part.toolCallId} part={part} onApproval={onApproval} onAnswer={onAnswer} />;
				return null;
			})}
		</div>
	);
}

function ToolCard({ part, onApproval, onAnswer }: { part: ToolPart } & Omit<MessageProps, 'message'>) {
	const name = getToolName(part);
	const state = getToolPartState(part);
	const approval = state === 'waiting-approval' ? getToolApproval(part) : undefined;
	const askingUser = name === 'ask_user' && part.state === 'input-available';
	const needsUser = askingUser || !!approval;

	return (
		<details className={`tool${needsUser ? ' pending' : ''}`} open={needsUser || undefined}>
			<summary>
				<code>{name}</code>
				<span className={`tag ${state}`}>{STATE_LABEL[state]}</span>
			</summary>
			<div className='tool-body'>
				{askingUser ? (
					<AskUserForm input={part.input as AskUserInput} onSubmit={answers => onAnswer(part.toolCallId, answers)} />
				) : (
					<Payload value={part.input} />
				)}
				{approval && (
					<div className='tool-actions'>
						<button className='primary' onClick={() => onApproval(approval.id, true)}>
							Apply
						</button>
						<button className='danger' onClick={() => onApproval(approval.id, false)}>
							Reject
						</button>
					</div>
				)}
				{part.state === 'output-available' && <Payload value={part.output} />}
				{part.state === 'output-error' && <pre className='error'>{part.errorText}</pre>}
			</div>
		</details>
	);
}

function AskUserForm({ input, onSubmit }: { input: AskUserInput; onSubmit: (answers: Answer[]) => void }) {
	const questions = input?.questions ?? [];
	const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
	const set = (i: number, value: string) => setAnswers(prev => prev.map((a, j) => (j === i ? value : a)));
	const ready = answers.every(a => a.trim());

	return (
		<form
			className='ask'
			onSubmit={e => {
				e.preventDefault();
				if (ready) onSubmit(questions.map((q, i) => ({ prompt: q.prompt, answer: answers[i].trim() })));
			}}
		>
			{questions.map((q, i) => (
				<div key={i} className='ask'>
					<label>{q.prompt}</label>
					{!!q.options?.length && (
						<div className='tool-actions'>
							{q.options.map(opt => (
								<button type='button' key={opt} className={answers[i] === opt ? 'primary' : ''} onClick={() => set(i, opt)}>
									{opt}
								</button>
							))}
						</div>
					)}
					<input
						placeholder={q.options?.length ? 'Or type an answer' : 'Your answer'}
						value={answers[i]}
						onChange={e => set(i, e.target.value)}
					/>
				</div>
			))}
			<div>
				<button type='submit' className='primary' disabled={!ready}>
					Send answer
				</button>
			</div>
		</form>
	);
}

type RenderedFile = { label: string; content: string };

// Pulls `files: [{ name, content }]` out of write_codeblock / build_action payloads so source renders as code,
// not escaped-newline JSON. Same rule as scripts/chat-cli.ts.
function extractFiles(value: unknown, owner: string, out: RenderedFile[]): unknown {
	if (Array.isArray(value)) return value.map(v => extractFiles(v, owner, out));
	if (!value || typeof value !== 'object') return value;
	const obj = value as Record<string, unknown>;
	const label = typeof obj.key === 'string' ? obj.key : typeof obj.name === 'string' ? obj.name : owner;
	const stripped: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (k === 'files' && Array.isArray(v)) {
			for (const f of v) {
				const { name, content } = (f ?? {}) as { name?: unknown; content?: unknown };
				if (typeof content === 'string') out.push({ label: `${label} / ${typeof name === 'string' ? name : 'file'}`, content });
			}
			stripped[k] = `[${v.length} file(s) below]`;
		} else {
			stripped[k] = extractFiles(v, label, out);
		}
	}
	return stripped;
}

function Payload({ value }: { value: unknown }) {
	if (value === undefined) return null;
	const files: RenderedFile[] = [];
	const stripped = extractFiles(value, 'file', files);
	return (
		<>
			<pre>{typeof stripped === 'string' ? stripped : JSON.stringify(stripped, null, 2)}</pre>
			{files.map((f, i) => (
				<div key={i}>
					<div className='muted'>{f.label}</div>
					<pre>{f.content}</pre>
				</div>
			))}
		</>
	);
}
