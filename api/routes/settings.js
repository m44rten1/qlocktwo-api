const express = require('express');
const fs = require('fs');
const router = express.Router();
const ws281x = require('rpi-ws281x');
const convert = require('color-convert');
const mcpadc = require('mcp-spi-adc');

var value = -10;

const sensor = mcpadc.open(channelNumber, {}, err => {
  sensor.read((err, reading) => {
    console.log('  ch' + ': ' +
      reading.rawValue + ' / ' + reading.value);
      value = reading.value;
    sensor.close(err => {
    });
  });
});

console.log("test VALUE: " + value);



console.log("TEST: " + value);


const tempSensor = mcpadc.open(2, {speedHz: 20000}, err => {
    if (err) throw err;
   
    setInterval(_ => {
      tempSensor.read((err, reading) => {
        if (err) throw err;
   
        console.log("TEMP: " + (reading.value * 3.3 - 0.5) * 100);
      });
    }, 1000);
  });

  const lightsensor = mcpadc.open(3, {speedHz: 20000}, err => {
    if (err) throw err;
   
    setInterval(_ => {
        lightsensor.read((err, reading) => {
        if (err) throw err;
   
        console.log("LED: " + (reading.value) * 100);
      });
    }, 1000);
  });

config = {};
config.leds = 1;
config.dma = 10;
config.brightness = 255;
config.gpio = 18;
config.strip = 'grb';

ws281x.configure(config);

var pixels = new Uint32Array(config.leds);

ws281x.render(pixels)





const moment = require('moment-timezone');

var color = "#000000";

setInterval(function(){
    // let date_ob = new Date();
    // console.log("Seconds: " + date_ob.getSeconds());
    // console.log("")
    // console.log("")
    // spawn('python3', ["./script.py", r, g, b, brightness])

  }, 5000);

router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.post('/', (req, res, next) => {

    color = convert.hex.lab.raw(req.body.color.color.substr(1, 6));
    console.log(color)
    color[0] = parseInt(req.body.brightness.brightness);
    console.log(color)
    color = convert.lab.hex(color);
    console.log(color)
    pixels[0] = parseInt(color, 16);
    console.log(pixels[0])

    ws281x.render(pixels);

    console.log(req.body.time.timezone.text + ": " + moment().tz(req.body.time.timezone.utc[0]).format());

    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
    });
});

module.exports = router;