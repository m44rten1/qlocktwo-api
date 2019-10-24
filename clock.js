const fs = require("fs");
const ws281x = require("rpi-ws281x");
const convert = require("color-convert");
const mcpadc = require("mcp-spi-adc");
const moment = require("moment-timezone");

tempFilter = [0, 0, 0, 0, 0, 0, 0];
brightnessFilter = [0, 0, 0, 0, 0, 0, 0];

const clock = {
  pixels: null,
  config: {},
  brightness: 0,
  temperature: 0,
  init: function() {
    this.config.dma = 10;
    this.config.brightness = 255;
    this.config.gpio = 18;
    this.config.strip = "grb";
    this.config.leds = 1;

    ws281x.configure(this.config);

    this.pixels = new Uint32Array(this.config.leds);

    this.measurements();
  },
  measurements: function() {
    const tempSensor = mcpadc.open(2, { speedHz: 20000 }, err => {
      if (err) throw err;

      setInterval(_ => {
        tempSensor.read((err, reading) => {
          if (err) throw err;
          tempFilter.shift();
          tempFilter.push((reading.value * 3.3 - 0.5) * 100);
          this.temperature = average(tempFilter);
        });
      }, 1000);
    });

    const lightsensor = mcpadc.open(3, { speedHz: 20000 }, err => {
      if (err) throw err;

      setInterval(_ => {
        lightsensor.read((err, reading) => {
          if (err) throw err;
            
          brightnessFilter.shift();
          brightnessFilter.push(reading.value * 100);
          this.brightness = average(tempFilter);
        });
      }, 1000);
    });
  },
  render: function() {
    // Get settings
    let rawdata = fs.readFileSync("settings.json");
    let settings = JSON.parse(rawdata);

    // Check what to show
    this.pixels[0] = getColor(settings);
    ws281x.render(this.pixels);

    console.log(
      settings.time.timezone.text +
        ": " +
        moment().tz(settings.time.timezone.utc[0])//.format()
    );
  }
};

var getColor = function(settings) {
  color = convert.hex.lab.raw(settings.color.color.substr(1, 6));
  color[0] = parseInt(settings.brightness.brightness);
  color = convert.lab.hex(color);
  return parseInt(color, 16);
};

var average = function(arr) {
    sum = 0;
    arr.forEach(element => {
        sum += element;
    }); 

    return sum / arr.length;
}

module.exports = clock;
