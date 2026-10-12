import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, Smartphone, Laptop, Headphones, Watch, Tv, 
  Gamepad2, Cable, Zap, ChevronRight, Sparkles, ShieldCheck, Flame, Tag 
} from 'lucide-react';

interface MegaCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  description: string;
  subcategories: { name: string; query: string }[];
  featuredPromo?: { title: string; subtitle: string; link: string; badge: string };
}

const MEGA_CATEGORIES: MegaCategory[] = [
  {
    id: 'smartphones',
    name: 'Smartphones & 5G',
    icon: Smartphone,
    badge: 'HOT',
    description: 'Flagships, Foldables & Budget 5G Devices',
    subcategories: [
      { name: 'Apple iPhone', query: 'category=Smartphones&brand=Apple' },
      { name: 'Samsung Galaxy Series', query: 'category=Smartphones&brand=Samsung' },
      { name: 'Google Pixel 5G', query: 'category=Smartphones&brand=Google' },
      { name: 'OnePlus Flagships', query: 'category=Smartphones&brand=OnePlus' },
      { name: 'Budget Phones Under ₹20,000', query: 'category=Smartphones&maxPrice=20000' },
    ],
    featuredPromo: {
      title: 'Flagship Exchange Offer',
      subtitle: 'Up to ₹12,000 bonus on old phone exchange',
      link: '/shop?category=Smartphones&sale=true',
      badge: 'LIMITED TIME',
    },
  },
  {
    id: 'laptops',
    name: 'Laptops & Computers',
    icon: Laptop,
    badge: 'POPULAR',
    description: 'MacBooks, Ultra-thin PCs & Gaming Rigs',
    subcategories: [
      { name: 'Apple MacBook Pro & Air', query: 'category=Laptops&brand=Apple' },
      { name: 'High-Performance Gaming Laptops', query: 'category=Laptops&tag=gaming' },
      { name: 'Thin & Lightweight Ultrabooks', query: 'category=Laptops&tag=ultrabook' },
      { name: 'Student & Productivity Laptops', query: 'category=Laptops&tag=student' },
      { name: 'PC Monitors & Docking Stations', query: 'category=Laptops' },
    ],
    featuredPromo: {
      title: 'Intel Core & M3 Series',
      subtitle: 'Instant ₹5,000 Bank Discount on select cards',
      link: '/shop?category=Laptops',
      badge: 'BANK OFFER',
    },
  },
  {
    id: 'audio',
    name: 'Audio & Headphones',
    icon: Headphones,
    description: 'Noise Cancelling, True Wireless & Soundbars',
    subcategories: [
      { name: 'Active Noise Cancelling (ANC)', query: 'category=Audio&tag=anc' },
      { name: 'True Wireless Earbuds (TWS)', query: 'category=Audio&tag=tws' },
      { name: 'Over-Ear Studio Headphones', query: 'category=Audio&tag=studio' },
      { name: 'Dolby Atmos Home Soundbars', query: 'category=Audio&tag=soundbar' },
      { name: 'Bluetooth Party Speakers', query: 'category=Audio&tag=speaker' },
    ],
    featuredPromo: {
      title: 'Sony & Bose Audio Fest',
      subtitle: 'Crystal clear acoustics with zero noise',
      link: '/shop?category=Audio',
      badge: 'TOP RATED',
    },
  },
  {
    id: 'wearables',
    name: 'Smart Watches & Bands',
    icon: Watch,
    description: 'Fitness Trackers, AMOLED Displays & GPS',
    subcategories: [
      { name: 'Apple Watch Series & Ultra', query: 'category=Smart%20Watches&brand=Apple' },
      { name: 'Samsung Galaxy Watch', query: 'category=Smart%20Watches&brand=Samsung' },
      { name: 'Fitness & Sleep Trackers', query: 'category=Smart%20Watches&tag=fitness' },
      { name: 'Rugged Adventure & GPS Watches', query: 'category=Smart%20Watches&tag=gps' },
      { name: 'Designer Premium Watch Bands', query: 'category=Accessories' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Smart TV & Home Theater',
    icon: Tv,
    description: '4K OLED, QLED & Streaming Devices',
    subcategories: [
      { name: '4K Ultra HD & OLED TVs', query: 'category=Audio' },
      { name: 'Gaming Displays 144Hz+', query: 'category=Laptops' },
      { name: 'Smart Streaming Sticks & Boxes', query: 'category=Accessories' },
      { name: 'Surround Sound Audio Systems', query: 'category=Audio' },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming & Consoles',
    icon: Gamepad2,
    badge: 'NEW',
    description: 'PlayStation, Xbox, Controllers & VR',
    subcategories: [
      { name: 'Gaming Consoles & Bundles', query: 'category=Accessories' },
      { name: 'Wireless Controllers & Gamepads', query: 'category=Accessories' },
      { name: 'Mechanical Gaming Keyboards & Mice', query: 'category=Accessories' },
      { name: 'Low Latency Gaming Headsets', query: 'category=Audio' },
    ],
  },
  {
    id: 'accessories',
    name: 'Charging & Cables',
    icon: Cable,
    description: 'GaN Fast Chargers, Power Banks & Hubs',
    subcategories: [
      { name: '65W+ GaN Fast Wall Chargers', query: 'category=Accessories' },
      { name: 'MagSafe Wireless Charging Pads', query: 'category=Accessories' },
      { name: 'High-Capacity Power Banks (20000mAh)', query: 'category=Accessories' },
      { name: 'USB-C Thunderbolt & Braided Cables', query: 'category=Accessories' },
      { name: 'Laptop Stands & Protective Cases', query: 'category=Accessories' },
    ],
  },
];

export function CategoriesMegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('smartphones');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const activeCategory = MEGA_CATEGORIES.find((c) => c.id === activeTab) || MEGA_CATEGORIES[0];
  const IconComponent = activeCategory.icon;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
        aria-expanded={isOpen}
      >
        <Grid size={16} />
        <span>Browse Categories</span>
        <ChevronRight
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Mega Dropdown Panel */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute top-full left-0 mt-1 w-[800px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 flex"
        >
          {/* Left Column: Department List */}
          <div className="w-64 bg-slate-50/80 border-r border-slate-100 p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Departments
            </div>
            {MEGA_CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const isSelected = cat.id === activeTab;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveTab(cat.id)}
                  onClick={() => setActiveTab(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <CatIcon size={16} className={isSelected ? 'text-white' : 'text-slate-500'} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {cat.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Subcategories & Spotlight Card */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activeCategory.name}</h4>
                    <p className="text-xs text-slate-500">{activeCategory.description}</p>
                  </div>
                </div>

                <Link
                  to={`/shop?category=${encodeURIComponent(activeCategory.name)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                {activeCategory.subcategories.map((sub, i) => (
                  <Link
                    key={i}
                    to={`/shop?${sub.query}`}
                    onClick={() => setIsOpen(false)}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-all text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center justify-between group"
                  >
                    <span className="truncate">{sub.name}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Featured Promo Box if present */}
            {activeCategory.featuredPromo && (
              <div className="mt-4 p-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded">
                    {activeCategory.featuredPromo.badge}
                  </span>
                  <p className="text-xs font-bold mt-1 text-white">{activeCategory.featuredPromo.title}</p>
                  <p className="text-[11px] text-blue-200">{activeCategory.featuredPromo.subtitle}</p>
                </div>
                <Link
                  to={activeCategory.featuredPromo.link}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 bg-white text-blue-950 hover:bg-blue-50 text-xs font-bold rounded-lg transition-colors shadow-xs shrink-0"
                >
                  Explore &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
