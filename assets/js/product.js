/**
 * Logic for Product Details Page
 */

const initProductPage = async () => {
    const productId = Utils.getUrlParam('id');
    console.log('[ProductPage] Initializing with ID:', productId);

    if (!productId) {
        console.error('[ProductPage] CRITICAL: No product ID found in URL.');
        document.getElementById('product-content').innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                <i class="fas fa-exclamation-triangle fa-2x" style="color: var(--accent-color); margin-bottom: 1rem;"></i>
                <h2>Erreur de lien</h2>
                <p>Aucun identifiant de produit n'a été trouvé dans l'URL.</p>
                <a href="catalogue.html" class="btn btn-primary mt-1">Retour au Catalogue</a>
            </div>
        `;
        return;
    }

    let product = Store.getProductById(productId);
    
    // Si le produit n'est pas dans le store local, forcer la récupération
    if (!product) {
        await Store.fetchProducts();
        product = Store.getProductById(productId);
    }

    if (!product) {
        document.getElementById('product-content').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem;">Produit introuvable</div>';
        return;
    }

    renderProduct(product);

    // Track PMF Click
    try {
        const session = Store.getSession();
        const token = session ? session.access_token : null;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(Utils.API_BASE_URL + '/api/track/click', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ product_id: productId })
        });
    } catch(e) {
        console.error('Feature Tracking failed', e);
    }
};

// Robust listener: runs if appReady is already fired or when it fires
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // If we're already late, check if app is ready
    // We assume App.init marks a global variable or we just wait for the next tick
    setTimeout(initProductPage, 100); 
} else {
    document.addEventListener('appReady', initProductPage);
}

function renderProduct(product) {
    // Update breadcrumb
    document.getElementById('breadcrumb-current').textContent = product.name;

    const container = document.getElementById('product-content');
    
    // Use only real image from DB
    const mainImage = product.image || 'assets/img/placeholder.jpg';

    container.innerHTML = `
        <div class="product-main-left">
            <!-- Dynamic Gallery -->
            <div class="gallery-grid" style="display: block;">
                <img src="${mainImage}" class="gallery-item gallery-main" style="width: 100%; border-radius: var(--radius-lg);" alt="${product.name}">
            </div>

            <!-- Title & Basic Info -->
            <div class="product-info-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; margin-top: 2rem;">
                <div>
                    <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em;">${product.name}</h1>
                    <p style="color: var(--text-gray); font-size: 1rem;"><i class="fas fa-map-marker-alt"></i> Bénin</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="product-tabs">
                <button class="tab-btn active">Description</button>
            </div>

            <div class="product-description" style="margin-bottom: 3rem;">
                <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-gray);">${product.description || 'Aucune description disponible.'}</p>
            </div>

            <!-- Host/Vendor Card -->
            <div class="host-card">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(product.vendorName || 'Loueur')}&background=065F46&color=fff" class="host-avatar" alt="Host">
                <div class="host-meta">
                    <h1 style="font-size: 1.25rem; margin:0">Géré par ${product.vendorName || 'Elite Events'}</h1>
                    <div class="host-stats">Membre depuis 2023 • 142 locations réussies • <i class="fas fa-star" style="color:var(--secondary-color)"></i> 4.9 (84 avis)</div>
                </div>
                <a href="profile-loueur.html?id=${product.vendorId || ''}" class="btn btn-outline btn-sm">Contacter</a>
            </div>
        </div>

        <!-- Sticky Booking Card -->
        <div class="product-sidebar">
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-price">${Utils.formatCurrency(product.price)}<span> / jour</span></div>
                    <div class="booking-rating"><i class="fas fa-star"></i> 4.9</div>
                </div>

                <div class="booking-dates">
                    <div class="date-input">
                        <span class="date-label">Date de l'événement</span>
                        <div style="font-weight:600; font-size: 0.9rem;">À définir au panier</div>
                    </div>
                </div>

                <div class="booking-options" style="justify-content: space-between;">
                    <div>
                        <span class="date-label">Quantité</span>
                        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 5px;">
                            <button class="btn btn-secondary btn-sm" style="width:30px;height:30px;padding:0;border-radius:50%" onclick="updateQty(-1)">-</button>
                            <span id="booking-qty-display" style="font-weight:700; font-size: 1rem;">1</span>
                            <button class="btn btn-secondary btn-sm" style="width:30px;height:30px;padding:0;border-radius:50%" onclick="updateQty(1)">+</button>
                        </div>
                        <input type="hidden" id="qty-input" value="1">
                    </div>
                </div>

                <button class="btn btn-primary btn-block btn-lg glow-on-hover" onclick="addToCart('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? 'Réserver maintenant' : 'En rupture'}
                </button>
                
                <p style="text-align:center; font-size: 0.8rem; color: var(--text-gray); margin-top: 0.75rem;">Vous ne serez pas encore débité</p>

                <div class="booking-summary">
                    <div class="summary-row">
                        <span>Prix de base</span>
                        <span id="base-price-display">${Utils.formatCurrency(product.price)}</span>
                    </div>
                    <div class="summary-total">
                        <div class="summary-row">
                            <span style="color: var(--text-dark)">Sous-total</span>
                            <span id="total-price" style="color: var(--text-dark); font-weight: 700;">${Utils.formatCurrency(product.price)}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; font-size: 0.85rem; color: var(--text-gray);">
                    <i class="fas fa-shield-alt" style="color: #10B981; margin-top: 3px;"></i>
                    <p>Garantie EventBenin incluse.</p>
                </div>
            </div>
        </div>
    `;

    // Initialize total price calculation var
    window.currentBasePrice = product.price;

    renderReviews(product);
}

function renderReviews(product) {
    const container = document.getElementById('product-reviews');
    if (!product.reviews || product.reviews.length === 0) {
        container.innerHTML = '<p style="color: var(--text-gray); font-style: italic;">Aucun avis pour ce produit pour le moment.</p>';
        return;
    }

    container.innerHTML = product.reviews.map(review => `
        <div style="background: white; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-weight: 700;">${review.user}</span>
                <div style="color: #FCD116;">
                    ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                    ${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
                </div>
            </div>
            <p style="color: var(--text-gray);">${review.comment}</p>
        </div>
    `).join('');
}

// Global scope for onclick handlers (simpler than event delegation for this specific layout)
window.updateQty = (change) => {
    const input = document.getElementById('qty-input');
    let val = parseInt(input.value) + change;
    if (val < 1) val = 1;
    // Check stock limit logic could be here
    
    input.value = val;
    document.getElementById('booking-qty-display').textContent = val;
    
    // Update total
    const total = val * window.currentBasePrice;
    document.getElementById('total-price').textContent = Utils.formatCurrency(total);
};

window.addToCart = (id) => {
    const qty = parseInt(document.getElementById('qty-input').value);
    Store.addToCart(id, qty);
    App.showToast(`${qty} produit(s) ajouté(s) au panier !`);
};
