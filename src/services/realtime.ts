import { SubscriptionManager } from '../lib/supabase';
import { LandPlot, Order } from '../types';

export class RealtimeService {
  private static isInitialized = false;
  private static userSubscriptions = new Set<string>();

  // Initialize real-time service
  static initialize() {
    if (this.isInitialized) return;
    
    this.isInitialized = true;
    
    // Listen for auth state changes to manage subscriptions
    window.addEventListener('auth:login', (event: any) => {
      this.setupUserSubscriptions(event.detail.userId);
    });
    
    window.addEventListener('auth:logout', () => {
      this.cleanupUserSubscriptions();
    });
    
    window.addEventListener('auth:session-expired', () => {
      this.cleanupUserSubscriptions();
    });
  }

  // Setup subscriptions for authenticated user
  static setupUserSubscriptions(userId: string) {
    this.cleanupUserSubscriptions();
    
    // Subscribe to user's notifications
    this.subscribeToUserNotifications(userId, (payload) => {
      this.handleNotificationUpdate(payload);
    });
    
    // Subscribe to user's orders
    this.subscribeToUserOrders(userId, (payload) => {
      this.handleOrderUpdate(payload);
    });
    
    // Subscribe to user's cart
    this.subscribeToUserCart(userId, (payload) => {
      this.handleCartUpdate(payload);
    });
    
    // Subscribe to property updates (for all users)
    this.subscribeToProperties((payload) => {
      this.handlePropertyUpdate(payload);
    });
  }

  // Cleanup user-specific subscriptions
  static cleanupUserSubscriptions() {
    this.userSubscriptions.forEach(key => {
      SubscriptionManager.unsubscribe(key);
    });
    this.userSubscriptions.clear();
  }

  // Subscribe to property updates
  static subscribeToProperties(callback: (payload: any) => void) {
    const key = 'properties';
    
    SubscriptionManager.subscribe(
      key,
      'land_plots',
      (payload) => {
        console.log('Property update:', payload);
        callback(payload);
        
        // Dispatch custom events for different types of updates
        if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
          window.dispatchEvent(new CustomEvent('property:status-changed', {
            detail: {
              plotId: payload.new.id,
              oldStatus: payload.old.status,
              newStatus: payload.new.status
            }
          }));
        }
      },
      undefined,
      { event: '*' }
    );
    
