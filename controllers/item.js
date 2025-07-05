const connection = require('../config/database');

exports.getAllItems = (req, res) => {
    const sql = `SELECT i.*, s.quantity 
                FROM items i 
                LEFT JOIN stock s ON i.item_id = s.item_id
                WHERE i.deleted_at IS NULL`;
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        return res.status(200).json(results);
    });
};

exports.getSingleItem = (req, res) => {
    const sql = `SELECT i.*, s.quantity 
                FROM items i 
                LEFT JOIN stock s ON i.item_id = s.item_id
                WHERE i.item_id = ? AND i.deleted_at IS NULL`;
    const values = [parseInt(req.params.id)];
    
    connection.execute(sql, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        return res.status(200).json(results[0]);
    });
};

exports.createItem = (req, res) => {
    const { item_name, description, cost_price, sell_price, category_id, quantity } = req.body;
    let imagePath = null;

    if (!item_name || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.file) {
        imagePath = req.file.path.replace(/\\/g, "/");
    }

    connection.beginTransaction(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Transaction error', details: err });
        }

        const itemSql = `INSERT INTO items 
                        (item_name, description, cost_price, sell_price, category_id, image) 
                        VALUES (?, ?, ?, ?, ?, ?)`;
        const itemValues = [item_name, description, cost_price, sell_price, category_id, imagePath];

        connection.execute(itemSql, itemValues, (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: 'Error creating item', details: err });
                });
            }

            const itemId = result.insertId;
            const stockSql = 'INSERT INTO stock (item_id, quantity) VALUES (?, ?)';
            const stockValues = [itemId, quantity || 0];

            connection.execute(stockSql, stockValues, (err) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error(err);
                        res.status(500).json({ error: 'Error creating stock record', details: err });
                    });
                }

                connection.commit(err => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error(err);
                            res.status(500).json({ error: 'Commit error', details: err });
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        itemId,
                        message: 'Item created successfully'
                    });
                });
            });
        });
    });
};

exports.updateItem = (req, res) => {
    const id = req.params.id;
    const { item_name, description, cost_price, sell_price, category_id, quantity } = req.body;
    let imagePath = null;

    if (!item_name || !cost_price || !sell_price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.file) {
        imagePath = req.file.path.replace(/\\/g, "/");
    }

    connection.beginTransaction(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Transaction error', details: err });
        }

        const itemSql = `UPDATE items SET 
                        item_name = ?, 
                        description = ?, 
                        cost_price = ?, 
                        sell_price = ?, 
                        category_id = ?, 
                        image = COALESCE(?, image),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE item_id = ? AND deleted_at IS NULL`;
        const itemValues = [item_name, description, cost_price, sell_price, category_id, imagePath, id];

        connection.execute(itemSql, itemValues, (err, result) => {
            if (err) {
                return connection.rollback(() => {
                    console.error(err);
                    res.status(500).json({ error: 'Error updating item', details: err });
                });
            }

            if (result.affectedRows === 0) {
                return connection.rollback(() => {
                    res.status(404).json({ error: 'Item not found or already deleted' });
                });
            }

            const stockSql = 'UPDATE stock SET quantity = ? WHERE item_id = ?';
            const stockValues = [quantity, id];

            connection.execute(stockSql, stockValues, (err) => {
                if (err) {
                    return connection.rollback(() => {
                        console.error(err);
                        res.status(500).json({ error: 'Error updating stock', details: err });
                    });
                }

                connection.commit(err => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error(err);
                            res.status(500).json({ error: 'Commit error', details: err });
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Item updated successfully'
                    });
                });
            });
        });
    });
};

exports.deleteItem = (req, res) => {
    const id = req.params.id;
    
    // Soft delete (set deleted_at timestamp)
    const sql = `UPDATE items SET deleted_at = CURRENT_TIMESTAMP WHERE item_id = ?`;
    const values = [id];

    connection.execute(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error', details: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        return res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    });
};