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
  raster: null, // Led map raster: led-indexes in a 11 x 10 array
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
    this.raster = this.buildAddressRaster();
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
  renderTime() {
    // Get settings
    let rawdata = fs.readFileSync("settings.json");
    let settings = JSON.parse(rawdata);

    // Check what to show
    //this.pixels[0] = getColor(settings);
    


    var minutes = parseInt(moment().tz(settings.time.timezone.utc[0]).format().substr(14, 2));
    var hour = parseInt(moment().tz(settings.time.timezone.utc[0]).format().substr(11, 2));

    minutes = parseInt(Math.random() * 60);
    hour = parseInt(Math.random() * 24);
    console.log(
      "Hour:minutes   " + hour + ":" + minutes
    );

    this.timeToArray( hour, minutes, getColor(settings));
    ws281x.render(this.pixels);

  },
  renderText(text, speed, repeatFactor) {

    // speed: time between each transition (s)
    // text: text to be displayed
    // repeatFactor: number of times the text needs to be shown

    // Get settings
    let rawdata = fs.readFileSync("settings.json");
    let settings = JSON.parse(rawdata);
    var color = getColor(settings);
    var that = this;
    
    var factor = 0;
    var startIndex = 11;
    displayText(startIndex);
    if(repeatFactor > 0) {
      repeatFactor--;
      loopText();
    }
    function loopText() { 
      setTimeout(function () {   
        var startIndex = 11;
        displayText(startIndex);
        
        factor++;

         if (factor < repeatFactor) {           
          loopText();    
         }                       
      }, parseInt(speed * 1000) * (text.length + 20))  
    }

    function displayText(index) { 
      setTimeout(function () {   
        that.clearPixels();
        var snapshot = that.createEmptySnapshotArray();
        snapshot = that.addLetters(snapshot, index, text);
        that.snapshotToPixels(snapshot, color);
        ws281x.render(new Uint32Array(JSON.parse(JSON.stringify(that.pixels))));
        index--;                    
        if (index < - (text.length + 1)) {           
          displayText(index);    
        }                       
      }, parseInt(speed * 1000))
    }
  },
  snapshotToPixels(snapshot, color) {
    for(var i = 0; i < snapshot.length; i++) {
      for(var j = 0; j < snapshot[0].length; j++) {
        if(snapshot[i][j]) {
          this.pixels[this.raster[i][j]] = color;
        }
      }
    }
  },
  createEmptySnapshotArray() {
    var snapshot = [];
    for(var i = 0; i < 11; i++) {
      snapshot[i] = [];
      for(var j = 0; j < 10; j++) {
        snapshot[i][j] = false;
      }
    }
    return snapshot;
  },
  buildAddressRaster() {
    // Build empty 11 x 10 array
    var raster = [];
    for(var i = 0; i < 11; i++) {
      raster[i] = [];
    }

    // Fill up raster
    for(var j = 0; j < 10; j++) {
      // Fist row
      raster[0][j] = 10 - j;

      // Last row
      raster[10][j] = 112 - j;

      // Middle rows
      for (var i = 1; i < 10; i++) {
        // Even rows
        if (i % 2 == 0 ) {
          raster[i][j] = (i + 1) * 10 + 1 - j;
        }

        // Odd rows
        if (i % 2 != 0) {
          raster[i][j] = i * 10 + 2 + j;
        }
      }
    }
  },
  addLetter(snapshotArray, index, charLetter) {
    // index can be smaller than 0! 0 means the letter is all the way to the left and completely visible
    var leds = charToLED(charLetter);
    for(var i = index; i < index + 5; i++) {
      for(var j = 2; j < 9; j++) {
        if (i >= 0 && i < 11) {
          snapshotArray[i][j] = leds[i - index][j - 2];
        }
      }
    }
    return snapshotArray;

  },
  addLetters(snapshotArray, index, text) {
    var spaceBetweenLetters = 1;
    var spaceBetweenWords = 3;
    var wordArray = text.toUpperCase().split(' ');

    wordArray.forEach( word => {
      word.split("").forEach(letter => {
        snapshotArray = this.addLetter(snapshotArray, index, letter);
        index += 5 + spaceBetweenLetters;
      })
      index += (spaceBetweenWords - spaceBetweenLetters);
    });
    return snapshotArray;
  },
  clearPixels() {
    // Clear pixels
    this.pixels.forEach((pixel, index) => {
      this.pixels[index] = 0;
    });
  },
  timeToArray(hours, minutes, color) {
    // Clear pixels
    this.clearPixels();

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

function charToLED(theChar){
  var theLed = [];
	switch(theChar){
    case 'A' :
      theLed = [[false, false, true, true, true, true, true], 
                [false, true, false, false, true, false, false], 
                [true, false, false, false, true, false, false],
                [false, true, false, false, true, false, false],
                [false, false, true, true, true, true, true]];
      break;
    case 'B' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [false, true, true, false, true, true, false]];
      break;
		case 'C' :
      theLed = [[false, true, true, true, true, true, false], 
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [false, true, false, false, false, true, false]]; 
      break;
     case 'D' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [false, true, true, true, true, true, false]]; 
      break;
    case 'E' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [true, false, false, false, false, false, true]];
      break;
    case 'F' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [true, false, false, false, false, false, false]];
      break;
    case 'G' :
      theLed = [[false, true, true, true, true, true, false], 
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [true, false, false, false, true, false, true],
                [true, true, false, false, true, true, true]];
      break;
    case 'H' :
      theLed = [[true, true, true, true, true, true, true], 
                [false, false, false, true, false, false, false],
                [false, false, false, true, false, false, false],
                [false, false, false, true, false, false, false],
                [true, true, true, true, true, true, true]];
      break;
    case 'I' :
      theLed = [[false, false, false, false, false, false, false], 
                [true, false, false, false, false, false, true],
                [true, true, true, true, true, true, true],
                [true, false, false, false, false, false, true],
                [false, false, false, false, false, false, false]];
      break;
    case 'J' :
      theLed = [[false, false, false, false, false, true, false], 
                [false, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [true, true, true, true, true, true, false],
                [true, false, false, false, false, false, false]];
      break;  
 	 case 'K' :
      theLed = [[true, true, true, true, true, true, true], 
                [false, false, false, true, false, false, false],
                [false, false, true, false, true, false, false],
                [false, true, false, false, false, true, false],
                [true, false, false, false, false, false, true]];
      break;
 	 case 'L' :
      theLed = [[true, true, true, true, true, true, true], 
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, false, true]];
      break;
 	 case 'M' :
      theLed = [[true, true, true, true, true, true, true], 
                [false, true, false, false, false, false, false],
                [false, false, true, false, false, false, false],
                [false, true, false, false, false, false, false],
                [true, true, true, true, true, true, true]];
      break;
 	 case 'N' :
      theLed = [[true, true, true, true, true, true, true], 
                [false, false, true, false, false, false, false],
                [false, false, false, true, false, false, false],
                [false, false, false, false, true, false, false],
                [true, true, true, true, true, true, true]];
      break;
 	 case 'O' :
      theLed = [[false, true, true, true, true, true, false], 
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [true, false, false, false, false, false, true],
                [false, true, true, true, true, true, false]];
      break;
 	 case 'P' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [false, true, true, false, false, false, false]];
      break;
 	 case 'Q' :
      theLed = [[false, true, true, true, true, true, false], 
                [true, false, false, false, false, false, true],
                [true, false, false, false, true, false, true],
                [true, false, false, false, false, true, false],
                [false, true, true, true, true, false, true]];
      break;
 	 case 'R' :
      theLed = [[true, true, true, true, true, true, true], 
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [true, false, false, true, false, false, false],
                [false, true, true, false, true, true, true]];
      break;
 	 case 'S' :
      theLed = [[false, true, true, false, false, false, true], 
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [true, false, false, true, false, false, true],
                [true, false, false, false, true, true, false]];
      break;
 	 case 'T' :
      theLed = [[true, false, false, false, false, false, false], 
                [true, false, false, false, false, false, false],
                [true, true, true, true, true, true, true],
                [true, false, false, false, false, false, false],
                [true, false, false, false, false, false, false]];
      break;
 	 case 'U' :
      theLed = [[true, true, true, true, true, true, false], 
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, false, true],
                [true, true, true, true, true, true, false]];
      break;
 	 case 'V' :
      theLed = [[true, true, true, true, true, false, false], 
                [false, false, false, false, false, true, false],
                [false, false, false, false, false, false, true],
                [false, false, false, false, false, true, false],
                [true, true, true, true, true, false, false]];
      break;
 	 case 'W' :
      theLed = [[true, true, true, true, true, true, false], 
                [false, false, false, false, false, false, true],
                [false, false, false, false, true, true, false],
                [false, false, false, false, false, false, true],
                [true, true, true, true, true, true, false]];
      break;
 	 case 'X' :
      theLed = [[true, false, false, false, false, false, true], 
                [false, true, true, false, true, true, false],
                [false, false, false, true, false, false, false],
                [false, true, true, false, true, true, false],
                [true, false, false, false, false, false, true]];
      break;
 	 case 'Y' :
      theLed = [[true, false, false, false, false, false, false], 
                [false, true, false, false, false, false, false],
                [false, false, true, true, true, true, true],
                [false, true, false, false, false, false, false],
                [true, false, false, false, false, false, false]];
      break;
 	 case 'Z' :
      theLed = [[true, false, false, false, false, true, true], 
                [true, false, false, false, true, false, true],
                [true, false, false, true, false, false, true],
                [true, false, true, false, false, false, true],
                [true, true, false, false, false, false, true]];
      break;
    default:
      theLed = [[false, false, false, false, false, false, false]];
  }  
  return theLed;
}

module.exports = clock;
