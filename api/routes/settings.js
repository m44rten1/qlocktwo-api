const express = require('express');
const fs = require('fs');
const router = express.Router();
// const spawn = require('child_process').spawn
const ws281x = require('rpi-ws281x');

config = {};
config.leds = 1;
config.dma = 10;
config.brightness = 255;
config.gpio = 18;
config.strip = 'grb';

var pixels = new Uint32Array(config.leds);





const moment = require('moment-timezone');

var brightness = 0, color = "#000000";

setInterval(function(){
    let date_ob = new Date();
    console.log("Seconds: " + date_ob.getSeconds());
    console.log("")
    console.log("")
    // spawn('python3', ["./script.py", r, g, b, brightness])
  }, 5000);

router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.post('/', (req, res, next) => {
    color = req.body.color.color;
    config.brightness = req.body.brightness.brightness;
    ws281x.configure(config);

    pixels[0] = parseInt(color.substring(1,6), 16);

    ws281x.render(pixels);

    console.log(req.body.time.timezone.text + ": " + moment().tz(req.body.time.timezone.utc[0]).format());

    console.log("r, g, b, brightness: " + r + ', ' + g + ', ' + b + ', ' + brightness);

    // spawn('python3', ["./script.py", r, g, b, brightness])

    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
    });
});

module.exports = router;