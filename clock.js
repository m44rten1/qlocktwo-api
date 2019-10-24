const ws281x = require('rpi-ws281x');
const convert = require('color-convert');
const mcpadc = require('mcp-spi-adc');

const clock = {
    measurements: {
        brightness: null,
        temperature: null
    }
}

clock.measurements.brightness = function() {
    var value = 0;
    const lightsensor = mcpadc.open(3, {speedHz: 20000}, err => {
        if (err) throw err;
       
        lightsensor.read((err, reading) => {
            if (err) throw err;
            value = reading.value;
        });
    });
    return value;
}

clock.measurements.temperature = function() {

    const tempSensor = mcpadc.open(2, {speedHz: 20000}, err => {
        if (err) throw err;
       
        setInterval(_ => {
          tempSensor.read((err, reading) => {
            if (err) throw err;
       
            console.log("TEMP: " + (reading.value * 3.3 - 0.5) * 100);
          });
        }, 1000);
      });

}


clock.render = function() {

}

module.exports = clock;