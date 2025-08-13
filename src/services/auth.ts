import { supabase, handleSupabaseError } from '../lib/supabase';
import { User } from '../types';

export class AuthService {
  // Enhanced registration with profile creation
  static async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      // Create auth user
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

      // Create profile (this will be handled by database trigger or RLS policy)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone_number: userData.phoneNumber,
          role: 'user',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail registration if profile creation fails - it can be retried
      }

      return { success: true, user: authData.user };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Enhanced login with session management
  static async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed' };
      }

      // Verify profile exists
      const profile = await this.getProfile(data.user.id);
      if (!profile) {
        // Create profile if it doesn't exist
        await this.createMissingProfile(data.user);
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Logout with cleanup
  static async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      // Clear any cached data
      localStorage.removeItem('tanzland_user_preferences');
      sessionStorage.clear();

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Get current session with validation
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        return null;
      }

      if (session?.user) {
        // Validate session is still valid
        const profile = await this.getProfile(session.user.id);
        if (!profile) {
          // Session exists but profile is missing - this shouldn't happen
          console.error('Session exists but profile is missing');
          await this.logout();
          return null;
        }
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Get user profile with caching
  static async getProfile(userId: string): Promise<User | null> {
    try {
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

      return {
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
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Update profile with validation
  static async updateProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      
      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.phoneNumber) updateData.phone_number = updates.phoneNumber;
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

      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  }

  // Password reset
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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

  // Update password
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
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

  // Check if user has specific role
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

      if (error) {
        console.error('Error creating missing profile:', error);
      }
    } catch (error) {
      console.error('Error in createMissingProfile:', error);
    }
  }

  // Refresh session
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
}