const fs = require('fs');
const ws281x = require("rpi-ws281x");
const convert = require("color-convert");
const mcpadc = require("mcp-spi-adc");
const moment = require('moment-timezone');

const clock = {};

config = {};
config.leds = 1;
config.dma = 10;
config.brightness = 255;
config.gpio = 18;
config.strip = 'grb';
ws281x.configure(config);
var pixels = new Uint32Array(config.leds);
ws281x.render(pixels)


clock.measurements = function() {
  const tempSensor = mcpadc.open(2, { speedHz: 20000 }, err => {
    if (err) throw err;

    setInterval(_ => {
      tempSensor.read((err, reading) => {
        if (err) throw err;

        global.temperature = (reading.value * 3.3 - 0.5) * 100;
      });
    }, 1000);
  });

  const lightsensor = mcpadc.open(3, { speedHz: 20000 }, err => {
    if (err) throw err;

    setInterval(_ => {
      lightsensor.read((err, reading) => {
        if (err) throw err;

        global.brightness =  reading.value * 100;
      });
    }, 1000);
  });
};

var getColor = function(settings) {
    color = convert.hex.lab.raw(settings.color.color.substr(1, 6));
    color[0] = parseInt(settings.brightness.brightness);
    color = convert.lab.hex(color);
    return parseInt(color, 16);
}

clock.render = function() {
    // Get settings
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    // Check what to show
    pixels[0] = getColor(settings);
    ws281x.render(pixels);

    console.log(settings.time.timezone.text + ": " + moment().tz(settings.time.timezone.utc[0]).format());
};

module.exports = clock;
