const db = require('./database');

// Clear existing products
db.prepare('DELETE FROM products').run();

const products = [
    // Electronics
    {
        name: 'Pro Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones with hi-res audio, 40-hour battery life, and ultra-comfortable over-ear design. Features adaptive ANC and multi-device connectivity.',
        price: 299.99,
        original_price: 399.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category: 'Electronics',
        brand: 'AudioPro',
        rating: 4.8,
        reviews_count: 2341,
        stock: 50,
        featured: 1
    },
    {
        name: 'Ultra Slim Laptop 15"',
        description: 'Blazing-fast ultra-portable laptop with M3 chip, 16GB RAM, 512GB SSD, stunning Retina display, and all-day battery. Perfect for creators and professionals.',
        price: 1299.99,
        original_price: 1499.99,
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        category: 'Electronics',
        brand: 'TechEdge',
        rating: 4.9,
        reviews_count: 1892,
        stock: 30,
        featured: 1
    },
    {
        name: 'Smart Watch Series X',
        description: 'Advanced fitness and health tracking smartwatch with ECG, blood oxygen monitoring, GPS, and a gorgeous always-on AMOLED display. Water resistant to 50m.',
        price: 449.99,
        original_price: 499.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        category: 'Electronics',
        brand: 'WearTech',
        rating: 4.7,
        reviews_count: 3456,
        stock: 75,
        featured: 1
    },
    {
        name: '4K Action Camera',
        description: 'Rugged waterproof action camera with 4K60 recording, hypersmooth stabilization, voice control, and live streaming capability. Capture every adventure.',
        price: 349.99,
        original_price: 449.99,
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
        category: 'Electronics',
        brand: 'AdventureCam',
        rating: 4.6,
        reviews_count: 987,
        stock: 40,
        featured: 0
    },
    {
        name: 'Bluetooth Speaker Pro',
        description: 'Powerful 360° portable bluetooth speaker with deep bass, 24-hour playtime, IP67 waterproof, and party mode for linking multiple speakers.',
        price: 179.99,
        original_price: 229.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        category: 'Electronics',
        brand: 'SoundWave',
        rating: 4.5,
        reviews_count: 1543,
        stock: 60,
        featured: 0
    },
    // Fashion
    {
        name: 'Classic Leather Jacket',
        description: 'Handcrafted genuine leather biker jacket with quilted lining, YKK zippers, and adjustable waist. Timeless style meets modern comfort.',
        price: 249.99,
        original_price: 349.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
        category: 'Fashion',
        brand: 'UrbanStyle',
        rating: 4.7,
        reviews_count: 876,
        stock: 25,
        featured: 1
    },
    {
        name: 'Designer Sunglasses',
        description: 'Polarized UV400 designer sunglasses with titanium frame, anti-scratch coating, and premium case. Italian craftsmanship for unmatched style.',
        price: 189.99,
        original_price: 259.99,
        image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
        category: 'Fashion',
        brand: 'Luxe Vision',
        rating: 4.4,
        reviews_count: 654,
        stock: 45,
        featured: 0
    },
    {
        name: 'Premium Canvas Sneakers',
        description: 'Sustainable premium canvas low-top sneakers with memory foam insole, vulcanized rubber sole, and eco-friendly materials. Street style redefined.',
        price: 129.99,
        original_price: 169.99,
        image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500',
        category: 'Fashion',
        brand: 'EcoStep',
        rating: 4.6,
        reviews_count: 2103,
        stock: 80,
        featured: 1
    },
    {
        name: 'Minimalist Watch',
        description: 'Elegant minimalist analog watch with sapphire crystal, Japanese movement, genuine leather strap, and 5ATM water resistance. Understated luxury.',
        price: 199.99,
        original_price: 279.99,
        image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
        category: 'Fashion',
        brand: 'TimeCraft',
        rating: 4.8,
        reviews_count: 1234,
        stock: 35,
        featured: 0
    },
    {
        name: 'Crossbody Leather Bag',
        description: 'Full-grain leather crossbody bag with anti-theft RFID pocket, adjustable strap, and organized compartments. Ideal for travel and everyday use.',
        price: 159.99,
        original_price: 219.99,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
        category: 'Fashion',
        brand: 'TravelCraft',
        rating: 4.5,
        reviews_count: 789,
        stock: 55,
        featured: 0
    },
    // Home & Living
    {
        name: 'Smart LED Desk Lamp',
        description: 'Architect-style smart LED desk lamp with wireless charging pad, 5 color temperatures, auto-dimming sensor, and USB-C port. Eye-care certified.',
        price: 89.99,
        original_price: 129.99,
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500',
        category: 'Home & Living',
        brand: 'LumiHome',
        rating: 4.6,
        reviews_count: 1456,
        stock: 70,
        featured: 1
    },
    {
        name: 'Espresso Coffee Machine',
        description: 'Professional-grade automatic espresso machine with built-in grinder, steam wand, 15-bar pump, and programmable drink presets. Barista quality at home.',
        price: 599.99,
        original_price: 799.99,
        image: 'https://images.unsplash.com/photo-1517353246587-c6cb20648e5a?w=500',
        category: 'Home & Living',
        brand: 'BrewMaster',
        rating: 4.9,
        reviews_count: 2678,
        stock: 20,
        featured: 1
    },
    {
        name: 'Aromatherapy Diffuser',
        description: 'Ultrasonic essential oil diffuser with 7 LED mood colors, whisper-quiet mist, 500ml capacity, and auto shut-off. Transform your space into a sanctuary.',
        price: 49.99,
        original_price: 69.99,
        image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500',
        category: 'Home & Living',
        brand: 'ZenAura',
        rating: 4.4,
        reviews_count: 3211,
        stock: 90,
        featured: 0
    },
    {
        name: 'Ergonomic Office Chair',
        description: 'Premium ergonomic mesh office chair with lumbar support, adjustable armrests, headrest, and breathable mesh back. Designed for 12+ hour comfort.',
        price: 449.99,
        original_price: 599.99,
        image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
        category: 'Home & Living',
        brand: 'ComfortPro',
        rating: 4.7,
        reviews_count: 1890,
        stock: 15,
        featured: 0
    },
    {
        name: 'Smart Plant Pot',
        description: 'Self-watering smart plant pot with soil moisture sensor, app connectivity, LED grow light ring, and 3L water reservoir. Never kill a plant again.',
        price: 79.99,
        original_price: 109.99,
        image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500',
        category: 'Home & Living',
        brand: 'GreenTech',
        rating: 4.3,
        reviews_count: 567,
        stock: 65,
        featured: 0
    },
    // Sports & Outdoors
    {
        name: 'Carbon Fiber Tennis Racket',
        description: 'Tournament-grade carbon fiber tennis racket with vibration dampening, optimal sweet spot, and custom grip. Used by professionals worldwide.',
        price: 229.99,
        original_price: 299.99,
        image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=500',
        category: 'Sports & Outdoors',
        brand: 'ProRacket',
        rating: 4.6,
        reviews_count: 432,
        stock: 30,
        featured: 0
    },
    {
        name: 'Yoga Mat Premium',
        description: 'Extra-thick 8mm TPE yoga mat with alignment lines, non-slip textured surface, carrying strap, and eco-friendly materials. Cushion for your practice.',
        price: 69.99,
        original_price: 89.99,
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
        category: 'Sports & Outdoors',
        brand: 'FlowFit',
        rating: 4.5,
        reviews_count: 1876,
        stock: 100,
        featured: 1
    },
    {
        name: 'Trail Running Shoes',
        description: 'All-terrain trail running shoes with Vibram sole, Gore-Tex waterproofing, rock plate protection, and adaptive lacing system. Conquer any trail.',
        price: 179.99,
        original_price: 229.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        category: 'Sports & Outdoors',
        brand: 'TrailBlaze',
        rating: 4.7,
        reviews_count: 1543,
        stock: 45,
        featured: 0
    },
    {
        name: 'Camping Backpack 65L',
        description: 'Professional 65L hiking backpack with rain cover, ventilated back panel, hip belt, and multiple compartments. Built for multi-day adventures.',
        price: 199.99,
        original_price: 269.99,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
        category: 'Sports & Outdoors',
        brand: 'Expedition',
        rating: 4.8,
        reviews_count: 876,
        stock: 25,
        featured: 0
    },
    {
        name: 'Resistance Bands Set',
        description: 'Complete 5-band resistance training set with door anchor, handles, ankle straps, and carrying pouch. 10-150lbs total resistance for full-body workouts.',
        price: 39.99,
        original_price: 59.99,
        image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
        category: 'Sports & Outdoors',
        brand: 'FitForce',
        rating: 4.4,
        reviews_count: 2341,
        stock: 120,
        featured: 0
    },
    // Books & Media
    {
        name: 'E-Reader Pro',
        description: 'Premium e-reader with 7" glare-free display, warm light, waterproof design, 32GB storage, and weeks-long battery life. Your entire library in your hand.',
        price: 249.99,
        original_price: 299.99,
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
        category: 'Books & Media',
        brand: 'ReadTech',
        rating: 4.8,
        reviews_count: 3456,
        stock: 40,
        featured: 1
    },
    {
        name: 'Vinyl Record Player',
        description: 'Retro-modern belt-drive turntable with built-in preamp, Bluetooth output, Audio-Technica cartridge, and walnut wood plinth. Warm analog sound.',
        price: 329.99,
        original_price: 399.99,
        image: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500',
        category: 'Books & Media',
        brand: 'VinylAge',
        rating: 4.7,
        reviews_count: 789,
        stock: 20,
        featured: 0
    },
    {
        name: 'Noise Cancelling Earbuds',
        description: 'True wireless ANC earbuds with spatial audio, 30-hour total battery, wireless charging case, and IPX5 sweat resistance. Crystal-clear calls.',
        price: 199.99,
        original_price: 249.99,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500',
        category: 'Electronics',
        brand: 'AudioPro',
        rating: 4.6,
        reviews_count: 4521,
        stock: 85,
        featured: 0
    },
    {
        name: 'Mechanical Keyboard RGB',
        description: 'Premium 75% mechanical keyboard with hot-swappable switches, per-key RGB, PBT keycaps, aluminum frame, and USB-C. The ultimate typing experience.',
        price: 169.99,
        original_price: 219.99,
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500',
        category: 'Electronics',
        brand: 'KeyCraft',
        rating: 4.8,
        reviews_count: 2134,
        stock: 55,
        featured: 0
    }
];

const insert = db.prepare(`
  INSERT INTO products (name, description, price, original_price, image, category, brand, rating, reviews_count, stock, featured)
  VALUES (@name, @description, @price, @original_price, @image, @category, @brand, @rating, @reviews_count, @stock, @featured)
`);

const insertMany = db.transaction((products) => {
    for (const product of products) {
        insert.run(product);
    }
});

insertMany(products);

console.log(`✅ Seeded ${products.length} products successfully!`);
process.exit(0);
