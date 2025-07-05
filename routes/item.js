const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const {
    getAllItems,
    getSingleItem,
    createItem,
    updateItem,
    deleteItem,
} = require('../controllers/item');
const { isAuthenticatedUser } = require('../middlewares/auth');

// GET /api/v1/items - Fetch all items
router.get('/', getAllItems);

// GET /api/v1/items/:id - Fetch single item by ID
router.get('/:id', getSingleItem);

// POST /api/v1/items - Create item (with image upload), requires auth
router.post('/', isAuthenticatedUser, upload.single('image'), createItem);

// PUT /api/v1/items/:id - Update item by ID, requires auth
router.put('/:id', isAuthenticatedUser, upload.single('image'), updateItem);

// DELETE /api/v1/items/:id - Delete item by ID, requires auth
router.delete('/:id', isAuthenticatedUser, deleteItem);

module.exports = router;
