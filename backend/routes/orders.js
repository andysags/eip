const express = require('express');
const router = express.Router();

module.exports = (supabase) => {
    const authMiddleware = require('../middleware/authMiddleware')(supabase);

    // POST /api/orders - Create a new order
    router.post('/', authMiddleware, async (req, res) => {
        const { items, totalAmount, eventDate, paymentMethod, paymentType } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Order must contain at least one item.' });
        }

        try {
            // 1. Create the Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id: userId,
                    total_amount: totalAmount,
                    event_date: eventDate,
                    payment_method: paymentMethod,
                    status: 'En attente',
                    payment_status: 'pending' // In a real app, this changes after payment gateway callback
                }])
                .select()
                .single();

            if (orderError) {
                throw orderError;
            }

            const orderId = orderData.id;

            // 2. Create Order Items
            const orderItems = items.map(item => ({
                order_id: orderId,
                product_id: item.id, // Assuming item has product id
                quantity: item.quantity,
                price_at_booking: item.price,
                vendor_id: item.vendorId // We need this from frontend cart item
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                // ideally roll back order here, but for MVP we just error
                console.error('Error creating order items:', itemsError);
                throw itemsError;
            }

            res.status(201).json({ message: 'Order created successfully', order: orderData });

        } catch (err) {
            console.error('Server error creating order:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/orders/my-orders - Get orders for the logged-in user (Client)
    router.get('/my-orders', authMiddleware, async (req, res) => {
        const userId = req.user.id;

        try {
            // Fetch orders with their items
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          items:order_items (
            *,
            product:products (name, image)
          )
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.status(200).json(data);

        } catch (err) {
            console.error('Error fetching user orders:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /api/orders/vendor-orders - Get orders containing products from this vendor
    router.get('/vendor-orders', authMiddleware, async (req, res) => {
        const vendorId = req.user.id;

        try {
            // We want to see orders that have at least one item belonging to this vendor.
            // And we ideally want to see ONLY the items that belong to this vendor within that order.

            // Approach: Query order_items for this vendor, then expand order details
            const { data, error } = await supabase
                .from('order_items')
                .select(`
          *,
          order:orders (
            id, created_at, status, event_date, 
            user:profiles (full_name, email, avatar_url)
          ),
          product:products (name, image)
        `)
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false }); // Ensure sorting works or sort manually

            if (error) throw error;

            // Group by Order ID to show "Orders" rather than "Items" in the dashboard
            const ordersMap = {};

            data.forEach(item => {
                if (!ordersMap[item.order_id]) {
                    ordersMap[item.order_id] = {
                        ...item.order,
                        // Reconstruct order total relevant to THIS vendor if needed, 
                        // or just show global order status.
                        // Let's attach just the relevant items
                        items: []
                    };
                }
                ordersMap[item.order_id].items.push({
                    product_name: item.product.name,
                    image: item.product.image,
                    quantity: item.quantity,
                    price: item.price_at_booking,
                    total: item.quantity * item.price_at_booking
                });
            });

            const orders = Object.values(ordersMap);

            // Sort orders by date (most recent first)
            orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            res.status(200).json(orders);

        } catch (err) {
            console.error('Error fetching vendor orders:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // POST /api/orders/:id/status - Update order status (Vendor)
    // NOTE: In a multi-vendor order, changing status "Globally" might be tricky.
    // For MVP, if a vendor says "Confirmed", we might mark a specific "item" status or the whole order?
    // Let's assume for this MVP that changing status updates the global order status (Simpler)
    // BUT we should verify the user is a vendor involved in the order.
    router.put('/:id/status', authMiddleware, async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const vendorId = req.user.id;

        try {
            // Verify vendor involvement
            const { data: items, error: checkError } = await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', id)
                .eq('vendor_id', vendorId);

            if (checkError || items.length === 0) {
                return res.status(403).json({ error: 'You are not authorized to manage this order.' });
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', id)
                .select();

            if (error) throw error;
            res.status(200).json(data[0]);

        } catch (err) {
            console.error('Error updating status:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
