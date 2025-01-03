import express from 'express';
const router = express.Router();


router.post('/', function(req, res) {
	req.session.html = req.body.html;
	req.session.css = req.body.css;
	req.session.js = req.body.js;
	res.redirect('/bisect/main');
});

export default router;
