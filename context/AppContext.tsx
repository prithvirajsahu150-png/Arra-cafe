"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode, useCallback } from 'react';
import { MENU_ITEMS, MenuItem } from '../data/menu';

export const DELIVERY_CHARGE = 50;

export interface CartItem extends MenuItem {
  quantity: number;
}

interface AppContextType {
  // Database Menu Items
  menuItems: MenuItem[];
  refreshMenu: () => Promise<void>;

  // Food Delivery Cart
  cart: Record<string, number>;
  addToCart: (itemId: string, delta?: number) => void;
  updateCart: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartItems: CartItem[];
  subtotal: number;
  totalAmount: number;
  totalItems: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;

  // Table Booking
  bookingSelectedItems: Record<string, number>;
  addBookingItem: (itemId: string, delta?: number) => void;
  updateBookingItem: (itemId: string, delta: number) => void;
  clearBookingItems: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'arra_delivery_cart';
const BOOKING_STORAGE_KEY = 'arra_booking_items';

export function AppProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [bookingSelectedItems, setBookingSelectedItems] = useState<Record<string, number>>({});
  const isHydratedRef = useRef(false);

  // Fetch live menu from database API
  const refreshMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
          setMenuItems(data.items);
        }
      }
    } catch {
      // Fallback remains MENU_ITEMS
    }
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  // Hydrate from localStorage once on client
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedBooking = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (savedBooking) {
        setBookingSelectedItems(JSON.parse(savedBooking));
      }
    } catch {
      // Ignore storage/JSON errors
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Sync cart to localStorage after hydration
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  // Sync booking items to localStorage after hydration
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingSelectedItems));
    } catch {
      // Ignore storage errors
    }
  }, [bookingSelectedItems]);

  const addToCart = (itemId: string, delta: number = 1) => {
    const item = menuItems.find(m => m.id === itemId) || MENU_ITEMS.find(m => m.id === itemId);
    if (item && item.available === false) {
      alert(`${item.name} is currently unavailable for online orders.`);
      return;
    }

    setCart(prev => {
      const current = prev[itemId] || 0;
      return {
        ...prev,
        [itemId]: current + delta
      };
    });
  };

  const updateCart = (itemId: string, delta: number) => {
    const item = menuItems.find(m => m.id === itemId) || MENU_ITEMS.find(m => m.id === itemId);
    if (delta > 0 && item && item.available === false) {
      alert(`${item.name} is currently out of stock.`);
      return;
    }

    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = next;
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const cartItems = useMemo(() => {
    return Object.keys(cart)
      .map(id => {
        const item = menuItems.find(m => m.id === id) || MENU_ITEMS.find(m => m.id === id);
        if (!item) return null;
        return {
          ...item,
          quantity: cart[id]
        };
      })
      .filter((item): item is CartItem => item !== null && item.quantity > 0);
  }, [cart, menuItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return subtotal > 0 ? subtotal + DELIVERY_CHARGE : 0;
  }, [subtotal]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const addBookingItem = (itemId: string, delta: number = 1) => {
    setBookingSelectedItems(prev => {
      const current = prev[itemId] || 0;
      return {
        ...prev,
        [itemId]: current + delta
      };
    });
  };

  const updateBookingItem = (itemId: string, delta: number) => {
    setBookingSelectedItems(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      const newItems = { ...prev };
      if (next === 0) {
        delete newItems[itemId];
      } else {
        newItems[itemId] = next;
      }
      return newItems;
    });
  };

  const clearBookingItems = () => {
    setBookingSelectedItems({});
    try {
      localStorage.removeItem(BOOKING_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <AppContext.Provider
      value={{
        menuItems,
        refreshMenu,
        cart,
        addToCart,
        updateCart,
        clearCart,
        cartItems,
        subtotal,
        totalAmount,
        totalItems,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        bookingSelectedItems,
        addBookingItem,
        updateBookingItem,
        clearBookingItems
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
