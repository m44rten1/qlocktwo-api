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
      uhr: [82, 101, 103],

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
    //this.pixels[0] = getColor(settings);
    


    var minutes = parseInt(moment().tz(settings.time.timezone.utc[0]).format().substr(14, 2));
    var hour = parseInt(moment().tz(settings.time.timezone.utc[0]).format().substr(11, 2));

    console.log(
      "Hour:minutes   " + hour + ":" + minutes
    );

    this.timeToArray(22, 24, getColor(settings));
    ws281x.render(this.pixels);

  },
  timeToArray(hours, minutes, color) {
    // Clear pixels
    this.pixels.forEach(pixel => {
      pixel = 0;
    });

    var roundedMinutes = parseInt(minutes / 5) * 5;
    var roundedHours = hours % 12;
    var concatArray = [];

    switch(roundedMinutes) {
      // 12 o'clock
      case 0:
        if (roundedHours == 1) {
          concatArray = [
            ...this.ledArrayInterface.words.esIst, 
            ...this.ledArrayInterface.words.ein, 
            ...this.ledArrayInterface.words.uhr
          ];
        } else {
          concatArray = [
            ...this.ledArrayInterface.words.esIst, 
            ...this.ledArrayInterface.hours[roundedHours], 
            ...this.ledArrayInterface.words.uhr
          ];
        }
          
        break;
      case 5:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.fuenf,
          ...this.ledArrayInterface.words.nach,  
          ...this.ledArrayInterface.hours[roundedHours] 
        ];
        break;
      case 10:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.zehn,
          ...this.ledArrayInterface.words.nach,  
          ...this.ledArrayInterface.hours[roundedHours] 
        ];
        break;
      case 15:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.viertel,
          ...this.ledArrayInterface.words.nach,  
          ...this.ledArrayInterface.hours[roundedHours] 
        ];
        break;
      case 20:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.zwanzig,
          ...this.ledArrayInterface.words.nach,  
          ...this.ledArrayInterface.hours[roundedHours] 
        ];
        break;
      case 25:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.fuenf,
          ...this.ledArrayInterface.words.vor,
          ...this.ledArrayInterface.words.halb,  
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 30:
        concatArray = [
          ...this.ledArrayInterface.words.esIst, 
          ...this.ledArrayInterface.words.halb,  
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 35:
        concatArray = [
          ...this.ledArrayInterface.words.esIst,
          ...this.ledArrayInterface.words.fuenf,
          ...this.ledArrayInterface.words.nach,
          ...this.ledArrayInterface.words.halb,  
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 40:
        concatArray = [
          ...this.ledArrayInterface.words.esIst,
          ...this.ledArrayInterface.words.zwanzig,
          ...this.ledArrayInterface.words.vor, 
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 45:
        concatArray = [
          ...this.ledArrayInterface.words.esIst,
          ...this.ledArrayInterface.words.viertel,
          ...this.ledArrayInterface.words.vor, 
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 50:
        concatArray = [
          ...this.ledArrayInterface.words.esIst,
          ...this.ledArrayInterface.words.zehn,
          ...this.ledArrayInterface.words.vor, 
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
      case 55:
        concatArray = [
          ...this.ledArrayInterface.words.esIst,
          ...this.ledArrayInterface.words.fuenf,
          ...this.ledArrayInterface.words.vor, 
          ...this.ledArrayInterface.hours[(roundedHours + 1) % 12] 
        ];
        break;
    }

    var restMinutes = minutes % 5;

    switch(restMinutes) {
      case 0:
        break;
      case 1:
        this.pixels[11] = color;
        break;
      case 2:
        this.pixels[11] = color;
        this.pixels[113] = color;
        break;
      case 3:
        this.pixels[11] = color;
        this.pixels[113] = color;
        this.pixels[102] = color;
        break;
      case 4:
        this.pixels[11] = color;
        this.pixels[113] = color;
        this.pixels[102] = color;
        this.pixels[0] = color;
        break;
    }

    // Set pixels
    concatArray.forEach( element => {
      this.pixels[element] = color;
    })
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
