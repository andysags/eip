/**
 * Logic for Catalogue Page
 */

let state = {
    products: [],
    filters: {
        category: 'all',
        maxPrice: 200000,
        search: ''
    }
};

document.addEventListener('appReady', () => {
    state.products = Store.getAllProducts();

    // Check for URL params (Search)
    const urlSearch = Utils.getUrlParam('search');
    if (urlSearch) {
        state.filters.search = decodeURIComponent(urlSearch);
        document.getElementById('catalogue-search').value = state.filters.search;
    }

    renderFilters();
    renderProducts();
    setupEventListeners();
});

function renderFilters() {
    // Categories hardcoded for now or we could derive from unique values in products
    const categories = [
        { id: 'all', name: 'Tout' },
        { id: 'packs', name: 'Packs Complets' },
        { id: 'sonorisation', name: 'Sonorisation' },
        { id: 'mobilier', name: 'Mobilier' },
        { id: 'tentes', name: 'Tentes & Chapiteaux' },
        { id: 'eclairage', name: 'Éclairage' },
        { id: 'decoration', name: 'Décoration' },
        { id: 'energie', name: 'Énergie' }
    ];

    const container = document.getElementById('category-filters');

    container.innerHTML = categories.map(cat => `
        <label class="checkbox-label">
            <input type="radio" name="category" value="${cat.id}" ${state.filters.category === cat.id ? 'checked' : ''}>
            ${cat.name}
        </label>
    `).join('');
}

function renderProducts() {
    const container = document.getElementById('products-grid');
    const noResults = document.getElementById('no-results');

    // Filter Logic
    const filtered = state.products.filter(p => {
        const matchCategory = state.filters.category === 'all' || p.category === state.filters.category;
        const matchPrice = p.price <= state.filters.maxPrice;
        const matchSearch = !state.filters.search ||
            p.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
            p.description.toLowerCase().includes(state.filters.search.toLowerCase());

        return matchCategory && matchPrice && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    // Animate products in
    container.innerHTML = filtered.map((product, index) => {
        if (!product.id) return ''; // Skip if broken

        return `
        <div class="product-card" style="animation: fadeInUp 0.5s ease backwards ${index * 0.1}s">
            <div class="product-image" style="background-image: url('${product.image || 'assets/img/placeholder.jpg'}'); background-size: cover; background-position: center; height: 180px;">
                ${(product.is_popular || product.isPopular) ? '<span class="product-badge">Populaire</span>' : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title"><a href="product-details.html?id=${product.id}">${product.name}</a></h3>
                <div class="product-price">${Utils.formatCurrency(product.price)} <span>/ jour</span></div>
                <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                    <button class="btn btn-outline btn-sm voirProdBtn" data-id="${product.id}" style="flex: 1; text-align: center;">Voir</button>
                    <button class="btn btn-primary btn-sm addToCartBtn" data-id="${product.id}" style="flex: 1;">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');

    // Re-attach listeners for buttons
    document.querySelectorAll('.addToCartBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            trackProductClick(id);
            addToCart(id);
        });
    });

    document.querySelectorAll('.voirProdBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            window.location.href = `product-details.html?id=${id}`;
        });
    });
}

function setupEventListeners() {
    // Categories
    document.getElementById('category-filters').addEventListener('change', (e) => {
        if (e.target.name === 'category') {
            state.filters.category = e.target.value;
            renderProducts();
        }
    });

    // Price
    const priceRange = document.getElementById('price-range');
    const priceDisplay = document.getElementById('price-display');

    priceRange.addEventListener('input', (e) => {
        state.filters.maxPrice = parseInt(e.target.value);
        priceDisplay.textContent = Utils.formatCurrency(state.filters.maxPrice);
        renderProducts();
    });

    // Search
    const searchInput = document.getElementById('catalogue-search');
    const searchBtn = document.getElementById('search-btn');

    const doSearch = () => {
        state.filters.search = searchInput.value.trim();
        renderProducts();
    };

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') doSearch();
        // Optional: live search
        // state.filters.search = e.target.value;
        // renderProducts();
    });

    // Reset
    document.getElementById('reset-filters').addEventListener('click', () => {
        state.filters = { category: 'all', maxPrice: 200000, search: '' };

        // Reset inputs
        document.querySelector('input[name="category"][value="all"]').checked = true;
        priceRange.value = 200000;
        priceDisplay.textContent = Utils.formatCurrency(200000);
        searchInput.value = '';

        renderProducts();
    });
}

function addToCart(productId) {
    Store.addToCart(productId, 1);
    App.showToast('Produit ajouté au panier !');
}

// Enregistre un clic produit pour le tracker PMF
async function trackProductClick(productId) {
    try {
        const session = Store.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        await fetch(Utils.API_BASE_URL + '/api/track/click', {
            method: 'POST',
            headers,
            body: JSON.stringify({ product_id: productId })
        });
    } catch (e) {
        // Silently ignore tracking errors
    }
}
