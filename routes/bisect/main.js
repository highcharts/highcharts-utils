import express from 'express';

const router = express.Router();

router.get('/', function(req, res) {
  	res.render('bisect/main', {
  		html: req.session.html,
  		css: req.session.css,
  		js: req.session.js
  	});
});

export default router;
