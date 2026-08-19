import { Navigate, Route, Routes } from 'react-router-dom';
import { createContext, useContext, useMemo, useState } from 'react';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CaseListPage from './pages/CaseListPage.jsx';
import CaseDetailPage from './pages/CaseDetailPage.jsx';

const AuthContext = createContext(null);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

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
