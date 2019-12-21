const express = require('express');
const fs = require('fs');
const router = express.Router();
var Wifi = require('rpi-wifi-connection');
var wifi = new Wifi("wlan1");
const isOnline = require('is-online');


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
    
    isOnline().then(response => {
        res.status(200).json(response)
    }).catch(err => res.status(200).json(false));
    
});

// TODO: check this
router.get('/wifi-networks', (req, res, next) => {
    wifi.scan().then((ssids) => {
        res.status(200).json(ssids);
    })
    .catch((error) => {
        res.status(error);
    });
});

// TODO: check this
router.get('/current-connection', (req, res, next) => {
    wifi.getStatus().then((status) => {
        res.status(200).json(status);
    })
    .catch((error) => {
        res.status(error);
    });    
});

// TODO: finish this
router.post('/connect-to-wifi', (req, res, next) => {
    // example data: { ssid: "nameOfWifiNetwork", psk: "psswrdOfWifiNetwork"} Het kan dat er geen password is!!
    //ar connectionData = JSON.parse(req.body);    // TODO: nodig om te parsen?

    wifi.connect(req.body).then(() => {
        res.status(200).json(true);
    })
    .catch((error) => {
        res.status(200).json(false);
    });
});



module.exports = router;