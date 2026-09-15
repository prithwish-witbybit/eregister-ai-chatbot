import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '@/App';
import { AuthProvider } from '@/providers/auth-provider';
import { watchSystemTheme } from '@/lib/theme';
import '@/styles.css';

watchSystemTheme();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>
);
