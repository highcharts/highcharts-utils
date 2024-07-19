const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');
const { samplesDir } = require('../../lib/arguments.js');

router.get('/', function(req, res) {
    const fileNames = [
            'demo.js',
            'demo.mjs',
            'demo.html',
            'demo.css',
            'demo.details',
            'readme.md',
            'test-notes.html',
            'test-notes.md'
        ],
        existingFiles = fileNames.filter(
            fileName => fs.existsSync(
                path.join(samplesDir, req.query.path, fileName)
            )
        ),
        files = existingFiles.map(fileName => {
            const filePath = path.join(samplesDir, req.query.path, fileName);
            return {
                name: fileName,
                path: filePath,
                content: fs.readFileSync(filePath, 'utf8')
            };
        });


    res.render('samples/edit', {
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css'
        ],
        files,
        path: req.query.path,
        fullPath: path.join(samplesDir, req.query.path)
    });
});

module.exports = router;
