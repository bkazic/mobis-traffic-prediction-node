﻿//var qm = require('qminer');
var qm = require('../../../../cpp/QMiner/index.js');
var TrafficPrediction = require('./TrafficPrediction.js');
var path = require('path');
var logger = require("./my_modules/utils/logger/logger.js");

var trafficPrediction = new TrafficPrediction();

// create Base in CLEAN CREATE mode
function cleanCreateMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    base["mode"] = 'cleanCreate'

    // Init traffic prediction work flow
    trafficPrediction.init(base); //Initiate the traffic prediction workflow
    
    return base;
}

// create Base in OPEN mode
function openMode() {
    var base = new qm.Base({
        mode: 'open',
        dbPath: path.join(__dirname, './db') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    base["mode"] = 'open'

    //Initiate the traffic prediction workflow
    trafficPrediction.init(base); 
    
    // load saved models
    trafficPrediction.loadState();

    return base;
}

// create Base in READ ONLY mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: path.join(__dirname, './db')
    })
    base["mode"] = 'openReadOnly'
    
    //Initiate the traffic prediction workflow
    trafficPrediction.init(base);
    
    // load saved models
    trafficPredcition.loadState(); 
    
    return base;
}

// create Base in OPEN FROM BACKUP mode
function openFromBackup() {
    //qm.delLock() // not sure yet if this will be necessary
    var base = new qm.Base({
        mode: 'open',
        dbPath: path.join(__dirname, './backup') //If the code is copied in terminal, this has to commented out, since __dirname is not known from terminal
    })
    base["mode"] = 'openFromBackup'
    
    //Initiate the traffic prediction workflow
    trafficPrediction.init(base);
    
    // load saved models
    trafficPrediction.loadState(path.join(__dirname, './backup'));
    
    return base;
}

// create Base in CLEAN CREATE mode and load init data
function cleanCreateLoadMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    base["mode"] = 'cleanCreateLoad'
    
    // Init traffic prediction work flow
    trafficPrediction.init(base); //Initiate the traffic prediction workflow

    // Import initial data
    logger.info("Training models...")
    //qm.load.jsonFile(base.store("rawStore"), "./sandbox/data1.json ");
    ////trafficPrediction.importData("./sandbox/measurements_0011_11.txt")
    ////trafficPrediction.importData("./sandbox/measurements_9_sens_3_mon.txt")
    //trafficPrediction.importData("./sandbox/measurements3sensors3months.txt")
    //trafficPrediction.importData("./sandbox/chunk1measurements3sensors3months.txt") // Small chuck of previous (from march on).
    //trafficPrediction.importData("./sandbox/measurements_obvoznica.txt")
    trafficPrediction.importData("./sandbox/measurements_obvoznica_lite.txt")
    //trafficPrediction.importData("./sandbox/data-small.json")

    return base;
}

// function that handles in which mode store should be opened
function start(mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode,
        'openFromBackup': openFromBackup
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        modeOptions = [];
        for (option in modes) { 
            modeOptions.push(option);    
        }

        throw new Error("Base mode '" + mode + "' does not exist! Use one of this: " + modeOptions.toString())
    }
    
    // run appropriate function
    var base = modes[mode]();
    
    //// schedule backuping and partialFlush-ing
    //setInterval(function () { base.partialFlush() }, 5000);
    //setInterval(function () { trafficPrediction.backup(true) }, 5000);

    // create backup before running server
    trafficPrediction.backup(true);

    logger.info("\x1b[32m[Model] Service started in '%s' mode\n\x1b[0m", mode);
    
    return trafficPrediction.base; 
}

exports.start = start;