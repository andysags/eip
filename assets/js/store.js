/**
 * Gestionnaire d'état (State Manager)
 * Centralise toutes les interactions avec le LocalStorage
 */

const Store = {
    // Clés de stockage
    KEYS: {
        PRODUCTS: 'eventbenin_products',
        CART: 'eventbenin_cart',
        USER: 'eventbenin_user',
        SESSION: 'eventbenin_session', // New key for session
        ORDERS: 'eventbenin_orders'
    },

    // Initialisation
    init: async () => {
        // Charger les produits depuis l'API
        await Store.fetchProducts();

        // Initialiser panier vide si inexistant
        if (!localStorage.getItem(Store.KEYS.CART)) {
            localStorage.setItem(Store.KEYS.CART, JSON.stringify([]));
        }

        // Initialiser commandes vides si inexistant
        if (!localStorage.getItem(Store.KEYS.ORDERS)) {
            localStorage.setItem(Store.KEYS.ORDERS, JSON.stringify([]));
        }
    },

    // --- PRODUITS ---
    // Fetch products from API (Async)
    fetchProducts: async () => {
        try {
            const response = await fetch(Utils.API_BASE_URL + '/api/products');
            if (response.ok) {
                const products = await response.json();
                localStorage.setItem(Store.KEYS.PRODUCTS, JSON.stringify(products));
                // If local storage is empty or we want to ensure fresh data, we rely on this.
                // However, for parts of the app that need synchronous access (like rendering cart immediately on load),
                // we still keep a copy in localStorage.
                return products;
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
        return JSON.parse(localStorage.getItem(Store.KEYS.PRODUCTS) || '[]');
    },

    getAllProducts: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.PRODUCTS) || '[]');
    },

    getProductById: (id) => {
        const products = JSON.parse(localStorage.getItem(Store.KEYS.PRODUCTS) || '[]');
        return products.find(p => p.id === id);
    },

    addProduct: async (product) => {
        // Optimistic update
        const products = Store.getAllProducts();
        // Ensure we have a temp ID if needed, but backend gives real ID

        try {
            const session = Store.getSession();
            const token = session ? session.access_token : null;

            if (!token) {
                alert("Vous devez être connecté pour ajouter un produit.");
                return null;
            }

            const response = await fetch(Utils.API_BASE_URL + '/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                const newProduct = await response.json();
                products.unshift(newProduct); // Add to local list
                localStorage.setItem(Store.KEYS.PRODUCTS, JSON.stringify(products));
                return newProduct;
            } else {
                const err = await response.json();
                alert(`Erreur: ${err.error}`);
                return null;
            }
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },

    deleteProduct: async (id) => {
        try {
            const session = Store.getSession();
            const token = session ? session.access_token : null;

            if (!token) {
                alert("Vous devez être connecté pour supprimer un produit.");
                return false;
            }

            if (!confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) {
                return false;
            }

            const response = await fetch(`${Utils.API_BASE_URL}/api/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update local storage
                let products = Store.getAllProducts();
                products = products.filter(p => p.id !== id);
                localStorage.setItem(Store.KEYS.PRODUCTS, JSON.stringify(products));
                if (window.Utils && Utils.showToast) Utils.showToast("Produit supprimé avec succès.");
                return true;
            } else {
                const err = await response.json();
                alert(`Erreur: ${err.error}`);
                return false;
            }
        } catch (error) {
            console.error('API Error:', error);
            return false;
        }
    },

    // Check availability for a specific date range (basic implementation: per single date)
    checkStock: (productId, date, quantity) => {
        const product = Store.getProductById(productId);
        if (!product) return false;

        const allOrders = JSON.parse(localStorage.getItem(Store.KEYS.ORDERS) || '[]');

        // Filter orders that are CONFIRMED and cover this date
        // Note: Our simple model just has one "eventDate". 
        // In a real app, we'd need start/end dates.
        const activeOrders = allOrders.filter(o =>
            (o.status === 'Confirmé' || o.status === 'En attente') &&
            o.eventDate === date
        );

        let reservedQuantity = 0;
        activeOrders.forEach(order => {
            const item = order.items.find(i => i.productId === productId);
            if (item) reservedQuantity += item.quantity;
        });

        return (product.stock - reservedQuantity) >= quantity;
    },

    getAvailableStock: (productId, date) => {
        const product = Store.getProductById(productId);
        if (!product) return 0;

        const allOrders = JSON.parse(localStorage.getItem(Store.KEYS.ORDERS) || '[]');
        const activeOrders = allOrders.filter(o =>
            (o.status === 'Confirmé' || o.status === 'En attente') &&
            o.eventDate === date
        );

        let reservedQuantity = 0;
        activeOrders.forEach(order => {
            const item = order.items.find(i => i.productId === productId);
            if (item) reservedQuantity += item.quantity;
        });

        return Math.max(0, product.stock - reservedQuantity);
    },

    // --- PANIER ---
    getCart: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.CART) || '[]');
    },

    addToCart: (productId, quantity = 1) => {
        const cart = Store.getCart();
        const existingItem = cart.find(item => item.productId === productId);

        // Simple global stock check (not date specific yet because date is chosen at checkout)
        // For the cart, we just check against total stock.
        const product = Store.getProductById(productId);
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;

        if ((currentQtyInCart + parseInt(quantity)) > product.stock) {
            if (window.Utils && Utils.showToast) {
                Utils.showToast(`Stock insuffisant. Max disponible: ${product.stock}`, 'error');
            } else {
                alert(`Stock insuffisant. Max disponible: ${product.stock}`);
            }
            return false;
        }

        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            cart.push({ productId, quantity: parseInt(quantity) });
        }

        localStorage.setItem(Store.KEYS.CART, JSON.stringify(cart));
        Store.notifyObservers('cartUpdated');
        if (window.Utils && Utils.showToast) Utils.showToast("Article ajouté au panier !");
        return true;
    },

    removeFromCart: (productId) => {
        let cart = Store.getCart();
        cart = cart.filter(item => item.productId !== productId);
        localStorage.setItem(Store.KEYS.CART, JSON.stringify(cart));
        Store.notifyObservers('cartUpdated');
    },

    updateCartQuantity: (productId, quantity) => {
        let cart = Store.getCart();
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                return Store.removeFromCart(productId);
            }
            localStorage.setItem(Store.KEYS.CART, JSON.stringify(cart));
            Store.notifyObservers('cartUpdated');
        }
    },

    clearCart: () => {
        localStorage.setItem(Store.KEYS.CART, JSON.stringify([]));
        Store.notifyObservers('cartUpdated');
    },

    getCartTotal: () => {
        const cart = Store.getCart();
        const products = Store.getAllProducts();
        return cart.reduce((total, item) => {
            const product = products.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    },

    getCartCount: () => {
        const cart = Store.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    },

    // --- UTILISATEUR & AUTH ---
    getUser: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.USER));
    },

    setUser: (user) => {
        localStorage.setItem(Store.KEYS.USER, JSON.stringify(user));
        Store.notifyObservers('userUpdated');
    },

    getSession: () => {
        return JSON.parse(localStorage.getItem(Store.KEYS.SESSION));
    },

    setSession: (session) => {
        localStorage.setItem(Store.KEYS.SESSION, JSON.stringify(session));
        Store.notifyObservers('sessionUpdated');
    },

    // Removed old login simulation
    // login: (email, password) => { ... }

    logout: async () => { // Made async for API call
        // Call backend logout endpoint
        try {
            const response = await fetch(Utils.API_BASE_URL + '/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include Authorization header if session token is needed for logout
                    // 'Authorization': `Bearer ${Store.getSession()?.access_token}`
                },
            });

            if (!response.ok) {
                console.error('Backend logout failed:', await response.json());
                // Even if backend logout fails, clear local storage for UX
            }
        } catch (error) {
            console.error('Network error during logout:', error);
        } finally {
            localStorage.removeItem(Store.KEYS.USER);
            localStorage.removeItem(Store.KEYS.SESSION);
            Store.notifyObservers('userUpdated'); // Notify UI of logout
            window.location.href = 'index.html'; // Redirect after clearing local data
        }
    },

    // --- COMMANDES ---
    createOrder: async (orderDetails) => {
        // orderDetails contains: { totalAmount, eventDate, paymentMethod, ... }
        // We need to construct the payload expected by the backend

        const cart = Store.getCart();
        const products = Store.getAllProducts();

        // Enrich cart items with vendorId and price from current products state
        // (In a real app, backend should look up price to prevent tampering, but we send what we have for now)
        const itemsPayload = cart.map(cartItem => {
            const product = products.find(p => p.id === cartItem.productId);
            // Fallback if product not found (shouldn't happen)
            if (!product) return null;
            return {
                id: product.id,
                quantity: cartItem.quantity,
                price: product.price,
                vendorId: product.vendor_id // Database column is vendor_id, backend API expects vendorId in item payload processing or we map it?
                // Looking at backend/routes/orders.js: `vendor_id: item.vendorId`
                // So we must pass vendorId.
            };
        }).filter(i => i !== null);


        const payload = {
            items: itemsPayload,
            totalAmount: orderDetails.totalAmount || Store.getCartTotal(),
            eventDate: orderDetails.date,
            paymentMethod: orderDetails.paymentMethod,
            paymentType: orderDetails.paymentType
        };

        const session = Store.getSession();
        const token = session ? session.access_token : null;

        if (!token) return null;

        try {
            const response = await fetch(Utils.API_BASE_URL + '/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                Store.clearCart();
                // Optionally update local cache if we kept one
                return data.order;
            } else {
                const err = await response.json();
                console.error("Order creation failed", err);
                alert("Erreur lors de la commande: " + err.error);
                return null;
            }
        } catch (error) {
            console.error('API Order Error:', error);
            return null;
        }
    },

    getUserOrders: async () => {
        const session = Store.getSession();
        const token = session ? session.access_token : null;
        if (!token) return [];

        try {
            const response = await fetch(Utils.API_BASE_URL + '/api/orders/my-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching user orders:', error);
        }
        return [];
    },

    getVendorOrders: async () => {
        const session = Store.getSession();
        const token = session ? session.access_token : null;
        if (!token) return [];

        try {
            const response = await fetch(Utils.API_BASE_URL + '/api/orders/vendor-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error fetching vendor orders:', error);
        }
        return [];
    },

    updateOrderStatus: async (orderId, newStatus) => {
        const session = Store.getSession();
        const token = session ? session.access_token : null;

        try {
            const response = await fetch(`${Utils.API_BASE_URL}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            return response.ok;
        } catch (error) {
            console.error("Status update failed", error);
            return false;
        }
    },

    // --- PATTERN OBSERVER POUR UI UPDATES ---
    observers: {},

    subscribe: (event, callback) => {
        if (!Store.observers[event]) Store.observers[event] = [];
        Store.observers[event].push(callback);
    },

    notifyObservers: (event) => {
        if (Store.observers[event]) {
            Store.observers[event].forEach(cb => cb());
        }
    }
};

// Initialiser au chargement
Store.init();
