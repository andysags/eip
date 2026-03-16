const express = require('express');
const router = express.Router();

module.exports = (supabase) => {

    // POST /api/track/click — Enregistrer un clic sur un produit
    router.post('/click', async (req, res) => {
        try {
            const { product_id } = req.body;
            if (!product_id) return res.status(400).json({ error: 'product_id is required' });

            let user_id = null;
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: {} }));
                    user_id = user?.id || null;
                }
            }

            const { error } = await supabase.from('product_clicks').insert({ product_id, user_id });

            if (error) {
                console.warn('product_clicks insert error:', error.message);
                return res.status(200).json({ ok: true, warn: 'Table may not exist yet.' });
            }

            res.status(200).json({ ok: true });
        } catch (err) {
            console.error('Error tracking click:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/track/pmf-cohorts — Calcul des cohortes PMF (admin only)
    router.get('/pmf-cohorts', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
            const token = authHeader.split(' ')[1];
            const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
            if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });
            if (user.user_metadata?.user_type !== 'admin') return res.status(403).json({ error: 'Forbidden' });

            // Delegate logic to Supabase RPC to avoid Memory Crash from fetching all rows into Node.js
            const { data, error } = await supabase.rpc('get_pmf_cohorts_v1');

            if (error) {
                console.warn('RPC missing or failed:', error.message);
                return res.status(200).json({ cohorts: [], missingTable: true, rpcMissing: true });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error('Error computing PMF cohorts:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
