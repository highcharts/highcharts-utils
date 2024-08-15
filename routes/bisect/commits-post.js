import express from 'express';

const router = express.Router();

router.post('/', function(req, res) {
	req.session.branch = req.body.branch;
	req.session.after = req.body.after;
	req.session.before = req.body.before;
	req.session.alltags = req.body.alltags === 'on';
	res.redirect('/bisect/commits');
});

export default router;
