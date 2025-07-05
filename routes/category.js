const express = require('express');
const router = express.Router();
const connection = require('../config/database');

router.get('/', (req, res) => {
connection.query('SELECT category_id, description FROM categories', (err, results) => {
if (err) return res.status(500).json({ error: 'Database error', details: err });
res.json(results);
});
});

module.exports = router;