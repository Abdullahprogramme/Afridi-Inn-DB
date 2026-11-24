'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { mockMenuItems, mockCategories } from '@/lib/mocks';
import { formatMoney } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filteredItems = mockMenuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === null || item.category_id === selectedCategory;
    const matchesSearch =
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.item_description &&
        item.item_description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Group by category
  const categoriesToDisplay = selectedCategory
    ? mockCategories.filter((c) => c.category_id === selectedCategory)
    : mockCategories;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E7E0D6]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917]">
            Full Restaurant Menu
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Browse our complete selection of authentic dishes, Karahis, and charcoal grills.
          </p>
        </div>

        <div className="w-full md:w-72">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
          </div>
        </div>
      </div>

      {/* Sticky Category Tabs */}
      <div className="sticky top-16 z-30 bg-[#FAF7F2]/95 backdrop-blur-xs py-3 border-b border-[#E7E0D6] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
              : 'bg-white border border-[#E7E0D6] text-[#57534E] hover:border-[#C2410C]'
          }`}
        >
          All Categories
        </button>
        {mockCategories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setSelectedCategory(cat.category_id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === cat.category_id
                ? 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
                : 'bg-white border border-[#E7E0D6] text-[#57534E] hover:border-[#C2410C]'
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Menu Categories and Cards */}
      <div className="space-y-12">
        {categoriesToDisplay.map((cat) => {
          const itemsInCat = filteredItems.filter(
            (item) => item.category_id === cat.category_id
          );

          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat.category_id} className="space-y-4">
              <h2 className="text-2xl font-bold text-[#1C1917] border-l-4 border-[#C2410C] pl-3">
                {cat.category_name}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsInCat.map((item) => (
                  <Card key={`${item.menu_item_id}-${item.size_id}`} className="flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-[#1C1917]">
                          {item.item_name}
                        </h3>
                        <span className="font-mono font-bold text-[#C2410C] text-sm shrink-0">
                          {formatMoney(item.price)}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] line-clamp-2">
                        {item.item_description}
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-600 font-medium">
                        Portion: {item.size_label}
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E7E0D6] flex items-center justify-between">
                      <span className="text-xs text-stone-400 font-medium">
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                      <Link href="/order">
                        <Button size="sm">Add to Order</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
