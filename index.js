const express = require('express');
const app = express();

app.get('/', (req, res) => {
	res.send('Home page')
});

app.get('/list-samples', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(require('./lib/list-samples.js').getSamples());
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));