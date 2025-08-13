import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types';
import { AuthService } from '../services/auth';
import { RealtimeService } from '../services/realtime';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  hasRole: (role: 'user' | 'admin' | 'master_admin') => boolean;
  isAdmin: () => boolean;
  error: string | null;
  clearError: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
    setupEventListeners();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current session
      const session = await AuthService.getCurrentSession();
      
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Listen for session expiration
    window.addEventListener('auth:session-expired', handleSessionExpired);
    
    // Listen for profile updates
    window.addEventListener('auth:profile-updated', handleProfileUpdated);
  };

  const cleanupEventListeners = () => {
    window.removeEventListener('auth:session-expired', handleSessionExpired);
    window.removeEventListener('auth:profile-updated', handleProfileUpdated);
  };

  const handleSessionExpired = () => {
    setUser(null);
    setSupabaseUser(null);
    setError('Your session has expired. Please log in again.');
    RealtimeService.cleanupUserSubscriptions();
  };

  const handleProfileUpdated = async (event: any) => {
    if (user && event.detail.userId === user.id) {
      await refreshUser();
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await AuthService.getProfile(userId);
      if (profile) {
        setUser(profile);
        
        // Set up real-time subscriptions for authenticated user
        setupRealtimeSubscriptions(userId);
      } else {
        throw new Error('Profile not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const setupRealtimeSubscriptions = (userId: string) => {
    // Setup user-specific real-time subscriptions
    RealtimeService.setupUserSubscriptions(userId);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.login(email, password);
      
      if (result.success && result.user) {
        setSupabaseUser(result.user);
        await fetchUserProfile(result.user.id);
        return true;
      } else {
        setError(result.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await AuthService.register(userData);
      
      if (result.success) {
        // Don't auto-login after registration - user should verify email first
        return true;
      } else {
        setError(result.error || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred during registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Cleanup real-time subscriptions
      RealtimeService.cleanupUserSubscriptions();
      
      const result = await AuthService.logout();
      
      if (result.success) {
        setUser(null);
        setSupabaseUser(null);
      } else {
        setError(result.error || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setError('An unexpected error occurred during logout');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const result = await AuthService.updateProfile(user.id, data);
      
      if (result.success) {
        // Refresh user profile
        await refreshUser();
        return true;
      } else {
        setError(result.error || 'Profile update failed');
        return false;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('An unexpected error occurred while updating profile');
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    if (!supabaseUser) return;

    try {
      await fetchUserProfile(supabaseUser.id);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setError('Failed to refresh user data');
    }
  };

  const hasRole = (role: 'user' | 'admin' | 'master_admin'): boolean => {
    if (!user) return false;
    return user.role === role || (role === 'admin' && user.role === 'master_admin');
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'master_admin';
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    supabaseUser,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    hasRole,
    isAdmin,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};