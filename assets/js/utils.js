/**
 * Fonctions utilitaires
 */

const Utils = {
    // URL de base de l'API : utilise localhost en dev, et le domaine courant si déployé
    API_BASE_URL: window.location.hostname === 'localhost' ? 'http://localhost:4000' : window.location.origin,

    // Formater un prix en FCFA
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR', // Astuce: On utilise 'EUR' pour le formatage européen, puis on remplace le symbole
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('€', 'FCFA');
    },

    // Générer un ID unique
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Formater une date (YYYY-MM-DD -> DD Month YYYY)
    formatDate: (dateString) => {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    },

    // Récupérer un paramètre d'URL
    getUrlParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    // Afficher une notification Toast
    showToast: (message, type = 'success') => {
        const container = document.querySelector('.toast-container') || (() => {
            const div = document.createElement('div');
            div.className = 'toast-container';
            document.body.appendChild(div);
            return div;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const color = type === 'success' ? 'var(--primary-color)' : 'var(--accent-color)';
        
        toast.innerHTML = `
            <i class="fas ${icon}" style="font-size: 1.5rem; color: ${color}"></i>
            <div class="toast-content">
                <h4 style="font-weight: 700;">${type === 'success' ? 'Succès' : 'Attention'}</h4>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
