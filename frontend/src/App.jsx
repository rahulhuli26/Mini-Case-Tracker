import { Navigate, Route, Routes } from 'react-router-dom';
import { createContext, useContext, useMemo, useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CaseListPage from './pages/CaseListPage.jsx';
import CaseDetailPage from './pages/CaseDetailPage.jsx';

/**
 * @file Root component: sets up authentication context and client-side
 * routing between the login, dashboard, case list, and case detail pages.
 */

/** React context holding the current user, JWT, and login/logout actions. */
const AuthContext = createContext(null);

/**
 * Provides authentication state to the component tree, persisting the
 * current user and JWT to `localStorage` so a session survives a page
 * reload.
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {JSX.Element}
 */
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const value = useMemo(() => ({
    user,
    token,
    login: (nextUser, nextToken) => {
      setUser(nextUser);
      setToken(nextToken);
      localStorage.setItem('user', JSON.stringify(nextUser));
      localStorage.setItem('token', nextToken);
    },
    logout: () => {
      setUser(null);
      setToken('');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook for accessing the current user, JWT, and `login`/`logout` actions.
 * Must be used within an {@link AuthProvider}.
 *
 * @returns {{user: object|null, token: string, login: (user: object, token: string) => void, logout: () => void}}
 * @throws {Error} If called outside of an `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

/**
 * Route wrapper that redirects to `/login` when no user is authenticated.
 *
 * @param {{children: import('react').ReactNode}} props
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/**
 * Application root: wraps the route tree in {@link AuthProvider} and
 * declares the login/dashboard/cases/case-detail routes, guarding all but
 * login behind {@link ProtectedRoute}.
 *
 * @returns {JSX.Element}
 */
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute><CaseListPage /></ProtectedRoute>} />
        <Route path="/cases/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
