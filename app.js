const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path')

const users = require('./routes/user')
const itemsRouter = require('./routes/item');
const categoryRouter = require('./routes/category');

app.use(cors())
app.use(express.json())

app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/v1', users);
app.use('/api/v1/items', require('./routes/item'));
app.use('/api/v1/categories', categoryRouter);


module.exports = app