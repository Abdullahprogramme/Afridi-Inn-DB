'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { mockMenuItems, mockAddOns, mockCategories } from '@/lib/mocks';
import { FullMenuItem, AddOn } from '@/types';
import { formatMoney } from '@/lib/constants';
import { isValidPakistaniPhone } from '@/lib/utils';
import { useCart, CartLineItem } from '@/hooks/useCart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { SimulatedPaymentBadge } from '@/components/shared/SimulatedPaymentBadge';
import { toast } from 'sonner';

export default function OnlineOrderPage() {
  const router = useRouter();
  const { items: cartItems, addItem, removeItem, updateQuantity, subtotal } = useCart();

  // Active Category filter
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  // Dialog State for adding item
  const [modalItem, setModalItem] = useState<FullMenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<FullMenuItem | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [id: number]: number }>({});
  const [itemNotes, setItemNotes] = useState('');

  // Checkout inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Online');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open item customization dialog
  const handleOpenItem = (item: FullMenuItem) => {
    setModalItem(item);
    setSelectedSize(item);
    setSelectedAddOns({});
    setItemNotes('');
  };

  // Toggle add-on in dialog
  const handleToggleAddOn = (addonId: number) => {
    setSelectedAddOns((prev) => {
      const next = { ...prev };
      if (next[addonId]) {
        delete next[addonId];
      } else {
        next[addonId] = 1;
      }
      return next;
    });
  };

  // Add to cart from dialog
  const handleAddToCart = () => {
    if (!selectedSize) return;

    const addons = Object.entries(selectedAddOns).map(([idStr, qty]) => {
      const addon = mockAddOns.find((a) => a.add_on_id === parseInt(idStr));
      return {
        add_on_id: parseInt(idStr),
        add_on_name: addon?.add_on_name || 'Addon',
        price: addon?.price || 0,
        quantity: qty,
      };
    });

    addItem({
      menu_item_id: selectedSize.menu_item_id,
      item_name: selectedSize.item_name,
      size_id: selectedSize.size_id,
      size_label: selectedSize.size_label,
      unit_price: selectedSize.price,
      quantity: 1,
      notes: itemNotes.trim() || undefined,
      add_ons: addons,
    });

    toast.success(`Added ${selectedSize.item_name} to cart`);
    setModalItem(null);
  };

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Your cart is empty. Add items first.');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter your name.');
      return;
    }

    if (!isValidPakistaniPhone(customerPhone)) {
      toast.error('Please enter a valid Pakistani mobile number (e.g. 03001234567).');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate order placement
      await new Promise((r) => setTimeout(r, 600));

      const billNumber = `KHI1-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0042`;
      const trackingToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Pass details via query params
      router.push(
        `/order/confirmed?bill=${billNumber}&token=${trackingToken}&total=${subtotal}`
      );
    } catch {
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedItems = selectedCat
    ? mockMenuItems.filter((i) => i.category_id === selectedCat)
    : mockMenuItems;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Menu Selector */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1C1917]">Place Online Order</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Select dishes, portion sizes, and add-on sides.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E7E0D6]">
            <button
              onClick={() => setSelectedCat(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCat === null
                  ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                  : 'bg-white border border-[#E7E0D6] text-[#57534E] hover:border-[#C2410C]'
              }`}
            >
              All Items
            </button>
            {mockCategories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCat(cat.category_id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCat === cat.category_id
                    ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                    : 'bg-white border border-[#E7E0D6] text-[#57534E] hover:border-[#C2410C]'
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedItems.map((item) => (
              <Card
                key={`${item.menu_item_id}-${item.size_id}`}
                className="p-4 flex flex-col justify-between hover:border-[#C2410C] transition-colors cursor-pointer"
                onClick={() => handleOpenItem(item)}
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-[#1C1917]">{item.item_name}</h3>
                    <span className="font-mono font-bold text-[#C2410C] text-sm">
                      {formatMoney(item.price)}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E] line-clamp-2">
                    {item.item_description}
                  </p>
                  <p className="text-[11px] font-medium text-stone-500 pt-1">
                    Size: {item.size_label}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E7E0D6] flex justify-end">
                  <Button size="sm" variant="secondary" className="h-8 text-xs">
                    Choose & Customize
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Order Cart */}
        <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-20">
          <Card className="p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D6]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
                <h2 className="font-bold text-base text-[#1C1917]">Your Cart</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EEE6] text-[#57534E]">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-sm">
                Your cart is empty. Click on any dish to add it.
              </div>
            ) : (
              <div className="divide-y divide-[#E7E0D6] max-h-64 overflow-y-auto pr-1">
                {cartItems.map((cItem) => (
                  <div key={cItem.id} className="py-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate">
                          {cItem.item_name}
                        </p>
                        <p className="text-[11px] text-[#57534E]">
                          {cItem.size_label} · {formatMoney(cItem.unit_price)}
                        </p>
                        {cItem.add_ons.map((ao) => (
                          <p key={ao.add_on_id} className="text-[10px] text-stone-500">
                            + {ao.add_on_name} ({formatMoney(ao.price)})
                          </p>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateQuantity(cItem.id, -1)}
                          className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center font-mono">
                          {cItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cItem.id, 1)}
                          className="w-6 h-6 rounded bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(cItem.id)}
                          className="text-stone-300 hover:text-red-500 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Summary */}
            <div className="pt-3 border-t border-[#E7E0D6] space-y-1.5">
              <div className="flex items-center justify-between text-base font-extrabold text-[#1C1917]">
                <span>Order Total:</span>
                <span className="font-mono text-[#C2410C] text-lg">
                  {formatMoney(subtotal)}
                </span>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleCheckout} className="space-y-3 pt-2">
              <Input
                label="Your Full Name *"
                placeholder="e.g. Abdullah Tariq"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <Input
                label="Phone Number (WhatsApp) *"
                placeholder="e.g. 03001234567"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />

              <Input
                label="Special Cooking Notes"
                placeholder="e.g. Less spice, extra lemons"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Online')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors ${
                      paymentMethod === 'Online'
                        ? 'bg-[#FFEDD5] border-[#C2410C] text-[#C2410C]'
                        : 'bg-white border-[#E7E0D6] text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Online Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-colors ${
                      paymentMethod === 'Cash'
                        ? 'bg-[#FFEDD5] border-[#C2410C] text-[#C2410C]'
                        : 'bg-white border-[#E7E0D6] text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <SimulatedPaymentBadge />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isSubmitting}
                disabled={cartItems.length === 0}
              >
                Place Order ({formatMoney(subtotal)})
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Item Customization Modal */}
      {modalItem && (
        <Dialog
          open={!!modalItem}
          onOpenChange={(open) => !open && setModalItem(null)}
          title={modalItem.item_name}
          description={modalItem.item_description || 'Select portion size and optional add-ons.'}
        >
          <div className="space-y-4">
            {/* Sizes */}
            <div>
              <p className="text-xs font-bold text-[#1C1917] mb-2 uppercase tracking-wider">
                Portion Size
              </p>
              <div className="space-y-2">
                {mockMenuItems
                  .filter((m) => m.menu_item_id === modalItem.menu_item_id)
                  .map((sizeItem) => (
                    <label
                      key={sizeItem.size_id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSize?.size_id === sizeItem.size_id
                          ? 'border-[#C2410C] bg-[#FFEDD5]/40 text-[#1C1917]'
                          : 'border-[#E7E0D6] hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize?.size_id === sizeItem.size_id}
                          onChange={() => setSelectedSize(sizeItem)}
                          className="text-[#C2410C] focus:ring-[#C2410C]"
                        />
                        <span className="text-sm font-semibold">{sizeItem.size_label}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#C2410C]">
                        {formatMoney(sizeItem.price)}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <p className="text-xs font-bold text-[#1C1917] mb-2 uppercase tracking-wider">
                Add-Ons & Sides (Optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mockAddOns.map((addon) => {
                  const isChecked = !!selectedAddOns[addon.add_on_id];
                  return (
                    <label
                      key={addon.add_on_id}
                      className={`flex items-center justify-between p-2.5 rounded-md border text-xs cursor-pointer ${
                        isChecked
                          ? 'border-[#C2410C] bg-[#FFEDD5]/30 font-semibold'
                          : 'border-[#E7E0D6] hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAddOn(addon.add_on_id)}
                          className="rounded text-[#C2410C] focus:ring-[#C2410C]"
                        />
                        <span>{addon.add_on_name}</span>
                      </div>
                      <span className="font-mono text-stone-600">
                        +{formatMoney(addon.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <Input
                label="Item Cooking Notes"
                placeholder="e.g. No green chillies, well done"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleAddToCart} className="w-full mt-4">
              Add to Cart
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
