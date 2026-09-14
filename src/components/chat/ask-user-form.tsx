import { useState } from 'react';
import { SendHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Answer, AskUserInput } from '@/lib/message-parts';

interface AskUserFormProps {
	input: AskUserInput;
	onSubmit: (answers: Answer[]) => void;
}

/** Renders the agent's `ask_user` questions and collects one answer per question. */
export function AskUserForm({ input, onSubmit }: AskUserFormProps) {
	const questions = input?.questions ?? [];
	const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));

	const setAnswer = (index: number, value: string) => setAnswers(prev => prev.map((a, i) => (i === index ? value : a)));
	const ready = answers.length > 0 && answers.every(a => a.trim());

	return (
		<form
			className='flex flex-col gap-4'
			onSubmit={event => {
				event.preventDefault();
				if (ready) onSubmit(questions.map((q, i) => ({ prompt: q.prompt, answer: answers[i].trim() })));
			}}
		>
			{questions.map((question, index) => (
				<div key={index} className='flex flex-col gap-2'>
					<label className='text-sm font-medium'>{question.prompt}</label>
					{!!question.options?.length && (
						<div className='flex flex-wrap gap-1.5'>
							{question.options.map(option => (
								<Button
									key={option}
									type='button'
									size='sm'
									variant={answers[index] === option ? 'default' : 'outline'}
									onClick={() => setAnswer(index, option)}
								>
									{option}
								</Button>
							))}
						</div>
					)}
					<Input
						placeholder={question.options?.length ? 'Or type an answer' : 'Your answer'}
						value={answers[index]}
						onChange={event => setAnswer(index, event.target.value)}
					/>
				</div>
			))}
			<div>
				<Button type='submit' size='sm' disabled={!ready}>
					<SendHorizontalIcon />
					Send answer
				</Button>
			</div>
		</form>
	);
}
