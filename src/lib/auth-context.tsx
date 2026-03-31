'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';
import { DEMO_USERS } from './seed-data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('fi-demo-role');
    if (stored && (stored === 'marketing' || stored === 'kam' || stored === 'dirco')) {
      setUser(DEMO_USERS[stored]);
    }
    setLoading(false);
  }, []);

  const login = (role: UserRole) => {
    localStorage.setItem('fi-demo-role', role);
    setUser(DEMO_USERS[role]);
  };

  const logout = () => {
    localStorage.removeItem('fi-demo-role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
