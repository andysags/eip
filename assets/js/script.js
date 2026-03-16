/*
 * EventBenin Location - Main Script
 */

document.addEventListener('appReady', async () => {
    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Animation on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.step-card, .value-list li');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // --- PRODUCTS LOADING ---
    await loadFeaturedProducts();
});

async function loadFeaturedProducts() {
    const loader = document.getElementById('featured-products-loader');
    const container = document.querySelector('.product-grid');

    if (!container) return;

    try {
        // Fetch from Store (which fetches from API)
        let products = Store.getAllProducts();

        // If empty, try to fetch (wait for it)
        if (products.length === 0) {
            products = await Store.fetchProducts();
        }

        // Filter for popular or just take first 4
        const featured = products.filter(p => p.isPopular || p.is_popular).slice(0, 4);
        // Fallback if no popular flag
        const displayProducts = featured.length > 0 ? featured : products.slice(0, 4);

        if (displayProducts.length === 0) {
            if (loader) loader.innerHTML = 'Aucun produit disponible pour le moment.';
            return;
        }

        if (loader) loader.style.display = 'none';

        // Convert to HTML
        const html = displayProducts.map(product => `
            <div class="product-card">
                <div class="product-image" style="background-image: url('${product.image || 'assets/img/placeholder.jpg'}');">
                    ${(product.isPopular || product.is_popular) ? '<span class="product-badge">Populaire</span>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title"><a href="product-details.html?id=${product.id}">${product.name}</a></h3>
                    <div class="product-price">${Utils.formatCurrency(product.price)} <span>/ jour</span></div>
                    <button class="btn btn-outline add-to-cart" 
                        data-id="${product.id}" 
                        style="width: 100%; margin-top: 1rem;">
                        Ajouter
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;

        // Attach listeners
        container.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                Store.addToCart(id, 1);
            });
        });
    } catch (e) {
        console.error("Error displaying products:", e);
        if (loader) loader.innerHTML = `<span style="color:red">Erreur: ${e.message}</span>`;
    }
}
