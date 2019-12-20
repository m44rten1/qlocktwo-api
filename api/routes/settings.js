const express = require('express');
const fs = require('fs');
const router = express.Router();
var wifiControl = require('wifi-control');
var settings = {
    debug: true,
    iface: 'wlan1',
    connectionTimeout: 10000 // in ms
};
wifiControl.configure( settings );



router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.post('/', (req, res, next) => {
    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
        global.clock.renderTime();
    });
});

router.get('/message', (req, res, next) => {
    res.status(200).json(global.clock.renderText(req.query.message, 0.1));
});

// TODO: check this
router.get('/connected-to-internet', (req, res, next) => {
    require('dns').resolve('www.google.com', function(err) {
        if (err) {
            res.status(200).json(false)
        } else {
            res.status(200).json(true)
        }
    });
});

// TODO: check this
router.get('/wifi-networks', (req, res, next) => {
    new Promise((resolve, reject) => {
        WiFiControl.scanForWiFi( function(err, response) {
            if (err) reject(err);
            resolve(response);
          });
    }).then( (response) => {
        res.status(200).json(response);
    }).catch(error => res.status(error))
});

// TODO: check this
router.get('/current-connection', (req, res, next) => {
    res.status(200).json(wifiControl.getIfaceState());
});

// TODO: finish this
router.post('/connect-to-wifi', (req, res, next) => {
    // example data: { ssid: "nameOfWifiNetwork", password: "psswrdOfWifiNetwork"} Het kan dat er geen password is!!
    var connectionData = JSON.parse(req.body);    // TODO: nodig om te parsen?
    console.log("Parsed: ", connectionData);

    new Promise((resolve, reject) => {
        WiFiControl.connectToAP( connectionData, function(err, response) {
            if (err) reject(err);
            resolve(response);
        })
    }).then( (response) => {
        res.status(200).json(response);
    }).catch(error => res.status(error))
});



module.exports = router;