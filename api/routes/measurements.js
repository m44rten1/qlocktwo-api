const express = require('express');
const fs = require('fs');
const router = express.Router();

router.get('/temperature', (req, res, next) => {
    res.status(200).json(12.456)
});


module.exports = router;