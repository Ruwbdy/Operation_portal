import React, { Component, ReactNode, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChargingProfile = lazy(() => import('./pages/UserSupport/ChargingProfile'));
const BalanceAndCDR = lazy(() => import('./pages/UserSupport/BalanceAndCDR'));
const DataBundle = lazy(() => import('./pages/UserSupport/DataBundle'));
const DCLM = lazy(() => import('./pages/INSupport/DCLM'));
const ServiceDesk = lazy(() => import('./pages/INSupport/ServiceDesk'));
const DSA = lazy(() => import('./pages/INSupport/DSA'));
const EnterpriseBusiness = lazy(() => import('./pages/INSupport/EnterpriseBusiness'));

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

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

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* User Support Routes */}
          <Route path="/user-support/charging-profile" element={
            <ProtectedRoute>
              <ChargingProfile />
            </ProtectedRoute>
          } />
          <Route path="/user-support/balance-cdr" element={
            <ProtectedRoute>
              <BalanceAndCDR />
            </ProtectedRoute>
          } />
          <Route path="/user-support/data-bundle" element={
            <ProtectedRoute>
              <DataBundle />
            </ProtectedRoute>
          } />
          
          {/* IN Support Routes */}
          <Route path="/in-support/dclm" element={
            <ProtectedRoute>
              <DCLM />
            </ProtectedRoute>
          } />
          <Route path="/in-support/service-desk" element={
            <ProtectedRoute>
              <ServiceDesk />
            </ProtectedRoute>
          } />
          <Route path="/in-support/dsa" element={
            <ProtectedRoute>
              <DSA />
            </ProtectedRoute>
          } />
          <Route path="/in-support/enterprise" element={
            <ProtectedRoute>
              <EnterpriseBusiness />
            </ProtectedRoute>
          } />
          
          {/* Fallback - Redirect to login or dashboard based on auth */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}