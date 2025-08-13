import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Enhanced Supabase client with production-ready configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'tanzland-auth-token',
    debug: import.meta.env.DEV
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
      timeout: 30000,
      heartbeatIntervalMs: 30000
    },
    transport: 'websocket',
    timeout: 30000
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'tanzland-web-app'
    }
  }
});

// Connection pool management for production
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Enhanced connection health monitoring
export const monitorConnection = () => {
  const checkInterval = setInterval(async () => {
    const isHealthy = await checkConnection();
    if (!isHealthy) {
      connectionAttempts++;
      console.warn(`Connection unhealthy. Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}`);
      
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.error('Max connection attempts reached. Implementing fallback strategy.');
        // Implement fallback strategy (offline mode, retry logic, etc.)
        clearInterval(checkInterval);
      }
    } else {
      connectionAttempts = 0; // Reset on successful connection
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkInterval);
};

// Enhanced real-time subscription management
export class SubscriptionManager {
  private static subscriptions = new Map<string, any>();
  private static reconnectAttempts = new Map<string, number>();
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;

  static subscribe(
    key: string,
    table: keyof Database['public']['Tables'],
    callback: (payload: any) => void,
    filter?: string,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
    }
  ) {
    // Clean up existing subscription
    this.unsubscribe(key);

    const channel = supabase.channel(`${key}-${Date.now()}`);
    
    const subscription = channel
      .on('postgres_changes', {
        event: options?.event || '*',
        schema: options?.schema || 'public',
        table: table as string,
        filter: filter
      }, (payload) => {
        try {
          callback(payload);
          // Reset reconnect attempts on successful message
          this.reconnectAttempts.set(key, 0);
        } catch (error) {
          console.error(`Error in subscription callback for ${key}:`, error);
        }
      })
      .on('system', {}, (payload) => {
        if (payload.status === 'CHANNEL_ERROR') {
          this.handleSubscriptionError(key, table, callback, filter, options);
        }
      })
      .subscribe((status) => {
        console.log(`Subscription ${key} status:`, status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${key}`);
        } else if (status === 'CHANNEL_ERROR') {
          this.handleSubscriptionError(key, table, callback, filter, options);
        }
      });

    this.subscriptions.set(key, subscription);
    return subscription;
  }

  private static handleSubscriptionError(
    key: string,
    table: keyof Database['public']['Tables'],
    callback: (payload: any) => void,
    filter?: string,
    options?: any
  ) {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts.set(key, attempts + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      
      setTimeout(() => {
        console.log(`Attempting to reconnect subscription ${key} (attempt ${attempts + 1})`);
        this.subscribe(key, table, callback, filter, options);
      }, delay);
    } else {
      console.error(`Max reconnection attempts reached for subscription ${key}`);
      this.reconnectAttempts.delete(key);
    }
  }

  static unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(key);
      this.reconnectAttempts.delete(key);
    }
  }

  static unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.reconnectAttempts.clear();
  }

  static getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

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

// Enhanced connection health check with retry logic
export const checkConnection = async (retries: number = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (!error) return true;
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      console.error(`Connection check attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  return false;
};

// Enhanced session management with automatic refresh
export const SessionManager = {
  refreshTimer: null as NodeJS.Timeout | null,
  
  startAutoRefresh() {
    this.stopAutoRefresh();
    
    // Refresh session every 50 minutes (tokens expire after 1 hour)
    this.refreshTimer = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session refresh failed:', error);
          // Trigger re-authentication flow
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        } else {
          console.log('Session refreshed successfully');
        }
      } catch (error) {
        console.error('Session refresh error:', error);
      }
    }, 50 * 60 * 1000);
  },
  
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
};

// Production-ready error handling
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  // Network errors
  if (error?.message?.includes('fetch')) {
    return 'Network connection error. Please check your internet connection.';
  }
  
  // Authentication errors
  if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
    return 'Session expired. Please log in again.';
  }
  
  // Database constraint errors
  if (error?.code === '23505') {
    return 'This record already exists.';
  }
  
  if (error?.code === '23503') {
    return 'Cannot delete this record as it is referenced by other data.';
  }
  
  // Permission errors
  if (error?.code === '42501' || error?.message?.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }
  
  // Row Level Security errors
  if (error?.code === 'PGRST301') {
    return 'Access denied. Please ensure you have the required permissions.';
  }
  
  // Not found errors
  if (error?.code === 'PGRST116') {
    return 'Record not found.';
  }
  
  // Rate limiting
  if (error?.message?.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Generic fallback
  return error?.message || 'An unexpected error occurred. Please try again.';
};

// Database performance monitoring
export const PerformanceMonitor = {
  queryTimes: new Map<string, number[]>(),
  
  startQuery(queryKey: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.queryTimes.has(queryKey)) {
        this.queryTimes.set(queryKey, []);
      }
      
      const times = this.queryTimes.get(queryKey)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      // Log slow queries (> 2 seconds)
      if (duration > 2000) {
        console.warn(`Slow query detected: ${queryKey} took ${duration.toFixed(2)}ms`);
      }
    };
  },
  
  getAverageQueryTime(queryKey: string): number {
    const times = this.queryTimes.get(queryKey);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  },
  
  getAllStats() {
    const stats: Record<string, { average: number; count: number; max: number }> = {};
    
    this.queryTimes.forEach((times, key) => {
      stats[key] = {
        average: this.getAverageQueryTime(key),
        count: times.length,
        max: Math.max(...times)
      };
    });
    
    return stats;
  }
};

// Initialize connection monitoring in production
if (import.meta.env.PROD) {
  monitorConnection();
}