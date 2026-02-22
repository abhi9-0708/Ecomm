/* ═══════════════════════════════════════════════════
   NovaMart — SPA Application
   ═══════════════════════════════════════════════════ */

// ── State Management ──
const Store = {
    token: localStorage.getItem('novamart_token') || null,
    user: JSON.parse(localStorage.getItem('novamart_user') || 'null'),
    cartCount: 0,

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('novamart_token', token);
        localStorage.setItem('novamart_user', JSON.stringify(user));
        updateNavUser();
    },

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('novamart_token');
        localStorage.removeItem('novamart_user');
        updateNavUser();
    },

    isLoggedIn() {
        return !!this.token;
    }
};

// ── API Client ──
const API = {
    base: '/api',

    async request(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (Store.token) headers['Authorization'] = `Bearer ${Store.token}`;

        const res = await fetch(`${this.base}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        const data = await res.json();
        if (!res.ok) throw { status: res.status, ...data };
        return data;
    },

    get(endpoint) { return this.request(endpoint); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};

// ── Toast Notifications ──
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Router ──
const routes = {};

function registerRoute(path, handler) {
    routes[path] = handler;
}

function navigateTo(hash) {
    window.location.hash = hash;
}

async function handleRoute() {
    const hash = window.location.hash || '#/';
    const [path, queryString] = hash.slice(1).split('?');
    const params = new URLSearchParams(queryString || '');

    // Match route
    let handler = routes[path];
    let routeParams = {};

    if (!handler) {
        // Try pattern matching (e.g., /products/:id)
        for (const [pattern, h] of Object.entries(routes)) {
            const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
            const match = path.match(regex);
            if (match) {
                handler = h;
                routeParams = match.groups || {};
                break;
            }
        }
    }

    if (!handler) handler = notFoundView;

    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-screen"><div class="spinner"></div></div>';

    try {
        const html = await handler(routeParams, params);
        app.innerHTML = `<div class="view-enter">${html}</div>`;
    } catch (err) {
        app.innerHTML = `<div class="view-enter"><div class="empty-state"><div class="empty-state-icon">⚠️</div><h2>Something went wrong</h2><p>${err.error || 'An unexpected error occurred.'}</p><a href="#/" class="btn btn-primary">Go Home</a></div></div>`;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('hashchange', handleRoute);

// ── Star Rating Helper ──
function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function productCardHTML(p) {
    const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    return `
    <div class="product-card" onclick="navigateTo('#/products/${p.id}')">
      <div class="product-card-image">
        ${discount > 0 ? `<span class="product-badge sale">${discount}% OFF</span>` : ''}
        ${p.featured ? `<span class="product-badge featured">Featured</span>` : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x400?text=Product'">
      </div>
      <div class="product-card-body">
        <div class="product-card-category">${p.category}</div>
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="rating-count">(${p.reviews_count})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">
            <span class="price-current">$${p.price.toFixed(2)}</span>
            ${p.original_price ? `<span class="price-original">$${p.original_price.toFixed(2)}</span>` : ''}
          </div>
          <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${p.id})" title="Add to cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

function skeletonCardHTML() {
    return `<div class="skeleton-card"><div class="skeleton skeleton-image"></div><div class="skeleton-body"><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-line medium"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line price"></div></div></div>`;
}

// ── Cart Badge Update ──
async function updateCartBadge() {
    if (!Store.isLoggedIn()) {
        document.getElementById('cart-badge').style.display = 'none';
        Store.cartCount = 0;
        return;
    }
    try {
        const data = await API.get('/cart');
        Store.cartCount = data.count;
        const badge = document.getElementById('cart-badge');
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch { /* silent */ }
}

// ── Add to Cart ──
async function addToCart(productId) {
    if (!Store.isLoggedIn()) {
        showToast('Please login to add items to cart', 'error');
        navigateTo('#/login');
        return;
    }
    try {
        await API.post('/cart', { product_id: productId, quantity: 1 });
        showToast('Added to cart!', 'success');
        updateCartBadge();
    } catch (err) {
        showToast(err.error || 'Failed to add to cart', 'error');
    }
}

// ── Nav User Area ──
function updateNavUser() {
    const area = document.getElementById('nav-user-area');
    if (Store.isLoggedIn()) {
        const initial = Store.user.name ? Store.user.name[0].toUpperCase() : '?';
        area.innerHTML = `
      <div style="position:relative">
        <button class="user-menu-btn" onclick="toggleUserMenu()">
          <div class="user-avatar">${initial}</div>
          <span class="user-menu-name">${Store.user.name}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div class="dropdown-menu" id="user-dropdown">
          <a class="dropdown-item" href="#/orders">📦 My Orders</a>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item danger" onclick="logout()">🚪 Sign Out</div>
        </div>
      </div>`;
    } else {
        area.innerHTML = `
      <a href="#/login" class="nav-user-link login">Sign In</a>
      <a href="#/register" class="nav-user-link register">Get Started</a>`;
    }
    updateCartBadge();
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('open');

    // Close on outside click
    const close = (e) => {
        if (!e.target.closest('.user-menu-btn') && !e.target.closest('.dropdown-menu')) {
            dropdown.classList.remove('open');
            document.removeEventListener('click', close);
        }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
}

function logout() {
    Store.clearAuth();
    showToast('Signed out successfully', 'info');
    navigateTo('#/');
}

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── Search ──
document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        navigateTo(`#/products?search=${encodeURIComponent(e.target.value.trim())}`);
    }
});


/* ═══════════════════════════════════════════════════
   VIEWS
   ═══════════════════════════════════════════════════ */

// ── HOME VIEW ──
registerRoute('/', async () => {
    const [featuredData, allData] = await Promise.all([
        API.get('/products?featured=1&limit=4'),
        API.get('/products?limit=8')
    ]);

    const categoryIcons = {
        'Electronics': '🔌',
        'Fashion': '👗',
        'Home & Living': '🏠',
        'Sports & Outdoors': '⚽',
        'Books & Media': '📚'
    };

    return `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">✨ New Season Collection 2026</div>
        <h1>Discover <span class="gradient-text">Premium</span><br>Products You'll Love</h1>
        <p class="hero-subtitle">Curated collection of the finest products with unmatched quality, delivered to your doorstep with care.</p>
        <div class="hero-actions">
          <a href="#/products" class="btn btn-primary">Shop Now →</a>
          <a href="#/products?category=Electronics" class="btn btn-secondary">Browse Electronics</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-value">10K+</div><div class="hero-stat-label">Happy Customers</div></div>
          <div class="hero-stat"><div class="hero-stat-value">500+</div><div class="hero-stat-label">Premium Products</div></div>
          <div class="hero-stat"><div class="hero-stat-value">99%</div><div class="hero-stat-label">Satisfaction Rate</div></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <div><h2 class="section-title">Shop by Category</h2><p class="section-subtitle">Find what you need, fast</p></div>
      </div>
      <div class="categories-grid">
        ${allData.categories.map(cat => `
          <a href="#/products?category=${encodeURIComponent(cat)}" class="category-card">
            <div class="category-icon">${categoryIcons[cat] || '📦'}</div>
            <div class="category-name">${cat}</div>
          </a>
        `).join('')}
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="section-header">
        <div><h2 class="section-title">Featured Products</h2><p class="section-subtitle">Handpicked for you</p></div>
        <a href="#/products?featured=1" class="section-link">View All →</a>
      </div>
      <div class="products-grid">
        ${featuredData.products.map(p => productCardHTML(p)).join('')}
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="section-header">
        <div><h2 class="section-title">New Arrivals</h2><p class="section-subtitle">Latest additions to our store</p></div>
        <a href="#/products" class="section-link">View All →</a>
      </div>
      <div class="products-grid">
        ${allData.products.map(p => productCardHTML(p)).join('')}
      </div>
    </section>`;
});


// ── PRODUCTS LIST VIEW ──
registerRoute('/products', async (_, params) => {
    const search = params.get('search') || '';
    const category = params.get('category') || '';
    const sort = params.get('sort') || 'newest';
    const page = params.get('page') || '1';

    const queryParts = [];
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    if (category) queryParts.push(`category=${encodeURIComponent(category)}`);
    queryParts.push(`sort=${sort}`);
    queryParts.push(`page=${page}`);
    queryParts.push('limit=12');

    const data = await API.get(`/products?${queryParts.join('&')}`);

    const buildFilterUrl = (key, value) => {
        const p = new URLSearchParams();
        if (search) p.set('search', search);
        if (category && key !== 'category') p.set('category', category);
        if (key === 'category' && value) p.set('category', value);
        if (key === 'sort') p.set('sort', value); else p.set('sort', sort);
        p.set('page', key === 'page' ? value : '1');
        return `#/products?${p.toString()}`;
    };

    let paginationHTML = '';
    if (data.totalPages > 1) {
        const pages = [];
        for (let i = 1; i <= data.totalPages; i++) pages.push(i);
        paginationHTML = `<div class="pagination">
      <a class="page-btn${data.page <= 1 ? ' disabled' : ''}" href="${buildFilterUrl('page', data.page - 1)}" ${data.page <= 1 ? 'onclick="return false"' : ''}>← Prev</a>
      ${pages.map(i => `<a class="page-btn${i === data.page ? ' active' : ''}" href="${buildFilterUrl('page', i)}">${i}</a>`).join('')}
      <a class="page-btn${data.page >= data.totalPages ? ' disabled' : ''}" href="${buildFilterUrl('page', data.page + 1)}" ${data.page >= data.totalPages ? 'onclick="return false"' : ''}>Next →</a>
    </div>`;
    }

    return `
    <div class="products-page">
      <div class="products-page-header">
        <h1>${search ? `Results for "${search}"` : category || 'All Products'}</h1>
      </div>

      <div class="filter-bar">
        <select onchange="navigateTo(this.value)" id="category-filter">
          <option value="${buildFilterUrl('category', '')}" ${!category ? 'selected' : ''}>All Categories</option>
          ${data.categories.map(c => `<option value="${buildFilterUrl('category', c)}" ${category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select onchange="navigateTo(this.value)" id="sort-filter">
          <option value="${buildFilterUrl('sort', 'newest')}" ${sort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="${buildFilterUrl('sort', 'price_asc')}" ${sort === 'price_asc' ? 'selected' : ''}>Price: Low → High</option>
          <option value="${buildFilterUrl('sort', 'price_desc')}" ${sort === 'price_desc' ? 'selected' : ''}>Price: High → Low</option>
          <option value="${buildFilterUrl('sort', 'rating')}" ${sort === 'rating' ? 'selected' : ''}>Top Rated</option>
          <option value="${buildFilterUrl('sort', 'name')}" ${sort === 'name' ? 'selected' : ''}>Name A-Z</option>
        </select>
        <span class="results-count">${data.total} product${data.total !== 1 ? 's' : ''} found</span>
      </div>

      ${data.products.length > 0 ? `
        <div class="products-grid">
          ${data.products.map(p => productCardHTML(p)).join('')}
        </div>
        ${paginationHTML}
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h2>No products found</h2>
          <p>Try adjusting your search or filters</p>
          <a href="#/products" class="btn btn-primary">View All Products</a>
        </div>
      `}
    </div>`;
});


// ── PRODUCT DETAIL VIEW ──
registerRoute('/products/:id', async (routeParams) => {
    const data = await API.get(`/products/${routeParams.id}`);
    const p = data.product;
    const discount = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
    const stockClass = p.stock > 20 ? 'in-stock' : 'low-stock';
    const stockLabel = p.stock > 20 ? 'In Stock' : `Only ${p.stock} left`;

    return `
    <div class="product-detail">
      <div class="product-detail-grid">
        <div class="product-detail-image">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/600x480?text=Product'">
        </div>
        <div class="product-detail-info">
          <div class="product-detail-category">${p.category} · ${p.brand}</div>
          <h1 class="product-detail-name">${p.name}</h1>
          <div class="product-detail-rating">
            <span class="stars">${renderStars(p.rating)}</span>
            <span>${p.rating}</span>
            <span class="rating-count">(${p.reviews_count} reviews)</span>
          </div>
          <div class="product-detail-price">
            <span class="price-current">$${p.price.toFixed(2)}</span>
            ${p.original_price ? `<span class="price-original">$${p.original_price.toFixed(2)}</span>` : ''}
            ${discount > 0 ? `<span class="discount-badge">Save ${discount}%</span>` : ''}
          </div>
          <p class="product-detail-desc">${p.description}</p>
          <div class="product-detail-meta">
            <div class="meta-row"><span class="meta-label">Brand</span><span class="meta-value">${p.brand}</span></div>
            <div class="meta-row"><span class="meta-label">Category</span><span class="meta-value">${p.category}</span></div>
            <div class="meta-row"><span class="meta-label">Availability</span><span class="meta-value ${stockClass}">${stockLabel}</span></div>
          </div>
          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="qty-controls">
              <button class="qty-btn" onclick="changeQty(-1)">−</button>
              <input type="text" class="qty-value" id="detail-qty" value="1" readonly>
              <button class="qty-btn" onclick="changeQty(1)">+</button>
            </div>
          </div>
          <div class="product-detail-actions">
            <button class="btn btn-primary" onclick="addToCartWithQty(${p.id})">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      ${data.related && data.related.length > 0 ? `
        <div class="related-section">
          <div class="section-header">
            <div><h2 class="section-title">Related Products</h2></div>
          </div>
          <div class="products-grid">
            ${data.related.map(p => productCardHTML(p)).join('')}
          </div>
        </div>
      ` : ''}
    </div>`;
});

function changeQty(delta) {
    const input = document.getElementById('detail-qty');
    if (!input) return;
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    input.value = val;
}

async function addToCartWithQty(productId) {
    if (!Store.isLoggedIn()) {
        showToast('Please login to add items to cart', 'error');
        navigateTo('#/login');
        return;
    }
    const qty = parseInt(document.getElementById('detail-qty')?.value || '1');
    try {
        await API.post('/cart', { product_id: productId, quantity: qty });
        showToast(`Added ${qty} item${qty > 1 ? 's' : ''} to cart!`, 'success');
        updateCartBadge();
    } catch (err) {
        showToast(err.error || 'Failed to add to cart', 'error');
    }
}


// ── CART VIEW ──
registerRoute('/cart', async () => {
    if (!Store.isLoggedIn()) {
        navigateTo('#/login');
        return '<div class="loading-screen"><div class="spinner"></div></div>';
    }

    const data = await API.get('/cart');

    if (data.items.length === 0) {
        return `
      <div class="cart-page">
        <h1>Shopping Cart</h1>
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <a href="#/products" class="btn btn-primary">Browse Products</a>
        </div>
      </div>`;
    }

    const shipping = data.total > 100 ? 0 : 9.99;
    const tax = Math.round(data.total * 0.08 * 100) / 100;
    const grandTotal = Math.round((data.total + shipping + tax) * 100) / 100;

    return `
    <div class="cart-page">
      <h1>Shopping Cart <span style="color:var(--text-muted);font-weight:400;font-size:1rem">(${data.count} item${data.count !== 1 ? 's' : ''})</span></h1>
      <div class="cart-layout">
        <div class="cart-items">
          ${data.items.map(item => `
            <div class="cart-item" id="cart-item-${item.id}">
              <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/120?text=Product'">
              </div>
              <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-brand">${item.brand}</div>
                <div class="cart-item-controls">
                  <div class="qty-controls">
                    <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
                    <input type="text" class="qty-value" value="${item.quantity}" readonly>
                    <button class="qty-btn" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                  </div>
                  <button class="remove-btn" onclick="removeCartItem(${item.id})">Remove</button>
                </div>
              </div>
              <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row"><span class="label">Subtotal</span><span>$${data.total.toFixed(2)}</span></div>
          <div class="summary-row"><span class="label">Shipping</span><span>${shipping === 0 ? '<span style="color:var(--success-500)">Free</span>' : '$' + shipping.toFixed(2)}</span></div>
          <div class="summary-row"><span class="label">Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
          <div class="summary-row total"><span>Total</span><span>$${grandTotal.toFixed(2)}</span></div>
          ${shipping > 0 ? `<p style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">Free shipping on orders over $100</p>` : ''}
          <a href="#/checkout" class="btn btn-primary">Proceed to Checkout</a>
        </div>
      </div>
    </div>`;
});

async function updateCartItem(itemId, newQty) {
    if (newQty < 1) return removeCartItem(itemId);
    try {
        await API.put(`/cart/${itemId}`, { quantity: newQty });
        handleRoute(); // Refresh view
        updateCartBadge();
    } catch (err) {
        showToast(err.error || 'Update failed', 'error');
    }
}

async function removeCartItem(itemId) {
    try {
        await API.delete(`/cart/${itemId}`);
        showToast('Item removed', 'info');
        handleRoute();
        updateCartBadge();
    } catch (err) {
        showToast(err.error || 'Remove failed', 'error');
    }
}


// ── CHECKOUT VIEW ──
registerRoute('/checkout', async () => {
    if (!Store.isLoggedIn()) {
        navigateTo('#/login');
        return '';
    }

    const data = await API.get('/cart');
    if (data.items.length === 0) {
        navigateTo('#/cart');
        return '';
    }

    const shipping = data.total > 100 ? 0 : 9.99;
    const tax = Math.round(data.total * 0.08 * 100) / 100;
    const grandTotal = Math.round((data.total + shipping + tax) * 100) / 100;

    return `
    <div class="checkout-page">
      <h1>Checkout</h1>
      <form class="checkout-form" onsubmit="return handleCheckout(event)">
        <div class="form-section">
          <h3>📦 Shipping Information</h3>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="shipping_name">Full Name</label>
              <input type="text" id="shipping_name" placeholder="John Doe" required>
            </div>
            <div class="form-group full-width">
              <label for="shipping_address">Street Address</label>
              <input type="text" id="shipping_address" placeholder="123 Main Street, Apt 4" required>
            </div>
            <div class="form-group">
              <label for="shipping_city">City</label>
              <input type="text" id="shipping_city" placeholder="New York" required>
            </div>
            <div class="form-group">
              <label for="shipping_zip">ZIP Code</label>
              <input type="text" id="shipping_zip" placeholder="10001" required>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>💳 Payment Method</h3>
          <div class="payment-methods">
            <div class="payment-option selected" onclick="selectPayment(this, 'card')">
              <div class="payment-option-icon">💳</div>
              <div class="payment-option-label">Credit Card</div>
            </div>
            <div class="payment-option" onclick="selectPayment(this, 'paypal')">
              <div class="payment-option-icon">🅿️</div>
              <div class="payment-option-label">PayPal</div>
            </div>
            <div class="payment-option" onclick="selectPayment(this, 'bank')">
              <div class="payment-option-icon">🏦</div>
              <div class="payment-option-label">Bank Transfer</div>
            </div>
          </div>
          <input type="hidden" id="payment_method" value="card">
        </div>

        <div class="form-section">
          <h3>📋 Order Summary</h3>
          ${data.items.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color)">
              <div style="display:flex;align-items:center;gap:12px">
                <img src="${item.image}" style="width:40px;height:40px;border-radius:6px;object-fit:cover" alt="${item.name}" onerror="this.src='https://via.placeholder.com/40'">
                <div>
                  <div style="font-weight:600;font-size:0.9rem">${item.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">Qty: ${item.quantity}</div>
                </div>
              </div>
              <div style="font-weight:700">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
          <div style="margin-top:16px">
            <div class="summary-row"><span class="label">Subtotal</span><span>$${data.total.toFixed(2)}</span></div>
            <div class="summary-row"><span class="label">Shipping</span><span>${shipping === 0 ? 'Free' : '$' + shipping.toFixed(2)}</span></div>
            <div class="summary-row"><span class="label">Tax</span><span>$${tax.toFixed(2)}</span></div>
          </div>
        </div>

        <div class="order-total-box">
          <span class="total-label">Total</span>
          <span class="total-amount">$${grandTotal.toFixed(2)}</span>
        </div>

        <button type="submit" class="btn btn-primary" id="place-order-btn" style="width:100%;padding:16px">
          Place Order — $${grandTotal.toFixed(2)}
        </button>
      </form>
    </div>`;
});

function selectPayment(el, method) {
    document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('payment_method').value = method;
}

async function handleCheckout(e) {
    e.preventDefault();
    const btn = document.getElementById('place-order-btn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
        const order = await API.post('/orders', {
            shipping_name: document.getElementById('shipping_name').value,
            shipping_address: document.getElementById('shipping_address').value,
            shipping_city: document.getElementById('shipping_city').value,
            shipping_zip: document.getElementById('shipping_zip').value,
            payment_method: document.getElementById('payment_method').value
        });

        updateCartBadge();
        navigateTo(`#/order-success/${order.order_id}`);
    } catch (err) {
        showToast(err.error || 'Checkout failed', 'error');
        btn.textContent = 'Place Order';
        btn.disabled = false;
    }
}


// ── ORDER SUCCESS ──
registerRoute('/order-success/:id', async (routeParams) => {
    return `
    <div class="success-page">
      <div class="success-card">
        <div class="success-icon">✓</div>
        <h1>Order Placed!</h1>
        <p>Thank you for shopping with NovaMart.</p>
        <p class="order-number">Order #${routeParams.id}</p>
        <div class="success-actions">
          <a href="#/orders" class="btn btn-primary">View Orders</a>
          <a href="#/products" class="btn btn-secondary">Continue Shopping</a>
        </div>
      </div>
    </div>`;
});


// ── ORDERS VIEW ──
registerRoute('/orders', async () => {
    if (!Store.isLoggedIn()) {
        navigateTo('#/login');
        return '';
    }

    const data = await API.get('/orders');

    if (data.orders.length === 0) {
        return `
      <div class="orders-page">
        <h1>My Orders</h1>
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h2>No orders yet</h2>
          <p>Start shopping to see your orders here</p>
          <a href="#/products" class="btn btn-primary">Shop Now</a>
        </div>
      </div>`;
    }

    return `
    <div class="orders-page">
      <h1>My Orders</h1>
      <div class="orders-list">
        ${data.orders.map(order => `
          <div class="order-card" onclick="navigateTo('#/orders/${order.id}')">
            <div class="order-card-header">
              <span class="order-id">Order #${order.id}</span>
              <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-card-body">
              <span class="order-meta">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ${order.item_count} item${order.item_count !== 1 ? 's' : ''}</span>
              <span class="order-total">$${order.total.toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
});


// ── ORDER DETAIL VIEW ──
registerRoute('/orders/:id', async (routeParams) => {
    if (!Store.isLoggedIn()) {
        navigateTo('#/login');
        return '';
    }

    const data = await API.get(`/orders/${routeParams.id}`);
    const order = data.order;

    return `
    <div class="orders-page">
      <h1>Order #${order.id}</h1>
      <div class="order-card" style="cursor:default">
        <div class="order-card-header">
          <span class="order-status ${order.status}">${order.status}</span>
          <span class="order-meta">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="product-detail-meta" style="margin-top:16px">
          <div class="meta-row"><span class="meta-label">Ship To</span><span class="meta-value">${order.shipping_name}</span></div>
          <div class="meta-row"><span class="meta-label">Address</span><span class="meta-value">${order.shipping_address}, ${order.shipping_city} ${order.shipping_zip}</span></div>
          <div class="meta-row"><span class="meta-label">Payment</span><span class="meta-value">${order.payment_method}</span></div>
        </div>

        <div style="margin-top:20px">
          <h3 style="font-size:1rem;margin-bottom:12px">Items</h3>
          ${order.items.map(item => `
            <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid var(--border-color)">
              <img src="${item.product_image}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" alt="${item.product_name}" onerror="this.src='https://via.placeholder.com/60'">
              <div style="flex:1">
                <div style="font-weight:600">${item.product_name}</div>
                <div style="font-size:0.85rem;color:var(--text-muted)">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
              </div>
              <div style="font-weight:700">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="summary-row total" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-color)">
          <span>Total</span><span>$${order.total.toFixed(2)}</span>
        </div>
      </div>
      <div style="margin-top:24px"><a href="#/orders" class="btn btn-secondary">← Back to Orders</a></div>
    </div>`;
});


// ── LOGIN VIEW ──
registerRoute('/login', async () => {
    if (Store.isLoggedIn()) {
        navigateTo('#/');
        return '';
    }

    return `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your NovaMart account</p>
        <form onsubmit="return handleLogin(event)">
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <input type="email" id="login-email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary" id="login-btn">Sign In</button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a href="#/register">Create one</a>
        </div>
      </div>
    </div>`;
});

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
        const data = await API.post('/auth/login', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
        Store.setAuth(data.token, data.user);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
        navigateTo('#/');
    } catch (err) {
        showToast(err.error || 'Login failed', 'error');
        btn.textContent = 'Sign In';
        btn.disabled = false;
    }
}


// ── REGISTER VIEW ──
registerRoute('/register', async () => {
    if (Store.isLoggedIn()) {
        navigateTo('#/');
        return '';
    }

    return `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Create Account</h1>
        <p class="auth-subtitle">Join NovaMart for premium shopping</p>
        <form onsubmit="return handleRegister(event)">
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <input type="text" id="reg-name" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <input type="email" id="reg-email" placeholder="you@example.com" required>
          </div>
          <div class="form-group">
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" placeholder="Min 6 characters" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary" id="register-btn">Create Account</button>
        </form>
        <div class="auth-footer">
          Already have an account? <a href="#/login">Sign in</a>
        </div>
      </div>
    </div>`;
});

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    btn.textContent = 'Creating account...';
    btn.disabled = true;

    try {
        const data = await API.post('/auth/register', {
            name: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        });
        Store.setAuth(data.token, data.user);
        showToast('Account created! Welcome to NovaMart.', 'success');
        navigateTo('#/');
    } catch (err) {
        showToast(err.error || 'Registration failed', 'error');
        btn.textContent = 'Create Account';
        btn.disabled = false;
    }
}


// ── 404 VIEW ──
function notFoundView() {
    return `
    <div class="empty-state" style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div class="empty-state-icon">404</div>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="#/" class="btn btn-primary">Go Home</a>
    </div>`;
}


// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    updateNavUser();
    handleRoute();
});
