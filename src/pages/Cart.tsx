import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, CreditCard, MapPin, Ruler, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ApiService } from '../services/api';

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, removeFromCart, clearCart, getTotalAmount } = useCart();
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (user) {
      loadCartItems();
    }
  }, [user]);

  const loadCartItems = async () => {
    if (!user) return;
    
    try {
      const items = await ApiService.getCartItems(user.id);
      // Update cart context with loaded items
      // This would need to be implemented in the CartContext
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const handleRemoveItem = async (plotId: string) => {
    await removeFromCart(plotId);
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;

    setLoading(true);
    try {
      // Create orders for each cart item
      for (const item of cartItems) {
        await ApiService.createOrder(user.id, item.plotId, item.plot.price);
        
        // Update plot status to reserved
        await ApiService.updatePlotStatus(item.plotId, 'reserved');
        
        // Create notification
        await ApiService.createNotification(
          user.id,
          'Order Created',
          `Your order for ${item.plot.title} has been created and is pending payment.`,
          'success'
        );
      }

      // Clear cart after successful checkout
      await clearCart();
      setShowCheckout(false);
      
      // Show success message or redirect
      alert('Orders created successfully! Check your dashboard for payment instructions.');
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your cart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            Review your selected properties before proceeding to checkout.
          </p>
        </motion.div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">
              Browse our properties and add some to your cart to get started.
            </p>
            <a
              href="/properties"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
            >
              <MapPin className="h-5 w-5" />
              <span>Browse Properties</span>
            </a>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Cart Items ({cartItems.length})
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              </div>

              {cartItems.map((item, index) => (
                <motion.div
                  key={item.plotId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start space-x-4">
                    {/* Property Image */}
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex-shrink-0">
                      {item.plot.images && item.plot.images.length > 0 ? (
                        <img
                          src={item.plot.images[0]}
                          alt={item.plot.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-primary-300" />
                        </div>
                      )}
                    </div>

                    {/* Property Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.plot.title}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {item.plot.location.council}, {item.plot.location.district}, {item.plot.location.region}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Ruler className="h-4 w-4 mr-1" />
                          <span>
                            {item.plot.area.toLocaleString()} m² ({item.plot.size.width}m × {item.plot.size.length}m)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary-600">
                            {formatPrice(item.plot.price)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Reserved on {new Date(item.reservedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item.plotId)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 sticky top-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items ({cartItems.length})</span>
                    <span className="font-medium">{formatPrice(getTotalAmount())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">TZS 0</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(getTotalAmount())}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Important Notice</p>
                      <p>
                        Properties in your cart are temporarily reserved. Complete your purchase 
                        within 24 hours to secure these plots.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>{loading ? 'Processing...' : 'Proceed to Checkout'}</span>
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  By proceeding, you agree to our terms and conditions.
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Order</h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Order Summary:</p>
                  <p className="font-semibold">{cartItems.length} Properties</p>
                  <p className="text-lg font-bold text-primary-600">
                    Total: {formatPrice(getTotalAmount())}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next Steps:</strong> After confirming your order, you'll receive 
                    payment instructions via email and in your dashboard. Complete payment 
                    within 48 hours to finalize your purchase.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;