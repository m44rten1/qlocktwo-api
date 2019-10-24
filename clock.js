const fs = require("fs");
const ws281x = require("rpi-ws281x");
const ws281x_1 = require("rpi-ws281x");
const convert = require("color-convert");
const mcpadc = require("mcp-spi-adc");
const moment = require("moment-timezone");

tempFilter = new Array(150).fill(0);
brightnessFilter = new Array(150).fill(0);

const clock = {
  pixels: null,
  pixel: null,  // Lonley LED
  config: {},
  config_1: {},
  brightness: 0,
  temperature: 0,
  initLed() {
    this.config_1.dma = 10;
    this.config_1.brightness = 255;
    this.config_1.gpio = 21;
    this.config_1.strip = "grb";
    this.config_1.leds = 1;

    ws281x_1.configure(this.config_1);

    this.pixel = new Uint32Array(this.config_1.leds);
  },
  initLeds() {
    this.config.dma = 10;
    this.config.brightness = 255;
    this.config.gpio = 18;
    this.config.strip = "grb";
    this.config.leds = 1;

    ws281x.configure(this.config);

    this.pixels = new Uint32Array(this.config.leds);
  },
  init() {
    this.initLed();
    this.initLeds();
    this.measurements();
  },
  measurements() {
    const tempSensor = mcpadc.open(2, { speedHz: 20000 }, err => {
      if (err) throw err;

      setInterval(_ => {
        tempSensor.read((err, reading) => {
          if (err) throw err;
          tempFilter.shift();
          tempFilter.push((reading.value * 5 - 0.5) * 100);
          this.temperature = average(tempFilter);
        });
      }, 200);
    });

    const lightsensor = mcpadc.open(3, { speedHz: 20000 }, err => {
      if (err) throw err;

      setInterval(_ => {
        lightsensor.read((err, reading) => {
          if (err) throw err;
            
          brightnessFilter.shift();
          brightnessFilter.push(reading.value * 100);
          this.brightness = average(brightnessFilter);
        });
      }, 200);
    });
  },
  render() {
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
