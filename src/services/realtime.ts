import { supabase, subscribeToTable } from '../lib/supabase';
import { LandPlot, Order } from '../types';

export class RealtimeService {
  private static subscriptions: Map<string, any> = new Map();

  // Subscribe to property updates
  static subscribeToProperties(callback: (payload: any) => void) {
    const subscription = subscribeToTable('land_plots', (payload) => {
      console.log('Property update:', payload);
      callback(payload);
    });

    this.subscriptions.set('properties', subscription);
    return subscription;
  }

  // Subscribe to user's orders
  static subscribeToUserOrders(userId: string, callback: (payload: any) => void) {
    const subscription = subscribeToTable('orders', (payload) => {
      console.log('Order update:', payload);
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
        callback(payload);
      }
    }, `user_id=eq.${userId}`);

    this.subscriptions.set(`orders_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to user's notifications
  static subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    const subscription = subscribeToTable('notifications', (payload) => {
      console.log('Notification update:', payload);
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
        callback(payload);
      }
    }, `user_id=eq.${userId}`);

    this.subscriptions.set(`notifications_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to cart updates
  static subscribeToUserCart(userId: string, callback: (payload: any) => void) {
    const subscription = subscribeToTable('cart_items', (payload) => {
      console.log('Cart update:', payload);
      if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
        callback(payload);
      }
    }, `user_id=eq.${userId}`);

    this.subscriptions.set(`cart_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to all orders (admin only)
  static subscribeToAllOrders(callback: (payload: any) => void) {
    const subscription = subscribeToTable('orders', (payload) => {
      console.log('All orders update:', payload);
      callback(payload);
    });

    this.subscriptions.set('all_orders', subscription);
    return subscription;
  }

  // Unsubscribe from specific subscription
  static unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(key);
    }
  }

  // Unsubscribe from all subscriptions
  static unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  // Get active subscriptions count
  static getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  // Check if subscription exists
  static hasSubscription(key: string): boolean {
    return this.subscriptions.has(key);
  }
}

// Real-time event types
export interface RealtimeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
  new?: any;
  old?: any;
}

// Property-specific real-time handlers
export class PropertyRealtimeHandlers {
  static handlePropertyUpdate(event: RealtimeEvent, onUpdate: (property: LandPlot) => void) {
    if (event.eventType === 'UPDATE' && event.new) {
      const updatedProperty = this.transformPropertyData(event.new);
      onUpdate(updatedProperty);
    }
  }

  static handlePropertyStatusChange(
    event: RealtimeEvent, 
    onStatusChange: (plotId: string, newStatus: string, oldStatus: string) => void
  ) {
    if (event.eventType === 'UPDATE' && event.new && event.old) {
      if (event.new.status !== event.old.status) {
        onStatusChange(event.new.id, event.new.status, event.old.status);
      }
    }
  }

  private static transformPropertyData(data: any): LandPlot {
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

// Order-specific real-time handlers
export class OrderRealtimeHandlers {
  static handleOrderUpdate(event: RealtimeEvent, onUpdate: (order: Order) => void) {
    if (event.eventType === 'UPDATE' && event.new) {
      // Note: This would need to fetch the related plot data
      // In a real implementation, you might want to use a view or join
      onUpdate({
        id: event.new.id,
        userId: event.new.user_id,
        plotId: event.new.plot_id,
        plot: {} as LandPlot, // Would need to be fetched separately
        totalAmount: event.new.total_amount,
        status: event.new.status,
        paymentStatus: event.new.payment_status,
        createdAt: event.new.created_at,
        updatedAt: event.new.updated_at,
      });
    }
  }

  static handleNewOrder(event: RealtimeEvent, onNewOrder: (order: Order) => void) {
    if (event.eventType === 'INSERT' && event.new) {
      // Similar to handleOrderUpdate, would need plot data
      onNewOrder({
        id: event.new.id,
        userId: event.new.user_id,
        plotId: event.new.plot_id,
        plot: {} as LandPlot,
        totalAmount: event.new.total_amount,
        status: event.new.status,
        paymentStatus: event.new.payment_status,
        createdAt: event.new.created_at,
        updatedAt: event.new.updated_at,
      });
    }
  }
}