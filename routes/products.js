const express = require('express');
const db = require('../db/database');

const router = express.Router();

// GET /api/products — list with search, filter, sort, pagination
router.get('/', (req, res) => {
    try {
        const {
            search = '',
            category = '',
            sort = 'newest',
            page = 1,
            limit = 12,
            featured,
            min_price,
            max_price
        } = req.query;

        let where = 'WHERE 1=1';
        const params = [];

        if (search) {
            where += ' AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        if (category) {
            where += ' AND category = ?';
            params.push(category);
        }

        if (featured !== undefined) {
            where += ' AND featured = 1';
        }

        if (min_price) {
            where += ' AND price >= ?';
            params.push(Number(min_price));
        }

        if (max_price) {
            where += ' AND price <= ?';
            params.push(Number(max_price));
        }

        let orderBy = 'ORDER BY created_at DESC';
        switch (sort) {
            case 'price_asc': orderBy = 'ORDER BY price ASC'; break;
            case 'price_desc': orderBy = 'ORDER BY price DESC'; break;
            case 'rating': orderBy = 'ORDER BY rating DESC'; break;
            case 'name': orderBy = 'ORDER BY name ASC'; break;
            default: orderBy = 'ORDER BY created_at DESC';
        }

        const offset = (Number(page) - 1) * Number(limit);

        // Get total count
        const countRow = db.prepare(`SELECT COUNT(*) as total FROM products ${where}`).get(...params);
        const total = countRow.total;

        // Get products
        const products = db.prepare(
            `SELECT * FROM products ${where} ${orderBy} LIMIT ? OFFSET ?`
        ).all(...params, Number(limit), offset);

        // Get all categories for filters
        const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();

        res.json({
            products,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            categories: categories.map(c => c.category)
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching products.' });
    }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
    try {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Get related products from same category
        const related = db.prepare(
            'SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4'
        ).all(product.category, product.id);

        res.json({ product, related });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching product.' });
    }
});

module.exports = router;
