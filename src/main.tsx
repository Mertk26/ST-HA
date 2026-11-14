import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';
import './theme.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { message: string | null }> {
  state: { message: string | null } = { message: null };
  static getDerivedStateFromError(error: Error) { return { message: error.message }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Application render failure', error, info); }
  render() {
    if (this.state.message) return <main className="fatal-error"><h1>The workspace could not be displayed.</h1><p role="alert">{this.state.message}</p><p>No healthy-state fallback has been substituted. Reload to reopen your saved records.</p><button onClick={() => location.reload()}>Reload application</button></main>;
    return this.props.children;
  }
}
const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');
createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
