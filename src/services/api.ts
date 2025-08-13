import { supabase, handleSupabaseError } from '../lib/supabase';
import { LandPlot, SearchFilters, Order, CartItem } from '../types';

export class ApiService {
  // Enhanced error handling wrapper
  private static async executeQuery<T>(
    queryFn: () => Promise<{ data: T; error: any }>,
    errorContext: string
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error(`${errorContext}:`, error);
        throw new Error(handleSupabaseError(error));
      }
      
      return data;
    } catch (error) {
      console.error(`${errorContext}:`, error);
      throw error;
    }
  }

  // Land Plots with enhanced filtering and pagination
  static async getAvailablePlots(
    filters?: SearchFilters,
    page: number = 1,
    limit: number = 12
  ): Promise<{ plots: LandPlot[]; total: number; hasMore: boolean }> {
    try {
      let query = supabase
        .from('land_plots')
        .select('*', { count: 'exact' })
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.region) {
        query = query.ilike('region', `%${filters.region}%`);
      }
      if (filters?.district) {
        query = query.ilike('district', `%${filters.district}%`);
      }
      if (filters?.council) {
        query = query.ilike('council', `%${filters.council}%`);
      }
      if (filters?.usage) {
        query = query.eq('usage', filters.usage);
      }
      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.minArea) {
        query = query.gte('area', filters.minArea);
      }
      if (filters?.maxArea) {
        query = query.lte('area', filters.maxArea);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const plots = data.map(this.transformPlotData);
      const total = count || 0;
      const hasMore = total > page * limit;

      return { plots, total, hasMore };
    } catch (error) {
      console.error('Error fetching plots:', error);
      return { plots: [], total: 0, hasMore: false };
    }
  }

  static async getPlotById(id: string): Promise<LandPlot | null> {
    return this.executeQuery(
      () => supabase.from('land_plots').select('*').eq('id', id).single(),
      'Error fetching plot by ID'
    ).then(data => data ? this.transformPlotData(data) : null);
  }

  static async createPlot(plotData: Omit<LandPlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandPlot> {
    const insertData = {
      title: plotData.title,
      description: plotData.description,
      area: plotData.area,
      price: plotData.price,
      region: plotData.location.region,
      district: plotData.location.district,
      council: plotData.location.council,
      coordinates: plotData.location.coordinates,
      width: plotData.size.width,
      length: plotData.size.length,
      usage: plotData.usage,
      images: plotData.images,
      features: plotData.features,
      documents: plotData.documents,
      uploaded_by: plotData.uploadedBy,
    };

    const data = await this.executeQuery(
      () => supabase.from('land_plots').insert(insertData).select().single(),
      'Error creating plot'
    );

    return this.transformPlotData(data);
  }

  static async updatePlot(plotId: string, updates: Partial<LandPlot>): Promise<LandPlot> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.area) updateData.area = updates.area;
    if (updates.price) updateData.price = updates.price;
    if (updates.location?.region) updateData.region = updates.location.region;
    if (updates.location?.district) updateData.district = updates.location.district;
    if (updates.location?.council) updateData.council = updates.location.council;
    if (updates.location?.coordinates) updateData.coordinates = updates.location.coordinates;
    if (updates.size?.width) updateData.width = updates.size.width;
    if (updates.size?.length) updateData.length = updates.size.length;
    if (updates.usage) updateData.usage = updates.usage;
    if (updates.status) updateData.status = updates.status;
    if (updates.images) updateData.images = updates.images;
    if (updates.features) updateData.features = updates.features;
    if (updates.documents) updateData.documents = updates.documents;

    const data = await this.executeQuery(
      () => supabase.from('land_plots').update(updateData).eq('id', plotId).select().single(),
      'Error updating plot'
    );

    return this.transformPlotData(data);
  }

  static async updatePlotStatus(plotId: string, status: 'available' | 'reserved' | 'sold'): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase
          .from('land_plots')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', plotId),
        'Error updating plot status'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async deletePlot(plotId: string): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase.from('land_plots').delete().eq('id', plotId),
        'Error deleting plot'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Enhanced Orders with better error handling
  static async createOrder(userId: string, plotId: string, totalAmount: number): Promise<Order> {
    const data = await this.executeQuery(
      () => supabase
        .from('orders')
        .insert({
          user_id: userId,
          plot_id: plotId,
          total_amount: totalAmount,
        })
        .select(`
          *,
          land_plots (*)
        `)
        .single(),
      'Error creating order'
    );

    return {
      id: data.id,
      userId: data.user_id,
      plotId: data.plot_id,
      plot: this.transformPlotData(data.land_plots),
      totalAmount: data.total_amount,
      status: data.status,
      paymentStatus: data.payment_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const data = await this.executeQuery(
      () => supabase
        .from('orders')
        .select(`
          *,
          land_plots (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'Error fetching user orders'
    );

    return data.map(order => ({
      id: order.id,
      userId: order.user_id,
      plotId: order.plot_id,
      plot: this.transformPlotData(order.land_plots),
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  }

  static async getAllOrders(page: number = 1, limit: number = 20): Promise<{ orders: Order[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('orders')
      .select(`
        *,
        land_plots (*),
        profiles (first_name, last_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const orders = data.map(order => ({
      id: order.id,
      userId: order.user_id,
      plotId: order.plot_id,
      plot: this.transformPlotData(order.land_plots),
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    return { orders, total: count || 0 };
  }

  static async updateOrderStatus(
    orderId: string, 
    status: 'pending' | 'processing' | 'completed' | 'cancelled',
    paymentStatus?: 'pending' | 'completed' | 'failed',
    notes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (paymentStatus) updateData.payment_status = paymentStatus;
      if (notes) updateData.notes = notes;

      await this.executeQuery(
        () => supabase.from('orders').update(updateData).eq('id', orderId),
        'Error updating order status'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Enhanced Cart with real-time sync
  static async getCartItems(userId: string): Promise<CartItem[]> {
    const data = await this.executeQuery(
      () => supabase
        .from('cart_items')
        .select(`
          *,
          land_plots (*)
        `)
        .eq('user_id', userId)
        .order('reserved_at', { ascending: false }),
      'Error fetching cart items'
    );

    return data.map(item => ({
      plotId: item.plot_id,
      plot: this.transformPlotData(item.land_plots),
      reservedAt: item.reserved_at,
    }));
  }

  static async addToCart(userId: string, plotId: string): Promise<boolean> {
    try {
      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', userId)
        .eq('plot_id', plotId)
        .single();

      if (existing) {
        return true; // Already in cart
      }

      await this.executeQuery(
        () => supabase
          .from('cart_items')
          .insert({
            user_id: userId,
            plot_id: plotId,
          }),
        'Error adding to cart'
      );

      // Update plot status to reserved
      await this.updatePlotStatus(plotId, 'reserved');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  static async removeFromCart(userId: string, plotId: string): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('plot_id', plotId),
        'Error removing from cart'
      );

      // Update plot status back to available
      await this.updatePlotStatus(plotId, 'available');
      
      return true;
    } catch (error) {
      return false;
    }
  }

  static async clearCart(userId: string): Promise<boolean> {
    try {
      // Get all cart items first to update plot statuses
      const cartItems = await this.getCartItems(userId);
      
      await this.executeQuery(
        () => supabase.from('cart_items').delete().eq('user_id', userId),
        'Error clearing cart'
      );

      // Update all plot statuses back to available
      for (const item of cartItems) {
        await this.updatePlotStatus(item.plotId, 'available');
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Enhanced Notifications
  static async createNotification(
    userId: string, 
    title: string, 
    message: string, 
    type: string = 'info'
  ): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            type,
          }),
        'Error creating notification'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    const data = await this.executeQuery(
      () => supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      'Error fetching notifications'
    );

    return data;
  }

  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId),
        'Error marking notification as read'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      await this.executeQuery(
        () => supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false),
        'Error marking all notifications as read'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Analytics and Statistics
  static async getPropertyStats(): Promise<{
    total: number;
    available: number;
    reserved: number;
    sold: number;
    byRegion: Record<string, number>;
    byUsage: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('land_plots')
        .select('status, region, usage');

      if (error) throw error;

      const stats = {
        total: data.length,
        available: 0,
        reserved: 0,
        sold: 0,
        byRegion: {} as Record<string, number>,
        byUsage: {} as Record<string, number>,
      };

      data.forEach(plot => {
        // Count by status
        stats[plot.status as keyof typeof stats]++;
        
        // Count by region
        stats.byRegion[plot.region] = (stats.byRegion[plot.region] || 0) + 1;
        
        // Count by usage
        stats.byUsage[plot.usage] = (stats.byUsage[plot.usage] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching property stats:', error);
      return {
        total: 0,
        available: 0,
        reserved: 0,
        sold: 0,
        byRegion: {},
        byUsage: {},
      };
    }
  }

  static async getUserStats(userId: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    cartItems: number;
  }> {
    try {
      const [orders, cartItems] = await Promise.all([
        this.getUserOrders(userId),
        this.getCartItems(userId),
      ]);

      const stats = {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalSpent: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + o.totalAmount, 0),
        cartItems: cartItems.length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalSpent: 0,
        cartItems: 0,
      };
    }
  }

  // Helper method to transform database plot data to frontend format
  private static transformPlotData(data: any): LandPlot {
    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      area: data.area,
      price: data.price,
      location: {
        region: data.region,
        district: data.district,
        council: data.council,
        coordinates: data.coordinates,
      },
      size: {
        width: data.width,
        length: data.length,
      },
      usage: data.usage,
      status: data.status,
      images: data.images || [],
      features: data.features || [],
      documents: data.documents || [],
      uploadedBy: data.uploaded_by || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}