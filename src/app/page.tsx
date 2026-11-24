import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, Clock, Award } from 'lucide-react';
import { mockMenuItems, mockCategories } from '@/lib/mocks';
import { formatMoney } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  // Get unique items for preview
  const featuredItems = Array.from(
    new Map(mockMenuItems.map((item) => [item.menu_item_id, item])).values()
  ).slice(0, 6);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative bg-[#FAF7F2] border-b border-[#E7E0D6] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFEDD5] text-[#9A3412] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Authentic Shinwari & Charcoal BBQ</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#1C1917] tracking-tight max-w-3xl mx-auto leading-tight">
            Fresh from the <span className="text-[#C2410C]">Afridi Inn</span> kitchen
          </h1>

          <p className="text-lg sm:text-xl text-[#57534E] max-w-2xl mx-auto">
            Traditional slow-cooked Shinwari Karahi, sizzling mutton seekh kababs, and
            tandoori breads prepared fresh to order with pure ingredients.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/order">
              <Button size="lg" className="w-full sm:w-auto shadow-md">
                Order Online Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/track">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Track My Order
              </Button>
            </Link>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-10 border-t border-[#E7E0D6]/60">
            <div className="flex items-center justify-center gap-3 text-stone-700">
              <Flame className="w-5 h-5 text-[#C2410C]" />
              <span className="text-sm font-semibold">100% Fresh Meat Cut Daily</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-stone-700">
              <Clock className="w-5 h-5 text-[#C2410C]" />
              <span className="text-sm font-semibold">Live Cooking & Order Tracking</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-stone-700">
              <Award className="w-5 h-5 text-[#C2410C]" />
              <span className="text-sm font-semibold">Decades of Traditional Taste</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
              Customer Favourites
            </h2>
            <p className="text-sm text-[#57534E] mt-1">
              Top-rated Shinwari and BBQ specialties prepared by our master chefs.
            </p>
          </div>
          <Link href="/menu">
            <Button variant="secondary" size="sm">
              View Full Menu &rarr;
            </Button>
          </Link>
        </div>

        {/* Category Pills Preview */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="px-4 py-1.5 rounded-full bg-[#FFEDD5] text-[#9A3412] text-xs font-bold whitespace-nowrap">
            All Items
          </span>
          {mockCategories.map((cat) => (
            <Link
              key={cat.category_id}
              href={`/menu?category=${cat.category_id}`}
              className="px-4 py-1.5 rounded-full bg-white border border-[#E7E0D6] text-[#57534E] hover:border-[#C2410C] hover:text-[#C2410C] text-xs font-semibold whitespace-nowrap transition-colors"
            >
              {cat.category_name}
            </Link>
          ))}
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.map((item) => (
            <Card key={item.menu_item_id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-[#1C1917]">
                    {item.item_name}
                  </h3>
                  <span className="font-mono font-bold text-[#C2410C] text-base shrink-0">
                    from {formatMoney(item.price)}
                  </span>
                </div>
                <p className="text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                  {item.item_description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E7E0D6] flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">
                  {item.category_name}
                </span>
                <Link href="/order">
                  <Button size="sm">Order Now</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
