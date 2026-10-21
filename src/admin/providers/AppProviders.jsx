import { PreferencesProvider } from './PreferencesProvider.jsx';

/**
 * Contexts of the admin dashboard. The React Query client, the UI kit and toasts
 * come from the website's root layout; the admin panel adds its own dictionaries.
 */
export function AppProviders({ children }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}
