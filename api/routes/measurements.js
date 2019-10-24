const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/temperature', (req, res, next) => {
    res.status(200).json(global.temperature)
});

router.get('/brightness', (req, res, next) => {
    res.status(200).json(global.brightness)
});

module.exports = router;