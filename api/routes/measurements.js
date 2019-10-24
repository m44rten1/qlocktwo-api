const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/temperature', (req, res, next) => {
    res.status(200).json(global.clock.temperature)
});

router.get('/brightness', (req, res, next) => {
    res.status(200).json(global.clock.brightness)
});

module.exports = router;