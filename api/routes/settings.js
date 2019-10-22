const express = require('express');
const fs = require('fs');
const router = express.Router();
const spawn = require('child_process').spawn
const moment = require('moment-timezone');

var r, g, b, brightness, color;

setInterval(function(){
    let date_ob = new Date();
    console.log("Seconds: " + date_ob.getSeconds());
    console.log("")
    console.log("")
    spawn('python3', ["./script.py", r, g, b, brightness])
  }, 5000);

router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.post('/', (req, res, next) => {
    color = req.body.color.color;
    r = parseInt(color.substr(1,2), 16).toString();
    g = parseInt(color.substr(3,2), 16).toString();
    b = parseInt(color.substr(5,2), 16).toString();
    brightness = req.body.brightness.brightness;

    console.log(req.body.time.timezone.text + ": " + moment().tz(req.body.time.timezone.utc[0]).format());

    console.log("r, g, b, brightness: " + r + ', ' + g + ', ' + b + ', ' + brightness);

    spawn('python3', ["./script.py", r, g, b, brightness])

    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
    });
});

module.exports = router;