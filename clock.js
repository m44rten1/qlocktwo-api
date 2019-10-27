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
  brightness: 0,
  temperature: 0,
  ledArrayInterface: {
    hours: [
      [63, 80, 83, 100, 104],  // ZWOELF, NULL
      [5, 17, 26, 37],  // EINS
      [77, 86, 97, 107],  // ZWEI
      [4, 18, 25, 38],  // DREI
      [78, 85, 98, 106],  // VIER
      [76, 87, 96, 108],  // FUENF
      [3, 19, 24, 39, 44],  // SECHS
      [2, 20, 23, 40, 43, 60],  // SIEBEN
      [79, 84, 99, 105],  // ACHT
      [41, 42, 61, 62],  // NEUN
      [1, 21, 22, 41],  // ZEHN
      [56, 67, 76],  // ELF

    ],
    words: {
      esIst: [10, 12, 32, 51, 52],
      ein: [5, 17, 26],
      drei: [8, 14, 29, 34],
      fuenf: [72, 91, 92, 112],
      zehn: [9, 13, 30, 33],
      viertel: [49, 54, 69, 74, 89, 94, 110],
      zwanzig: [50, 53, 70, 73, 90, 93, 111],
      halb: [6, 16, 27, 36],
      vor: [7, 15, 28],
      nach: [75, 88, 95, 109],
      Uhr: [82, 101, 103],

    }
  },
  
  initLeds() {
    this.config.dma = 10;
    this.config.brightness = 255;
    this.config.gpio = 18;
    this.config.strip = "grb";
    this.config.leds = 114;

    ws281x.configure(this.config);

    this.pixels = new Uint32Array(this.config.leds);
  },
  init() {
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
        moment().tz(settings.time.timezone.utc[0]).format()
    );
  },

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
