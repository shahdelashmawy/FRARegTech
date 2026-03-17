import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './lib/i18n';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import reportWebVitals from './reportWebVitals';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a2744',
              color: '#fff',
              borderLeft: '4px solid #c9a84c',
            },
            success: {
              style: {
                borderLeft: '4px solid #22c55e',
              },
            },
            error: {
              style: {
                borderLeft: '4px solid #ef4444',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
