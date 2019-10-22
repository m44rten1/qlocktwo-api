const express = require('express');
const fs = require('fs');
const router = express.Router();
const spawn = require('child_process').spawn

router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.post('/', (req, res, next) => {
    const color = req.body.color.color;
    const r = parseInt(color.substr(1,2), 16).toString();
    const g = parseInt(color.substr(3,2), 16).toString();
    const b = parseInt(color.substr(5,2), 16).toString();
    const brightness = req.body.brightness.brightness;

    const pythonProcess = spawn('python3', ["./script.py", r, g, b, brightness])

    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
    });
});

module.exports = router;