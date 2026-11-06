import express from 'express';
import fs from 'fs';
import { getSampleEntryInfo, validPathRegex } from '../../lib/functions.js';
import path from 'path';
import { samplesDir } from '../../lib/arguments.js';

const router = express.Router();

router.get('/', function(req, res) {
    const sampleEntry = getSampleEntryInfo(req.query.path);
    const existingFiles = sampleEntry.editableFiles.filter(fileName => fs.existsSync(
        path.join(samplesDir, req.query.path, fileName)
    ));
    const files = existingFiles.map(fileName => {
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
        fullPath: path.join(samplesDir, req.query.path),
        validPathRegex
    });
});

export default router;
