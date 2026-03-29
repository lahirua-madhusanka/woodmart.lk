export const categories = [
  {
    id: "living",
    name: "Living Room",
    image:
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=80",
    items: 32,
  },
  {
    id: "dining",
    name: "Dining",
    image:
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=900&q=80",
    items: 24,
  },
  {
    id: "lighting",
    name: "Lighting",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    items: 18,
  },
  {
    id: "office",
    name: "Home Office",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    items: 16,
  },
];

export const products = [
  {
    id: 1,
    name: "Nordic Oak Lounge Chair",
    category: "Living Room",
    price: 249,
    oldPrice: 329,
    rating: 4.8,
    sku: "AO-LIV-001",
    tags: ["wood", "lounge", "minimal"],
    badge: "Best Seller",
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616594039964-0d8f8da66f1f?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Hand-finished oak lounge chair with ergonomic contours, premium linen upholstery, and timeless Scandinavian proportioning.",
  },
  {
    id: 2,
    name: "Walnut Arc Floor Lamp",
    category: "Lighting",
    price: 189,
    oldPrice: 229,
    rating: 4.6,
    sku: "AO-LIT-004",
    tags: ["lamp", "walnut", "ambient"],
    badge: "Limited",
    image:
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "A sculptural floor lamp crafted from walnut veneer with a brushed brass base and warm diffused LED output.",
  },
  {
    id: 3,
    name: "Sienna Ceramic Vase Set",
    category: "Decor",
    price: 79,
    oldPrice: 99,
    rating: 4.7,
    sku: "AO-DEC-009",
    tags: ["ceramic", "decor", "set"],
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1602872030357-4d4785f89c0f?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602872030357-4d4785f89c0f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616627458628-9f3a7f8ea9f2?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Textured handcrafted ceramic vase collection designed for modern arrangements and everyday visual warmth.",
  },
  {
    id: 4,
    name: "Haven Linen Sofa",
    category: "Living Room",
    price: 899,
    oldPrice: 1099,
    rating: 4.9,
    sku: "AO-LIV-010",
    tags: ["sofa", "linen", "premium"],
    badge: "Editor's Pick",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Deep-seat sofa with stain-resistant linen blend fabric, solid beechwood frame, and cloud-soft cushions.",
  },
  {
    id: 5,
    name: "Mori Dining Table",
    category: "Dining",
    price: 699,
    oldPrice: 799,
    rating: 4.5,
    sku: "AO-DIN-003",
    tags: ["dining", "oak", "table"],
    badge: "Top Rated",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1617104551722-3b2d51366495?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Solid oak dining table featuring beveled edges and a matte protective finish for daily family use.",
  },
  {
    id: 6,
    name: "Auric Wall Mirror",
    category: "Decor",
    price: 149,
    oldPrice: 179,
    rating: 4.4,
    sku: "AO-DEC-013",
    tags: ["mirror", "gold", "wall"],
    badge: "Trending",
    image:
      "https://images.unsplash.com/photo-1616627981459-8ee3f0c5a3d8?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1616627981459-8ee3f0c5a3d8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600488999620-0158f6f7d95a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Rounded statement mirror with brushed metallic frame that opens up compact spaces with elegant depth.",
  },
  {
    id: 7,
    name: "Harbor Sideboard",
    category: "Dining",
    price: 579,
    oldPrice: 669,
    rating: 4.7,
    sku: "AO-DIN-014",
    tags: ["storage", "dining", "cabinet"],
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Mid-century inspired sideboard with push-open doors and generous hidden storage for curated interiors.",
  },
  {
    id: 8,
    name: "Atlas Office Desk",
    category: "Home Office",
    price: 459,
    oldPrice: 519,
    rating: 4.6,
    sku: "AO-OFF-006",
    tags: ["desk", "office", "oak"],
    badge: "Best Seller",
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Cable-managed workstation desk with oak top, black steel frame, and compact profile for modern homes.",
  },
  {
    id: 9,
    name: "Loom Woven Basket",
    category: "Lifestyle",
    price: 39,
    oldPrice: 49,
    rating: 4.3,
    sku: "AO-LIF-011",
    tags: ["basket", "storage", "lifestyle"],
    badge: "Eco",
    image:
      "https://images.unsplash.com/photo-1519710884006-2e974f61882d?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519710884006-2e974f61882d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560185009-dddeb820c7b7?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Artisan woven basket made from natural fibers, ideal for throws, toys, and shelf styling.",
  },
  {
    id: 10,
    name: "Cloud Tufted Rug",
    category: "Lifestyle",
    price: 219,
    oldPrice: 279,
    rating: 4.8,
    sku: "AO-LIF-020",
    tags: ["rug", "soft", "living"],
    badge: "Top Rated",
    image:
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616627458628-9f3a7f8ea9f2?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Ultra-soft tufted area rug with dense pile and subtle geometric pattern to anchor any room.",
  },
  {
    id: 11,
    name: "Oslo Pendant Cluster",
    category: "Lighting",
    price: 329,
    oldPrice: 389,
    rating: 4.7,
    sku: "AO-LIT-021",
    tags: ["pendant", "lighting", "glass"],
    badge: "New",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Three-globe pendant fixture with warm brass hardware, ideal for dining islands and stair voids.",
  },
  {
    id: 12,
    name: "Breeze Cotton Throw",
    category: "Lifestyle",
    price: 54,
    oldPrice: 69,
    rating: 4.5,
    sku: "AO-LIF-024",
    tags: ["throw", "cotton", "cozy"],
    badge: "Limited",
    image:
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519947486511-46149fa0a254?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1560185009-dddeb820c7b7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600488999620-0158f6f7d95a?auto=format&fit=crop&w=900&q=80",
    ],
    description:
      "Breathable cotton throw blanket with soft fringe edge, crafted for year-round comfort and layering.",
  },
];

export const testimonials = [
  {
    id: 1,
    name: "Marta J.",
    quote:
      "The quality feels boutique-level and delivery was surprisingly fast. The chair is the hero of our living room.",
  },
  {
    id: 2,
    name: "Ethan P.",
    quote:
      "A clean shopping experience and premium packaging. It feels like a designer showroom online.",
  },
];