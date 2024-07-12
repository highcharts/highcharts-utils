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
        fileName => fs.existsSync(path.join(samplesDir, req.query.path, fileName))
    ),
    files = existingFiles.map(fileName => {
        const filePath = path.join(samplesDir, req.query.path, fileName),
        ext = fileName.split('.').pop();
        return {
            name: fileName,
            path: filePath,
            content: fs.readFileSync(filePath, 'utf8'),
            editorMode: {
                js: 'javascript',
                css: 'css',
                details: 'yaml',
                html: 'htmlmixed',
                md: 'markdown'
            }[ext] || ext
        };
    });


    res.render('samples/edit', {
        scripts: [
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/css/css.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/htmlmixed/htmlmixed.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/javascript/javascript.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/markdown/markdown.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/yaml/yaml.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/mode/xml/xml.min.js'
        ],
        styles: [
            '/stylesheets/vendor/font-awesome-4.7.0/css/font-awesome.css',
            '//cdnjs.cloudflare.com/ajax/libs/codemirror/4.0.3/codemirror.min.css'
        ],
        files,
        path: req.query.path
    });
});

/*
router.post('/', async (req, res) => {
    const tmpDir = require('os').tmpdir();
    let error = null;

    try {
        await fsp.writeFile(
            path.join(
                tmpDir,
                req.query.path.replace(/\//g, '-') + '.json'
            ),
            JSON.stringify(req.body.files)
        );
    } catch (err) {
        error = err;
    }

    if (error) {
        res.status(500).send(error.message);
    } else {
        res.send('OK');
    }
});
*/

module.exports = router;
