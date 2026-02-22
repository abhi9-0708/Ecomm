const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// POST /api/orders — checkout (create order from cart)
router.post('/', (req, res) => {
    try {
        const { shipping_name, shipping_address, shipping_city, shipping_zip, payment_method = 'card' } = req.body;

        if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip) {
            return res.status(400).json({ error: 'Complete shipping information is required.' });
        }

        // Get cart items
        const cartItems = db.prepare(`
      SELECT ci.*, p.name as product_name, p.price, p.image as product_image, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(req.user.id);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Add items before checkout.' });
        }

        // Check stock
        for (const item of cartItems) {
            if (item.quantity > item.stock) {
                return res.status(400).json({
                    error: `Insufficient stock for "${item.product_name}". Available: ${item.stock}`
                });
            }
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create order in a transaction
        const createOrder = db.transaction(() => {
            const orderResult = db.prepare(`
        INSERT INTO orders (user_id, total, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, Math.round(total * 100) / 100, shipping_name, shipping_address, shipping_city, shipping_zip, payment_method);

            const orderId = orderResult.lastInsertRowid;

            // Insert order items
            const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

            const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

            for (const item of cartItems) {
                insertOrderItem.run(orderId, item.product_id, item.product_name, item.product_image, item.price, item.quantity);
                updateStock.run(item.quantity, item.product_id);
            }

            // Clear cart
            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

            return orderId;
        });

        const orderId = createOrder();

        res.status(201).json({
            message: 'Order placed successfully!',
            order_id: orderId,
            total: Math.round(total * 100) / 100
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during checkout.' });
    }
});

// GET /api/orders — user order history
router.get('/', (req, res) => {
    try {
        const orders = db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id);

        // Get item count for each order
        const getItemCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?');
        const enrichedOrders = orders.map(order => ({
            ...order,
            item_count: getItemCount.get(order.id).count
        }));

        res.json({ orders: enrichedOrders });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching orders.' });
    }
});

// GET /api/orders/:id — order detail
router.get('/:id', (req, res) => {
    try {
        const order = db.prepare(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const items = db.prepare(
            'SELECT * FROM order_items WHERE order_id = ?'
        ).all(order.id);

        res.json({ order: { ...order, items } });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching order.' });
    }
});

module.exports = router;