    return key;
  }

  // Subscribe to user's orders with enhanced filtering
  static subscribeToUserOrders(userId: string, callback: (payload: any) => void) {
    const key = `orders_${userId}`;
    this.userSubscriptions.add(key);
    
    SubscriptionManager.subscribe(
      key,
      'orders',
      (payload) => {
        console.log('Order update:', payload);
        
        // Only process if it's for this user
        if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
          callback(payload);
          
          // Dispatch specific events
          if (payload.eventType === 'INSERT') {
            window.dispatchEvent(new CustomEvent('order:created', {
              detail: { order: payload.new }
            }));
          } else if (payload.eventType === 'UPDATE') {
            window.dispatchEvent(new CustomEvent('order:updated', {
              detail: { 
                order: payload.new,
                changes: this.getChanges(payload.old, payload.new)
              }
            }));
          }
        }
      },
      `user_id=eq.${userId}`,
      { event: '*' }
    );
    
    return key;
  }

  // Subscribe to user's notifications
  static subscribeToUserNotifications(userId: string, callback: (payload: any) => void) {
    const key = `notifications_${userId}`;
    this.userSubscriptions.add(key);
    
    SubscriptionManager.subscribe(
      key,
      'notifications',
      (payload) => {
        console.log('Notification update:', payload);
        
        if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
          callback(payload);
          
          // Show toast notification for new notifications
          if (payload.eventType === 'INSERT' && payload.new) {
            this.showToastNotification(payload.new);
          }
        }
      },
      `user_id=eq.${userId}`,
      { event: '*' }
    );
    
    return key;
  }

  // Subscribe to user's cart
  static subscribeToUserCart(userId: string, callback: (payload: any) => void) {
    const key = `cart_${userId}`;
    this.userSubscriptions.add(key);
    
    SubscriptionManager.subscribe(
      key,
      'cart_items',
      (payload) => {
        console.log('Cart update:', payload);
        
        if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
          callback(payload);
          
          // Update cart badge count
          window.dispatchEvent(new CustomEvent('cart:updated', {
            detail: { payload }
          }));
        }
      },
      `user_id=eq.${userId}`,
      { event: '*' }
    );
    
    return key;
  }

  // Subscribe to all orders (admin only)
  static subscribeToAllOrders(callback: (payload: any) => void) {
    const key = 'all_orders';
    
    SubscriptionManager.subscribe(
      key,
      'orders',
      (payload) => {
        console.log('All orders update:', payload);
        callback(payload);
        
        // Admin-specific events
        if (payload.eventType === 'INSERT') {
          window.dispatchEvent(new CustomEvent('admin:new-order', {
            detail: { order: payload.new }
          }));
        }
      },
      undefined,
      { event: '*' }
    );
    
    return key;
  }

  // Subscribe to all profiles (master admin only)
  static subscribeToAllProfiles(callback: (payload: any) => void) {
    const key = 'all_profiles';
    
    SubscriptionManager.subscribe(
      key,
      'profiles',
      (payload) => {
        console.log('Profile update:', payload);
        callback(payload);
        
        // Master admin events
        if (payload.eventType === 'INSERT') {
          window.dispatchEvent(new CustomEvent('admin:new-user', {
            detail: { user: payload.new }
          }));
        }
      },
      undefined,
      { event: '*' }
    );
    
    return key;
  }

  // Unsubscribe from specific subscription
  static unsubscribe(key: string) {
    SubscriptionManager.unsubscribe(key);
    this.userSubscriptions.delete(key);
  }

  // Unsubscribe from all subscriptions
  static unsubscribeAll() {
    SubscriptionManager.unsubscribeAll();
    this.userSubscriptions.clear();
  }

  // Get active subscriptions
  static getActiveSubscriptions() {
    return SubscriptionManager.getActiveSubscriptions();
  }

  // Handle notification updates
  private static handleNotificationUpdate(payload: any) {
    if (payload.eventType === 'INSERT' && payload.new) {
      // Update notification count in UI
      const event = new CustomEvent('notification:new', {
        detail: { notification: payload.new }
      });
      window.dispatchEvent(event);
    }
  }

  // Handle order updates
  private static handleOrderUpdate(payload: any) {
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const changes = this.getChanges(payload.old, payload.new);
      
      // Notify about status changes
      if (changes.status) {
        const event = new CustomEvent('order:status-changed', {
          detail: {
            orderId: payload.new.id,
            oldStatus: payload.old.status,
            newStatus: payload.new.status
          }
        });
        window.dispatchEvent(event);
      }
      
      // Notify about payment status changes
      if (changes.payment_status) {
        const event = new CustomEvent('order:payment-status-changed', {
          detail: {
            orderId: payload.new.id,
            oldPaymentStatus: payload.old.payment_status,
            newPaymentStatus: payload.new.payment_status
          }
        });
        window.dispatchEvent(event);
      }
    }
  }

  // Handle cart updates
  private static handleCartUpdate(payload: any) {
    // Update cart count in header
    const event = new CustomEvent('cart:count-changed', {
      detail: { payload }
    });
    window.dispatchEvent(event);
  }

  // Handle property updates
  private static handlePropertyUpdate(payload: any) {
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      // Notify about status changes
      if (payload.old.status !== payload.new.status) {
        const event = new CustomEvent('property:availability-changed', {
          detail: {
            plotId: payload.new.id,
            oldStatus: payload.old.status,
            newStatus: payload.new.status
          }
        });
        window.dispatchEvent(event);
      }
    }
  }

  // Show toast notification
  private static showToastNotification(notification: any) {
    // Create a custom event that the UI can listen to
    const event = new CustomEvent('toast:show', {
      detail: {
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info'
      }
    });
    window.dispatchEvent(event);
  }

  // Get changes between old and new records
  private static getChanges(oldRecord: any, newRecord: any): Record<string, any> {
    const changes: Record<string, any> = {};
    
    Object.keys(newRecord).forEach(key => {
      if (oldRecord[key] !== newRecord[key]) {
        changes[key] = {
          old: oldRecord[key],
          new: newRecord[key]
        };
      }
    });
    
    return changes;
  }
}

// Property-specific real-time handlers
export class PropertyRealtimeHandlers {
  static handlePropertyUpdate(event: any, onUpdate: (property: LandPlot) => void) {
    if (event.eventType === 'UPDATE' && event.new) {
      const updatedProperty = this.transformPropertyData(event.new);
      onUpdate(updatedProperty);
    }
  }

  static handlePropertyStatusChange(
    event: any, 
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
  static handleOrderUpdate(event: any, onUpdate: (order: Order) => void) {
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

  static handleNewOrder(event: any, onNewOrder: (order: Order) => void) {
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

// Initialize the service
RealtimeService.initialize();