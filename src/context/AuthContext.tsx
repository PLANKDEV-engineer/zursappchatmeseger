import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType {
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialAuthState: AuthState = {
  step: 'phone',
  phone: '',
  countryCode: '+62',
  otpCode: '',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const isAuthenticated = authState.step === 'complete' && currentUser !== null;

  const logout = () => {
    setAuthState(initialAuthState);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        setAuthState,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
