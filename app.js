const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser')
const cors = require('cors')
const settingsRoutes = require('./api/routes/settings');
const measurementsRoutes = require('./api/routes/measurements');

global.clock = require('./clock');
global.clock.init();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use('/settings', settingsRoutes);
app.use('/measurements', measurementsRoutes);

// Error handling
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

const util = require('util');
const exec = util.promisify(require('child_process').exec);
async function lsWithGrep() {
  try {
      const { stdout, stderr } = await exec('sudo iwlist wlan0 scan | grep ESSID');

	var out = stdout.split("\n").map( out => out.substring(out.lastIndexOf(":") + 2, out.lastIndexOf("\"")));
	out.pop();      
	console.log('stdout:', out);
      console.log('stderr:', stderr);
  }catch (err){
     console.error(err);
  };
};
lsWithGrep();

// TODO: Delete this lines, testing line for rendring a random hour
// global.clock.render();
// setInterval(() => {
//     console.log("Bightness: " + global.clock.brightness);
//     console.log("Temperature: " + global.clock.temperature);
//     console.log("-----------------------------------------------");
// }, 1000);

module.exports = app;