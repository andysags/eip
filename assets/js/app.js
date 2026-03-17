/**
 * Application Core Logic
 * Gère le chargement dynamique du header/footer et l'initialisation des pages
 */

const App = {
    init: async () => {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        const isAuthPage = ['connexion.html', 'inscription.html'].includes(page);

        // 1. Charger le Header et le Footer (sauf sur les pages d'auth)
        if (!isAuthPage) {
            await App.loadHeader();
            await App.loadFooter();
        }

        // 2. Mettre à jour l'état (Panier, User)
        App.updateUIState();

        // 3. Setup des listeners globaux
        App.setupGlobalListeners();

        // 4. Access Control (Security)
        App.checkAccessControl();

        // 5. Dispatch event 'appReady' pour les scripts spécifiques aux pages
        document.dispatchEvent(new Event('appReady'));
    },

    checkAccessControl: () => {
        const user = Store.getUser();
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        console.log(`[AccessControl] Page: ${page}, User: ${user ? user.email : 'None'}`);

        // Pages nécessitant une connexion
        const protectedPages = ['dashboard-client.html', 'dashboard-loueur.html', 'dashboard-admin.html', 'panier.html', 'checkout.html', 'profile-loueur.html'];

        if (!user && protectedPages.includes(page)) {
            console.error("[AccessControl] Accès refusé : utilisateur non connecté. Redirection...");
            window.location.href = 'connexion.html';
            return;
        }

        if (user) {
            const metadata = user.user_metadata || {};
            console.log(`[AccessControl] Role détecté: ${metadata.user_type}`);
        }
    },

    loadHeader: async () => {
        const header = document.querySelector('nav.navbar') || document.createElement('nav');
        if (!document.querySelector('nav.navbar')) {
            header.className = 'navbar';
            document.body.prepend(header);
        }

        const user = Store.getUser();
        const isLoggedIn = !!user;
        const metadata = user?.user_metadata || {};
        const role = metadata.user_type;
        const name = metadata.name || user?.email || 'Utilisateur';
        const isVendor = role === 'loueur';
        const isAdmin = role === 'admin';

        header.innerHTML = `
            <div class="container">
                <a href="index.html" class="logo">
                    <i class="fas fa-layer-group"></i> EventBenin<span style="color:var(--secondary-color)">.</span>
                </a>
                
                <div class="mobile-toggle">
                    <i class="fas fa-bars"></i>
                </div>

                <div class="nav-collapse">
                    <ul class="nav-menu">
                        <li><a href="index.html" class="nav-link ${App.isActive('index.html')}">Accueil</a></li>
                        <li><a href="catalogue.html" class="nav-link ${App.isActive('catalogue.html')}">Catalogue</a></li>
                        <li><a href="index.html#comment-ca-marche" class="nav-link">Comment ça marche</a></li>
                        <li><a href="dashboard-loueur.html" class="nav-link ${App.isActive('dashboard-loueur.html')}">Espace Loueurs</a></li>
                    
                    <div class="nav-actions">
                        ${(!isVendor && !isAdmin) ? `
                        <a href="panier.html" class="icon-btn" title="Mon Panier">
                            <i class="fas fa-shopping-cart"></i>
                            <span class="badge" id="cart-count">0</span>
                        </a>` : ''}

                        ${isLoggedIn ? `
                            <div class="user-dropdown">
                                <div class="user-avatar">${name.charAt(0).toUpperCase()}</div>
                                <div class="dropdown-menu">
                                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
                                        <strong>${name}</strong><br>
                                        <small style="color:var(--text-gray)">${user.email}</small>
                                    </div>
                                    <a href="${isAdmin ? 'dashboard-admin.html' : isVendor ? 'dashboard-loueur.html' : 'dashboard-client.html'}" class="dropdown-item"><i class="fas fa-th-large"></i> ${isAdmin ? 'Admin Dashboard' : 'Mon Dashboard'}</a>
                                    <a href="#" onclick="App.logout()" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> Déconnexion</a>
                                </div>
                            </div>
                        ` : `
                            <a href="connexion.html" class="btn btn-primary btn-sm">Compte</a>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    loadFooter: async () => {
        const footer = document.querySelector('footer.footer') || document.createElement('footer');
        if (!document.querySelector('footer.footer')) {
            footer.className = 'footer';
            document.body.append(footer);

            footer.innerHTML = `
                <div class="container">
                    <div class="footer-grid">
                        <div class="footer-brand">
                            <h3>EventBenin.</h3>
                            <p>La plateforme de référence pour la location de matériel événementiel au Bénin.</p>
                        </div>
                        <div class="footer-links">
                            <h4>Plateforme</h4>
                            <ul>
                                <li><a href="catalogue.html">Catalogue</a></li>
                                <li><a href="dashboard-loueur.html">Espace Loueur</a></li>
                            </ul>
                        </div>
                        <div class="footer-links">
                            <h4>Contact</h4>
                            <ul>
                                <li><i class="fas fa-envelope"></i> contact@eventbenin.bj</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    updateUIState: () => {
        const count = Store.getCartCount();
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    setupGlobalListeners: () => {
        Store.subscribe('cartUpdated', App.updateUIState);
        const toggle = document.querySelector('.mobile-toggle');
        const menu = document.querySelector('.nav-collapse');
        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
            });
        }
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.user-dropdown');
            const menu = document.querySelector('.dropdown-menu');
            if (dropdown && menu) {
                if (dropdown.contains(e.target)) menu.classList.toggle('show');
                else menu.classList.remove('show');
            }
        });
    },

    isActive: (page) => window.location.pathname.includes(page) ? 'active' : '',

    logout: async () => {
        await Store.logout();
    },

    showToast: (message, type = 'success') => {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(message, type);
        } else {
            console.log(`Toast (${type}): ${message}`);
            // Fallback ultra-basique si Utils n'est pas chargé
            const toast = document.createElement('div');
            toast.style = "position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:1rem;border-radius:8px;z-index:9999;";
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
};

document.addEventListener('DOMContentLoaded', App.init);
