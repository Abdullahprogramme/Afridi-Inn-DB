'use client';

import { useState, useEffect } from 'react';

export interface CartItemAddOn {
  add_on_id: number;
  add_on_name: string;
  price: number;
  quantity: number;
}

export interface CartLineItem {
  id: string; // unique key in cart
  menu_item_id: number;
  item_name: string;
  size_id: number;
  size_label: string;
  unit_price: number;
  quantity: number;
  notes?: string;
  add_ons: CartItemAddOn[];
}

export function useCart() {
  const [items, setItems] = useState<CartLineItem[]>([]);

  const addItem = (newItem: Omit<CartLineItem, 'id'>) => {
    const id = `${newItem.size_id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setItems((prev) => [...prev, { ...newItem, id }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartLineItem[]
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.unit_price * item.quantity;
    const addOnsTotal = item.add_ons.reduce(
      (aSum, addon) => aSum + addon.price * addon.quantity,
      0
    );
    return sum + itemTotal + addOnsTotal * item.quantity;
  }, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
  };
}
