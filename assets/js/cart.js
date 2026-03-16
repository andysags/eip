/**
 * Logic for Cart Page
 */

document.addEventListener('appReady', () => {
    renderCart();

    // Re-render when cart changes (e.g. from another tab, though less likely here)
    Store.subscribe('cartUpdated', renderCart);

    document.getElementById('checkout-btn').addEventListener('click', () => {
        const user = Store.getUser();
        if (user) {
            window.location.href = 'checkout.html';
        } else {
            window.location.href = 'connexion.html?redirect=checkout';
        }
    });
});

function renderCart() {
    const items = Store.getCart();
    const products = Store.getAllProducts();
    const tbody = document.getElementById('cart-items');
    const container = document.getElementById('cart-content');
    const emptyMsg = document.getElementById('empty-cart-msg');

    if (items.length === 0) {
        container.style.display = 'none';
        emptyMsg.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    emptyMsg.style.display = 'none';

    let subtotal = 0;

    tbody.innerHTML = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return ''; // Should not happen

        const total = product.price * item.quantity;
        subtotal += total;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 60px; height: 60px; background-image: url('${product.image}'); background-size: cover; background-position: center; border-radius: var(--radius-sm);"></div>
                        <div>
                            <div style="font-weight: 600;">${product.name}</div>
                            <div style="font-size: 0.85rem; color: var(--text-gray);">${Utils.formatCurrency(product.price)} / jour</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                         <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.6rem;" onclick="updateCartItem('${item.productId}', -1)">-</button>
                         <span style="font-weight: 600; min-width: 20px; text-align: center;">${item.quantity}</span>
                         <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.6rem;" onclick="updateCartItem('${item.productId}', 1)">+</button>
                    </div>
                </td>
                <td style="font-weight: 700;">${Utils.formatCurrency(total)}</td>
                <td>
                    <button class="btn btn-outline" style="color: var(--accent-color); border-color: transparent; padding: 0.5rem;" onclick="removeCartItem('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('cart-subtotal').textContent = Utils.formatCurrency(subtotal);
    document.getElementById('cart-total-final').textContent = Utils.formatCurrency(subtotal);
}

window.updateCartItem = (id, change) => {
    const cart = Store.getCart();
    const item = cart.find(i => i.productId === id);
    if (item) {
        Store.updateCartQuantity(id, item.quantity + change);
    }
};

window.removeCartItem = (id) => {
    if (confirm('Voulez-vous retirer cet article du panier ?')) {
        Store.removeFromCart(id);
    }
};
