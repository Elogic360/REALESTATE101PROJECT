import { supabase, handleSupabaseError, SessionManager, PerformanceMonitor } from '../lib/supabase';
import { User } from '../types';

export class AuthService {
  private static readonly PROFILE_CACHE_KEY = 'tanzland_profile_cache';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Enhanced registration with comprehensive error handling
  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    const endQuery = PerformanceMonitor.startQuery('auth:register');
    
    try {
      // Validate input data
      const validation = this.validateRegistrationData(userData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone_number: userData.phoneNumber,
          }
        }
      });

      if (authError) {
        return { success: false, error: handleSupabaseError(authError) };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create profile with retry logic
      let profileCreated = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!profileCreated && attempts < maxAttempts) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              first_name: userData.firstName,
              last_name: userData.lastName,
              phone_number: userData.phoneNumber,
              role: 'user',
            });

          if (!profileError) {
            profileCreated = true;
          } else if (profileError.code !== '23505') { // Not a duplicate key error
            throw profileError;
          } else {
            // Profile already exists, which is fine
            profileCreated = true;
          }
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error('Profile creation failed after retries:', error);
            // Don't fail registration if profile creation fails - it can be retried
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }

      // Dispatch registration event
      window.dispatchEvent(new CustomEvent('auth:registered', {
        detail: { user: authData.user }
      }));

      return { success: true, user: authData.user };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    } finally {
      endQuery();
    }
  }

  // Enhanced login with session management
  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    const endQuery = PerformanceMonitor.startQuery('auth:login');
    
    try {
      // Validate input
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      // Verify and create profile if missing
      const profile = await this.getProfile(data.user.id);
      if (!profile) {
        await this.createMissingProfile(data.user);
      }

      // Start session management
      SessionManager.startAutoRefresh();

      // Clear any cached data from previous sessions
      this.clearProfileCache();

      // Dispatch login event
      window.dispatchEvent(new CustomEvent('auth:login', {
        detail: { userId: data.user.id, user: data.user }
      }));

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    } finally {
      endQuery();
    }
  }

  // Enhanced logout with cleanup
  static async logout(): Promise<{ success: boolean; error?: string }> {
    const endQuery = PerformanceMonitor.startQuery('auth:logout');
    
    try {
      // Stop session management
      SessionManager.stopAutoRefresh();

      // Clear caches
      this.clearProfileCache();
      localStorage.removeItem('tanzland_user_preferences');
      sessionStorage.clear();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    } finally {
      endQuery();
    }
  }

  // Get current session with enhanced validation
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        return null;
      }

      if (session?.user) {
        // Validate session is still valid by checking profile
        const profile = await this.getProfile(session.user.id);
        if (!profile) {
          console.error('Session exists but profile is missing');
          await this.logout();
          return null;
        }

        // Check if session is about to expire (within 5 minutes)
        const expiresAt = session.expires_at;
        if (expiresAt && (expiresAt * 1000 - Date.now()) < 5 * 60 * 1000) {
          console.log('Session expiring soon, refreshing...');
          const { data: refreshData } = await supabase.auth.refreshSession();
          return refreshData.session;
        }
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Get user profile with caching and retry logic
  static async getProfile(userId: string): Promise<User | null> {
    const endQuery = PerformanceMonitor.startQuery('auth:getProfile');
    
    try {
      // Check cache first
      const cached = this.getCachedProfile(userId);
      if (cached) {
        endQuery();
        return cached;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found
          return null;
        }
        throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const profile: User = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: user?.email || '',
        phoneNumber: data.phone_number || '',
        role: data.role,
        createdAt: data.created_at,
        isPartner: data.is_partner,
        partnerStatus: data.partner_status,
      };

      // Cache the profile
      this.cacheProfile(profile);

      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    } finally {
      endQuery();
    }
  }

  // Update profile with validation and caching
  static async updateProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    const endQuery = PerformanceMonitor.startQuery('auth:updateProfile');
    
    try {
      // Validate updates
      const validation = this.validateProfileUpdates(updates);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const updateData: any = {};
      
      if (updates.firstName) updateData.first_name = updates.firstName.trim();
      if (updates.lastName) updateData.last_name = updates.lastName.trim();
      if (updates.phoneNumber) updateData.phone_number = updates.phoneNumber.trim();
      if (updates.isPartner !== undefined) updateData.is_partner = updates.isPartner;
      if (updates.partnerStatus) updateData.partner_status = updates.partnerStatus;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      // Clear cache to force refresh
      this.clearProfileCache();

      // Dispatch profile update event
      window.dispatchEvent(new CustomEvent('auth:profile-updated', {
        detail: { userId, updates }
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    } finally {
      endQuery();
    }
  }

  // Password reset with enhanced error handling
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Update password with validation
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Role-based access control
  static async hasRole(userId: string, role: 'user' | 'admin' | 'master_admin'): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile?.role === role || (role === 'admin' && profile?.role === 'master_admin');
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Check if user is admin or master admin
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return profile?.role === 'admin' || profile?.role === 'master_admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Refresh session with error handling
  static async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Validate registration data
  private static validateRegistrationData(data: any): { valid: boolean; error?: string } {
    if (!data.firstName?.trim()) {
      return { valid: false, error: 'First name is required' };
    }
    
    if (!data.lastName?.trim()) {
      return { valid: false, error: 'Last name is required' };
    }
    
    if (!data.email?.trim()) {
      return { valid: false, error: 'Email is required' };
    }
    
    if (!this.isValidEmail(data.email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    if (!data.password || data.password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long' };
    }
    
    if (data.phoneNumber && !this.isValidPhoneNumber(data.phoneNumber)) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    return { valid: true };
  }

  // Validate profile updates
  private static validateProfileUpdates(updates: any): { valid: boolean; error?: string } {
    if (updates.firstName && !updates.firstName.trim()) {
      return { valid: false, error: 'First name cannot be empty' };
    }
    
    if (updates.lastName && !updates.lastName.trim()) {
      return { valid: false, error: 'Last name cannot be empty' };
    }
    
    if (updates.phoneNumber && !this.isValidPhoneNumber(updates.phoneNumber)) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    return { valid: true };
  }

  // Email validation
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation
  private static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Create missing profile (fallback)
  private static async createMissingProfile(user: any) {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          phone_number: user.user_metadata?.phone_number || null,
          role: 'user',
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating missing profile:', error);
      }
    } catch (error) {
      console.error('Error in createMissingProfile:', error);
    }
  }

  // Profile caching methods
  private static cacheProfile(profile: User) {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      localStorage.setItem(this.PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching profile:', error);
    }
  }

  private static getCachedProfile(userId: string): User | null {
    try {
      const cached = localStorage.getItem(this.PROFILE_CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > this.CACHE_DURATION) {
        this.clearProfileCache();
        return null;
      }

      // Check if it's for the right user
      if (cacheData.profile?.id !== userId) {
        this.clearProfileCache();
        return null;
      }

      return cacheData.profile;
    } catch (error) {
      console.error('Error reading cached profile:', error);
      this.clearProfileCache();
      return null;
    }
  }

  private static clearProfileCache() {
    try {
      localStorage.removeItem(this.PROFILE_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing profile cache:', error);
    }
  }
}