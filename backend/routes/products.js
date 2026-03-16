const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
    const authMiddleware = require('../middleware/authMiddleware')(supabase);

    // GET /api/products - List all products
    router.get('/', async (req, res) => {
        try {
            // Fetch all products, ordered by creation date
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching products:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error('Server error fetching products:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/products/:id - Get single product
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                // Supabase returns 'PGRST116' for no rows found (not exactly 404 but close enough for us)
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Product not found' });
                }
                console.error('Error fetching product:', error);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json(data);
        } catch (err) {
            console.error('Server error fetching product:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST /api/products - Create new product (Protected)
    router.post('/', authMiddleware, async (req, res) => {
        // req.user is populated by authMiddleware
        const { name, category, price, stock, image, description } = req.body;
        const vendor_id = req.user.id;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required.' });
        }

        try {
            const newProduct = {
                name,
                category,
                price,
                stock: stock || 0,
                image,
                description,
                vendor_id
            };

            const { data, error } = await supabase
                .from('products')
                .insert([newProduct])
                .select();

            if (error) {
                console.error('Error creating product:', error);
                return res.status(400).json({ error: error.message });
            }

            res.status(201).json(data[0]);

        } catch (err) {
            console.error('Server error creating product:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PUT /api/products/:id - Update product (Protected)
    router.put('/:id', authMiddleware, async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        const vendor_id = req.user.id; // From token

        // Sanitize updates: prevent changing ID or Vendor_ID
        delete updates.id;
        delete updates.vendor_id;
        delete updates.created_at;

        try {
            // Check if user owns the product (RLS handles this for database, but good to have explicit 404/403 check logic if RLS fails silently or returns 0 rows)
            // With RLS, the update simply won't match any row if vendor_id is different. 
            // We can just try to update.

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                // .eq('vendor_id', vendor_id) // Redundant if RLS is on, but safe
                .select();

            if (error) {
                console.error('Error updating product:', error);
                return res.status(400).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Product not found or permission denied' });
            }

            res.status(200).json(data[0]);

        } catch (err) {
            console.error('Server error updating product:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // DELETE /api/products/:id - Delete product (Protected)
    router.delete('/:id', authMiddleware, async (req, res) => {
        const { id } = req.params;

        try {
            const { data, error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error deleting product:', error);
                return res.status(500).json({ error: error.message });
            }

            if (data.length === 0) {
                return res.status(404).json({ error: 'Product not found or permission denied' });
            }

            res.status(200).json({ message: 'Product deleted successfully', deleted: data[0] });

        } catch (err) {
            console.error('Server error deleting product:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
