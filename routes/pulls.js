const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    res.render('pulls/main');
});

router.get('/auth', async (req, res) => {
    res.type('text/javascript');
    res.send(`export default {
        clientId: '${process.env.GH_CLIENT_ID}',
        clientSecret: '${process.env.GH_CLIENT_SECRET}'
    }`);
});
module.exports = router;



