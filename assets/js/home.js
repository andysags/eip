/**
 * Logic for Home Page
 */

document.addEventListener('appReady', () => {
    // 1. Check Role and Adjust UI
    const user = Store.getUser();
    if (user && user.role === 'vendor') {
        // Show Vendor Hero
        document.getElementById('hero-client').style.display = 'none';
        document.getElementById('hero-vendor').style.display = 'block'; // Was flex? hero-content is flow usually.
        
        // Hide "Popular Products", "How it Works" for Vendors ? 
        // User said "landing page doit être différent".
        // Let's hide the Catalogue Preview for Vendors as they don't buy?
        // Or keep it to show what's on the platform?
        // User said "vendeur ne peut pas avoir accès au catalogue".
        document.getElementById('catalogue').style.display = 'none'; 
        document.getElementById('comment-ca-marche').style.display = 'none';
        document.getElementById('loueurs').style.display = 'none'; // Don't ask vendor to become vendor
        
    } else {
        // Client or Guest
        // 2. Fetch & Render Popular Products if Client/Guest
        renderFeaturedProducts();
        
        // 3. Setup Search Handler
        setupHeroSearch();

        // Hide "Become Vendor" if already Vendor? No, logic above handles vendor.
        // What if Client? Should he see "Become Vendor"? Yes/No? Usually yes.
    }
});

function renderFeaturedProducts() {
    const products = Store.getAllProducts();
    const popularProducts = products.filter(p => p.isPopular).slice(0, 4); // Limit to 4

    const container = document.getElementById('featured-products');
    container.innerHTML = popularProducts.map(product => `
        <div class="product-card">
            <div class="product-image" style="background-image: url('${product.image}');">
                <span class="product-badge">Populaire</span>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title"><a href="product-details.html?id=${product.id}">${product.name}</a></h3>
                <div class="product-price">${Utils.formatCurrency(product.price)} <span>/ jour</span></div>
                <button class="btn btn-outline btn-sm" onclick="addToCart('${product.id}')" style="width: 100%; margin-top: auto;">
                    <i class="fas fa-cart-plus"></i> Ajouter
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    Store.addToCart(productId, 1);
    App.showToast('Produit ajouté au panier !');
}

function setupHeroSearch() {
    const btn = document.getElementById('hero-search-btn');
    const input = document.getElementById('hero-search');

    const doSearch = () => {
        const query = input.value.trim();
        if (query) {
            window.location.href = `catalogue.html?search=${encodeURIComponent(query)}`;
        } else {
            window.location.href = 'catalogue.html';
        }
    };

    btn.addEventListener('click', doSearch);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSearch();
    });
}
