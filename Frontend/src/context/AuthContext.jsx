// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import { clearSession, readSession, watchSession } from '../services/session';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readSession());
  const loading = false;

  useEffect(() => watchSession(setUser), []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(readSession());
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.roles?.includes('admin') || false,
    isSuperUser: user?.roles?.includes('superuser') || false,
    hasRole: (role) => user?.roles?.includes(role) || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
