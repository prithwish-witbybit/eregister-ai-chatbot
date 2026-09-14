import { useEffect, useState } from 'react';
import { listCompanies, type Company, type GetToken } from '@/lib/api';

const STORAGE_KEY = 'chat-web:companyId';

function readStoredCompany(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

export function isValidCompanyId(companyId: string): boolean {
	return /^\d+$/.test(companyId);
}

/** Loads the user's companies and remembers the selected one across reloads. */
export function useCompanies(getToken: GetToken) {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [companyId, setCompanyId] = useState(readStoredCompany);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		listCompanies(getToken)
			.then(list => {
				setCompanies(list);
				setCompanyId(prev => (list.some(c => c.id === prev) ? prev : (list[0]?.id ?? prev)));
			})
			// Local no-auth mode may not resolve a user; the free-text company id field covers that.
			.catch(() => setCompanies([]))
			.finally(() => setLoading(false));
	}, [getToken]);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, companyId);
		} catch {
			// Storage blocked (private window) — the picker still works for this session.
		}
	}, [companyId]);

	return { companies, companyId, setCompanyId, loading };
}
