import { Product, Category, Brand } from './types';

export const categories: Category[] = [
  { id: 'c1', name: 'Smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80' },
  { id: 'c2', name: 'Laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80' },
  { id: 'c3', name: 'Audio', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
  { id: 'c4', name: 'Smart Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80' },
  { id: 'c5', name: 'Accessories', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80' }
];

export const brands: Brand[] = [
  { id: 'b1', name: 'Apple' },
  { id: 'b2', name: 'Samsung' },
  { id: 'b3', name: 'Sony' },
  { id: 'b4', name: 'Dell' },
  { id: 'b5', name: 'Bose' }
];

export const products: Product[] = [
  {
    id: 'p1',
    name: 'iPhone 15 Pro Max',
    description: 'The ultimate iPhone with aerospace-grade titanium design, A17 Pro chip, and advanced 48MP camera system.',
    shortSpecification: 'A17 Pro Chip, 48MP Camera, Titanium Design',
    price: 154900,
    originalPrice: 159900,
    discountPercentage: 3,
    rating: 4.9,
    reviewsCount: 1420,
    category: 'Smartphones',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: true,
    isNewArrival: true,
    inStock: true,
    stock: 45,
    features: ['Titanium design', 'A17 Pro chip', '48MP Main camera', 'USB-C 3.0'],
    specifications: { 'Display': '6.7-inch Super Retina XDR', 'Processor': 'A17 Pro', 'Storage': '256GB' }
  },
  {
    id: 'p2',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Galaxy AI is here. Epic titanium shield with 200MP camera and embedded S Pen.',
    shortSpecification: 'Snapdragon 8 Gen 3, 200MP Quad Camera, S Pen',
    price: 129999,
    originalPrice: 134999,
    discountPercentage: 4,
    rating: 4.8,
    reviewsCount: 980,
    category: 'Smartphones',
    brand: 'Samsung',
    image: 'https://images.unsplash.com/photo-1707328131343-fc05504d60c2?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1707328131343-fc05504d60c2?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: true,
    isNewArrival: true,
    inStock: true,
    stock: 30,
    features: ['Galaxy AI', 'Armor Titanium', '200MP ProVisual Engine', 'S Pen Included'],
    specifications: { 'Display': '6.8-inch Dynamic AMOLED 2X', 'Processor': 'Snapdragon 8 Gen 3', 'Storage': '512GB' }
  },
  {
    id: 'p3',
    name: 'MacBook Pro 16" M3 Max',
    description: 'The most advanced Mac laptop ever built for pro workflows with up to 22 hours of battery life.',
    shortSpecification: 'Apple M3 Max, 36GB Unified Memory, Liquid Retina XDR',
    price: 349900,
    originalPrice: 369900,
    discountPercentage: 5,
    rating: 5.0,
    reviewsCount: 312,
    category: 'Laptops',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: true,
    isNewArrival: false,
    inStock: true,
    stock: 18,
    features: ['M3 Max chip', 'Liquid Retina XDR Display', 'MagSafe 3', 'Studio-quality mics'],
    specifications: { 'Display': '16.2-inch Liquid Retina XDR', 'Processor': 'M3 Max 14-core', 'Storage': '1TB SSD' }
  },
  {
    id: 'p4',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise canceling with two processors and 8 microphones for unmatched silence.',
    shortSpecification: 'Auto NC Optimizer, 30-Hour Battery, Crystal Clear Hands-Free',
    price: 29990,
    originalPrice: 34990,
    discountPercentage: 14,
    rating: 4.9,
    reviewsCount: 2150,
    category: 'Audio',
    brand: 'Sony',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: true,
    isNewArrival: false,
    inStock: true,
    stock: 65,
    features: ['Dual Processor V1 & QN1', 'Speak-to-Chat', 'Multi-point connection', 'Quick Charge'],
    specifications: { 'Battery': '30 Hours', 'Weight': '250g', 'Bluetooth': '5.2' }
  },
  {
    id: 'p5',
    name: 'Apple Watch Ultra 2',
    description: 'Rugged and capable, built for endurance athletes, outdoor adventurers, and water sports enthusiasts.',
    shortSpecification: '49mm Titanium Case, Precision Dual-Frequency GPS, 3000 Nits',
    price: 89900,
    originalPrice: 89900,
    discountPercentage: 0,
    rating: 4.8,
    reviewsCount: 654,
    category: 'Smart Watches',
    brand: 'Apple',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: false,
    isNewArrival: true,
    inStock: true,
    stock: 25,
    features: ['Custom Action Button', 'Depth Gauge', 'S9 SiP with Double Tap gesture', 'Up to 72h low power'],
    specifications: { 'Case': '49mm Aerospace Titanium', 'Water Resistance': '100m', 'Display': 'Sapphire Crystal' }
  },
  {
    id: 'p6',
    name: 'Dell XPS 15 OLED Touch',
    description: 'Immersive 3.5K OLED InfinityEdge touch display powered by 13th Gen Intel Core i7.',
    shortSpecification: 'Intel Core i7-13700H, RTX 4060, 3.5K OLED Display',
    price: 189990,
    originalPrice: 209990,
    discountPercentage: 10,
    rating: 4.7,
    reviewsCount: 420,
    category: 'Laptops',
    brand: 'Dell',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
    ],
    isBestSeller: false,
    isNewArrival: true,
    inStock: true,
    stock: 12,
    features: ['CNC machined aluminum', 'Carbon fiber palm rest', 'Quad-speaker sound system', 'Thunderbolt 4'],
    specifications: { 'Display': '15.6-inch 3.5K OLED Touch', 'Processor': 'Intel i7-13700H', 'Storage': '1TB NVMe' }
  }
];
