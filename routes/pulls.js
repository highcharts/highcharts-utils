const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    res.render('pulls/main', {
        styles: [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css',
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ],
        scripts: [
            'https://cdnjs.cloudflare.com/ajax/libs/timeago.js/2.0.2/timeago.min.js'
        ],
        title: 'Pulls'
    });
});

router.get('/auth', async (req, res) => {
    res.type('text/javascript');
    res.send(`export default {
        clientId: '${process.env.GH_CLIENT_ID}',
        clientSecret: '${process.env.GH_CLIENT_SECRET}'
    }`);
});
module.exports = router;



