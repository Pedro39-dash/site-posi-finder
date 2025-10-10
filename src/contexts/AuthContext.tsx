import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    console.log('AuthProvider: Starting initialization');

    // Get initial session FIRST - only once
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        }
        
        console.log('AuthProvider: Initial session result:', session?.user?.id || 'no session');
        
        if (isMounted && !initialized) {
          initialized = true;
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
          setInitializing(false);
          console.log('AuthProvider: Initialization complete');
        }
      } catch (error) {
        console.error('AuthProvider: Auth initialization error:', error);
        if (isMounted && !initialized) {
          initialized = true;
          setSession(null);
          setUser(null);
          setIsLoading(false);
          setInitializing(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.id || 'no session');
        
        if (isMounted && initialized) {
          setSession(session);
          setUser(session?.user ?? null);
          // Don't change isLoading here - only during initialization
        }
      }
    );

    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleanup');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Erro no login: ' + error.message);
      setIsLoading(false);
      return { error: error.message };
    }

    toast.success('Login realizado com sucesso!');
    setIsLoading(false);
    return {};
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast.error('Erro no cadastro: ' + error.message);
      setIsLoading(false);
      return { error: error.message };
    }

    toast.success('Cadastro realizado! Verifique seu email.');
    setIsLoading(false);
    return {};
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast.error('Erro no logout: ' + error.message);
    } else {
      toast.success('Logout realizado com sucesso!');
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      toast.error('Erro ao enviar email: ' + error.message);
      return { error: error.message };
    }

    toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
    return {};
  };

  const value = {
    user,
    session,
    isLoading,
    login,
    signUp,
    logout,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};