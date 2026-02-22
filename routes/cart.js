const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(authenticateToken);

// GET /api/cart
router.get('/', (req, res) => {
    try {
        const items = db.prepare(`
      SELECT ci.id, ci.quantity, ci.product_id,
             p.name, p.price, p.image, p.stock, p.brand
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `).all(req.user.id);

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        res.json({ items, total: Math.round(total * 100) / 100, count: items.length });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching cart.' });
    }
});

// POST /api/cart — add item
router.post('/', (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID is required.' });
        }

        // Check product exists
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Check if already in cart
        const existing = db.prepare(
            'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?'
        ).get(req.user.id, product_id);

        if (existing) {
            const newQty = existing.quantity + Number(quantity);
            db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
            return res.json({ message: 'Cart updated', quantity: newQty });
        }

        const result = db.prepare(
            'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)'
        ).run(req.user.id, product_id, Number(quantity));

        res.status(201).json({ message: 'Added to cart', id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: 'Server error adding to cart.' });
    }
});

// PUT /api/cart/:id — update quantity
router.put('/:id', (req, res) => {
    try {
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity is required.' });
        }

        const item = db.prepare(
            'SELECT * FROM cart_items WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!item) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }

        db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(Number(quantity), req.params.id);

        res.json({ message: 'Cart updated', quantity: Number(quantity) });
    } catch (err) {
        res.status(500).json({ error: 'Server error updating cart.' });
    }
});

// DELETE /api/cart/:id — remove item
router.delete('/:id', (req, res) => {
    try {
        const item = db.prepare(
            'SELECT * FROM cart_items WHERE id = ? AND user_id = ?'
        ).get(req.params.id, req.user.id);

        if (!item) {
            return res.status(404).json({ error: 'Cart item not found.' });
        }

        db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(500).json({ error: 'Server error removing from cart.' });
    }
});

module.exports = router;
