import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Company } from '@/lib/api';

interface CompanySelectProps {
	companies: Company[];
	companyId: string;
	loading: boolean;
	onChange: (companyId: string) => void;
}

export function CompanySelect({ companies, companyId, loading, onChange }: CompanySelectProps) {
	if (loading) return <Skeleton className='h-8 w-full rounded-lg' />;

	// Local no-auth mode can't resolve the user's companies, so fall back to entering the id directly.
	if (!companies.length) {
		return (
			<Input
				className='h-8'
				placeholder='Company id'
				value={companyId}
				onChange={event => onChange(event.target.value.trim())}
			/>
		);
	}

	return (
		<Select
			items={companies.map(company => ({ label: company.name, value: company.id }))}
			value={companyId}
			onValueChange={value => onChange(String(value ?? ''))}
		>
			<SelectTrigger className='w-full'>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{companies.map(company => (
					<SelectItem key={company.id} value={company.id}>
						{company.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
