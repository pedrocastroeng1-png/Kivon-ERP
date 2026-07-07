const express = require('express');
const app = express();
app.use(express.static('dist'));
app.get('*', (req, res) => res.send('catchall'));
app.listen(3002, () => console.log('ready'));
