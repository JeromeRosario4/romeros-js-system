const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path')


const users = require('./routes/user')

app.use(cors())
app.use(express.json())
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use('/api/v1', users);
app.use('/api/v1', dashboard);

module.exports = app