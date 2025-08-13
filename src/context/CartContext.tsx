import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { CartItem, LandPlot } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (plot: LandPlot) => void;
  removeFromCart: (plotId: string) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const addToCart = async (plot: LandPlot) => {
    if (!user) return;

    const existingItem = cartItems.find(item => item.plotId === plot.id);
    if (!existingItem) {
      try {
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            plot_id: plot.id,
          })
          .select()
          .single();

        if (error) throw error;

        const newItem: CartItem = {
          plotId: plot.id,
          plot,
          reservedAt: data.reserved_at,
        };
        setCartItems(prev => [...prev, newItem]);
      } catch (error) {
        console.error('Error adding to cart:', error);
      }
    }
  };

  const removeFromCart = async (plotId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('plot_id', plotId);

      if (error) throw error;

      setCartItems(prev => prev.filter(item => item.plotId !== plotId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.plot.price, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};