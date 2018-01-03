const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', function(req, res, next) {
  	res.render('bisect/main', {
  		html: req.session.html,
  		css: req.session.css,
  		js: req.session.js
  	});
});

module.exports = router;
