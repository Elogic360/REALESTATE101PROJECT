import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});

// Database types for better TypeScript support
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'user' | 'admin' | 'master_admin';
      partner_status: 'pending' | 'approved' | 'rejected';
      land_usage: 'economic' | 'business' | 'residential' | 'mixed';
      plot_status: 'available' | 'reserved' | 'sold';
      order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
      payment_status: 'pending' | 'completed' | 'failed';
    };
  };
}

// Real-time subscription helpers
export const subscribeToTable = (
  table: keyof Database['public']['Tables'],
  callback: (payload: any) => void,
  filter?: string
) => {
  let subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table,
        filter: filter 
      }, 
      callback
    )
    .subscribe();

  return subscription;
};

// Connection health check
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Session management
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Enhanced error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.code === 'PGRST116') {
    return 'No data found';
  }
  
  if (error?.code === '23505') {
    return 'This record already exists';
  }
  
  if (error?.code === '42501') {
    return 'You do not have permission to perform this action';
  }
  
  return error?.message || 'An unexpected error occurred';
};