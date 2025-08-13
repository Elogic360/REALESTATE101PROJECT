import { supabase } from '../lib/supabase';
import { LandPlot, SearchFilters, Order } from '../types';

export class ApiService {
  // Land Plots
  static async getAvailablePlots(filters?: SearchFilters): Promise<LandPlot[]> {
    try {
      let query = supabase
        .from('land_plots')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }
      if (filters?.district) {
        query = query.eq('district', filters.district);
      }
      if (filters?.council) {
        query = query.eq('council', filters.council);
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

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.transformPlotData);
    } catch (error) {
      console.error('Error fetching plots:', error);
      return [];
    }
  }

  static async getPlotById(id: string): Promise<LandPlot | null> {
    try {
      const { data, error } = await supabase
        .from('land_plots')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return this.transformPlotData(data);
    } catch (error) {
      console.error('Error fetching plot:', error);
      return null;
    }
  }

  static async createPlot(plotData: Omit<LandPlot, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandPlot | null> {
    try {
      const { data, error } = await supabase
        .from('land_plots')
        .insert({
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
        })
        .select()
        .single();

      if (error) throw error;

      return this.transformPlotData(data);
    } catch (error) {
      console.error('Error creating plot:', error);
      return null;
    }
  }

  static async updatePlotStatus(plotId: string, status: 'available' | 'reserved' | 'sold'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('land_plots')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', plotId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating plot status:', error);
      return false;
    }
  }

  // Orders
  static async createOrder(userId: string, plotId: string, totalAmount: number): Promise<Order | null> {
    try {
      const { data, error } = await supabase
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
        .single();

      if (error) throw error;

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
    } catch (error) {
      console.error('Error creating order:', error);
      return null;
    }
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          land_plots (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  static async getAllOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          land_plots (*),
          profiles (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return [];
    }
  }

  static async updateOrderStatus(
    orderId: string, 
    status: 'pending' | 'processing' | 'completed' | 'cancelled',
    paymentStatus?: 'pending' | 'completed' | 'failed'
  ): Promise<boolean> {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  // Cart
  static async getCartItems(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          land_plots (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(item => ({
        plotId: item.plot_id,
        plot: this.transformPlotData(item.land_plots),
        reservedAt: item.reserved_at,
      }));
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
  }

  // Notifications
  static async createNotification(userId: string, title: string, message: string, type: string = 'info'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
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