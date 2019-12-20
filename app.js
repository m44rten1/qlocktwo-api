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

// Write to file:
const fs = require('fs');

fs.appendFile("/tmp/test", "\nnetwork:{\nabc:efg\nhij:klm\n}", function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 



// TODO: Delete this lines, testing line for rendring a random hour
// global.clock.renderTime();
// setInterval(() => {
//     console.log("Bightness: " + global.clock.brightness);
//     console.log("Temperature: " + global.clock.temperature);
//     console.log("-----------------------------------------------");
// }, 1000);

//global.clock.renderText("Do you want to go on a date with me?         (please say yes!)", 0.10);

module.exports = app;