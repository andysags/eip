const express = require('express');
const router = express.Router();

// Helper: vérifie l'admin et renvoie le user ou une erreur
async function requireAdmin(req, res, supabase) {
    const authHeader = req.headers.authorization;
    if (!authHeader) { res.status(401).json({ error: 'Missing authorization header' }); return null; }
    const token = authHeader.split(' ')[1];
    if (!token) { res.status(401).json({ error: 'Missing token' }); return null; }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) { res.status(401).json({ error: 'Invalid or expired token' }); return null; }
    const role = user.user_metadata?.user_type;
    if (role !== 'admin') { res.status(403).json({ error: 'Forbidden: admin access required' }); return null; }
    return user;
}

module.exports = (supabase) => {

    // Route Clarity Data
    router.get('/clarity-insights', async (req, res) => {
        try {
            const user = await requireAdmin(req, res, supabase);
            if (!user) return;

            const clarityToken = process.env.JETON_CLARITY;
            if (!clarityToken) return res.status(500).json({ error: 'Clarity token not configured' });

            const url = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
            const clarityRes = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${clarityToken}`, 'Content-Type': 'application/json' }
            });

            if (!clarityRes.ok) {
                const errText = await clarityRes.text();
                console.error("Clarity API fetch failed:", clarityRes.status, errText);
                return res.status(clarityRes.status).json({ error: 'Failed to fetch insights from Clarity API', detail: errText });
            }

            const clarityData = await clarityRes.json();
            res.status(200).json(clarityData);

        } catch (err) {
            console.error('Error in /admin/clarity-insights:', err);
            res.status(500).json({ error: 'Internal server error while fetching Clarity insights' });
        }
    });

    // Route: Statistiques générales admin (nombre Users, Produits, Commandes)
    router.get('/stats', async (req, res) => {
        try {
            const user = await requireAdmin(req, res, supabase);
            if (!user) return;

            const [usersRes, productsRes, ordersRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }),
            ]);

            res.status(200).json({
                users: usersRes.count || 0,
                products: productsRes.count || 0,
                orders: ordersRes.count || 0,
            });
        } catch (err) {
            console.error('Error in /admin/stats:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Route: Liste complète des utilisateurs (profils)
    router.get('/users', async (req, res) => {
        try {
            const user = await requireAdmin(req, res, supabase);
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                return res.status(500).json({ error: 'Failed to fetch users' });
            }

            res.status(200).json(data || []);
        } catch (err) {
            console.error('Error in /admin/users:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
