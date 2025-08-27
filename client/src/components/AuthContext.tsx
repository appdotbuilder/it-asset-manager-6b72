import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { trpc } from '@/utils/trpc';
import type { User } from '../../../server/src/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        const result = await trpc.auth.validateSession.query({ sessionId });
        if (result.user) {
          setUser(result.user);
        } else {
          localStorage.removeItem('sessionId');
        }
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      localStorage.removeItem('sessionId');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await trpc.auth.login.mutate({ username, password });
      
      if (result.success && result.sessionId && result.user) {
        localStorage.setItem('sessionId', result.sessionId);
        setUser(result.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await trpc.auth.logout.mutate({ sessionId });
        localStorage.removeItem('sessionId');
      }
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if server request fails
      localStorage.removeItem('sessionId');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAuthenticated
    }}>
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