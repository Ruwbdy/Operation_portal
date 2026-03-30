import React, { Component, ReactNode, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';
import { PageStoreProvider } from './store/pageStore';
import { initializeDAMapping } from './services/da/da.mapping';
import { ROLES } from './services/auth.service';
import { isAuthenticated, hasRole } from './services/auth.service';

// Pages that should stay mounted to preserve state & in-flight requests
// are imported eagerly (not lazy) so they're available immediately
import Dashboard from './pages/Dashboard';
import ChargingProfile from './pages/UserSupport/ChargingProfile';
import BalanceAndCDR from './pages/UserSupport/BalanceAndCDR';
import DataBundle from './pages/UserSupport/DataBundle';
import ServiceDesk from './pages/INSupport/ServiceDesk';
import DSA from './pages/INSupport/DSA';
import InOps from './pages/INSupport/InOps';

// Auth page is fine to lazy-load — it doesn't need to stay mounted
const Login = lazy(() => import('./pages/Login'));

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryProps { children?: ReactNode }
interface ErrorBoundaryState { hasError: boolean }

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong.</h2>
          <p className="text-gray-600 mb-4">The application encountered an unexpected error.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-[#FFCC00] rounded-lg hover:bg-gray-800 transition-colors font-bold"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Keep-Alive Page Wrapper ──────────────────────────────────────────────────
// Renders children but hides them when not on the matching path.
// The component stays mounted so async operations continue running.

function KeepAlive({ path, exact = false, children }: {
  path: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === path
    : location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className={isActive ? '' : 'hidden'} aria-hidden={!isActive}>
      {children}
    </div>
  );
}

// ─── Authenticated App Shell ──────────────────────────────────────────────────
// All authenticated pages are rendered simultaneously and shown/hidden via CSS.
// This means:
//  • A fetch started on page A continues while you browse to page B
//  • All state (loaded data, scroll position, active tab) is preserved
//  • State is only cleared on a full page reload

function AuthenticatedApp() {
  const inSupport = isAuthenticated() && hasRole(ROLES.IN_SUPPORT);

  return (
    <>
      <KeepAlive path="/" exact>
        <Dashboard />
      </KeepAlive>

      <KeepAlive path="/user-support/charging-profile" exact>
        <ChargingProfile />
      </KeepAlive>

      <KeepAlive path="/user-support/balance-cdr" exact>
        <BalanceAndCDR />
      </KeepAlive>

      <KeepAlive path="/user-support/data-bundle" exact>
        <DataBundle />
      </KeepAlive>

      {inSupport && (
        <>
          <KeepAlive path="/in-support/dsa" exact>
            <DSA />
          </KeepAlive>
          <KeepAlive path="/in-support/service-desk" exact>
            <ServiceDesk />
          </KeepAlive>
          <KeepAlive path="/in-support/ops" exact>
            <InOps />
          </KeepAlive>
        </>
      )}
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  React.useEffect(() => {
    initializeDAMapping().catch(error => {
      console.error('Failed to initialize DA mapping:', error);
    });
  }, []);

  return (
    <AppErrorBoundary>
      <PageStoreProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* All authenticated pages live under one ProtectedRoute.
                KeepAlive handles the path matching internally. */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AuthenticatedApp />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </PageStoreProvider>
    </AppErrorBoundary>
  );
}