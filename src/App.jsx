import React, { useState } from 'react';
import { TransactionProvider } from './context/TransactionContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import DataManagement from './components/DataManagement';
import Login from './components/Login';
import PendingApproval from './components/PendingApproval';
import { LayoutDashboard, FileBarChart } from 'lucide-react';

const AuthenticatedApp = () => {
  const { user } = useAuth(); // kept for potential future use or context check
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <TransactionProvider>
      <Layout setCurrentView={setCurrentView}>
        {/* Sticky Navigation Tabs - Segmented Control Style */}
        <div style={{
          display: 'flex',
          marginBottom: '20px',
          backgroundColor: 'var(--color-bg-body)', // Light gray background for the container
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          // boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', // Subtle inset shadow for depth (optional, maybe too much)
          border: '1px solid var(--color-border)',
          flexShrink: 0,
          position: 'sticky',
          top: '10px',
          zIndex: 50
        }}>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="btn-modern"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: currentView === 'dashboard' ? 'white' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              boxShadow: currentView === 'dashboard' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
            }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className="btn-modern"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: currentView === 'reports' ? 'white' : 'transparent',
              color: currentView === 'reports' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              boxShadow: currentView === 'reports' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
            }}
          >
            <FileBarChart size={18} /> Reports
          </button>
        </div>

        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'reports' && <Reports />}
        {currentView === 'settings' && <DataManagement />}

      </Layout>
    </TransactionProvider>
  );
};

const AppContent = () => {
  const { user, isAllowed, loading } = useAuth();

  // Check for loading OR if authentication check is still pending (isAllowed is null)
  if (loading || isAllowed === null) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <div style={{ fontWeight: 500, letterSpacing: '0.5px' }}>Loading Tracker...</div>
    </div>
  );

  if (!user) return <Login />;

  if (isAllowed === false) return <PendingApproval />;

  return <AuthenticatedApp />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
