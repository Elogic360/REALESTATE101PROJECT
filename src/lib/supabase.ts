import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone_number: string | null;
          role: 'user' | 'admin' | 'master_admin';
          is_partner: boolean;
          partner_status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          phone_number?: string | null;
          role?: 'user' | 'admin' | 'master_admin';
          is_partner?: boolean;
          partner_status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string | null;
          role?: 'user' | 'admin' | 'master_admin';
          is_partner?: boolean;
          partner_status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
      };
      land_plots: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          area: number;
          price: number;
          region: string;
          district: string;
          council: string;
          coordinates: any | null;
          width: number;
          length: number;
          usage: 'economic' | 'business' | 'residential' | 'mixed';
          status: 'available' | 'reserved' | 'sold';
          images: string[];
          features: string[];
          documents: string[];
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          area: number;
          price: number;
          region: string;
          district: string;
          council: string;
          coordinates?: any | null;
          width: number;
          length: number;
          usage: 'economic' | 'business' | 'residential' | 'mixed';
          status?: 'available' | 'reserved' | 'sold';
          images?: string[];
          features?: string[];
          documents?: string[];
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          area?: number;
          price?: number;
          region?: string;
          district?: string;
          council?: string;
          coordinates?: any | null;
          width?: number;
          length?: number;
          usage?: 'economic' | 'business' | 'residential' | 'mixed';
          status?: 'available' | 'reserved' | 'sold';
          images?: string[];
          features?: string[];
          documents?: string[];
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          plot_id: string;
          reserved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plot_id: string;
          reserved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plot_id?: string;
          reserved_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          plot_id: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'completed' | 'cancelled';
          payment_status: 'pending' | 'completed' | 'failed';
          payment_method: string | null;
          payment_reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plot_id: string;
          total_amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled';
          payment_status?: 'pending' | 'completed' | 'failed';
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plot_id?: string;
          total_amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'cancelled';
          payment_status?: 'pending' | 'completed' | 'failed';
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
      };
    };
  };
}