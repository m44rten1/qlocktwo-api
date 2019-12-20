const express = require('express');
const fs = require('fs');
const router = express.Router();
const util = require('util');
const exec = util.promisify(require('child_process').exec);

router.get('/', (req, res, next) => {
    let rawdata = fs.readFileSync('settings.json');
    let settings = JSON.parse(rawdata);

    res.status(200).json(settings)
});

router.get('/message/:text', (req, res, next) => {
    console.log(req.params.text);
    res.status(200).json(global.clock.renderText());
});

// TODO: finsish this
// router.get('/wifi-networks', (req, res, next) => {
//     getWifiList().then( data => {

//         res.status(200).json(data);
//     }).catch( error => res.status())

    
// });

router.post('/', (req, res, next) => {
    fs.writeFile('settings.json', JSON.stringify(req.body), function (err) {
        if (err) throw err;

        let rawdata = fs.readFileSync('settings.json');
        let settings = JSON.parse(rawdata);

        res.status(200).json(settings)
        global.clock.renderTime();
    });
});

module.exports = router;


// TODO: finish this
// async function getWifiList() {
//   try {
//     const { stdout, stderr } = await exec('sudo iwlist wlan0 scan | grep ESSID');

// 	var networks = stdout.split("\n").map( out => out.substring(out.lastIndexOf(":") + 2, out.lastIndexOf("\"")));
// 	networks.pop();      
// 	return networks;
//   }catch (err){
//      console.error(err);
//      return err 
//   };
// };