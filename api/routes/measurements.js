const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/temperature', (req, res, next) => {
    res.status(200).json(global.clock.temperature)
});

router.get('/brightness', (req, res, next) => {
    var brightness = 100 - global.clock.measuredBrightness;
    if (brightness < 0) {
        brightness = 0;
    }
    if (brightness > 100) {
        brightness = 100;
    }
    res.status(200).json(brightness);
});

module.exports = router;