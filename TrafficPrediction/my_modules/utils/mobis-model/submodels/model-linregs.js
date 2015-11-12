﻿var qm = require('qminer');
var analytics = qm.analytics;
var logger = require("../../logger/logger.js");
var path = require('path');

createLinRegModels = function (fields, horizons, ftrSpace) {
    // create set of linear regression models 
    var linregs = []; // this will be array of objects
    for (var field in fields) { // models for prediction fields
        linregs[field] = [];
        linregs[field]["Model"] = { "field": fields[field].field.name };
        for (var horizon in horizons) { // models for horizons
            linregs[field][horizon] = [];
            linregs[field][horizon]["Model"] = { "horizon": horizons[horizon] };
            for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
                linregs[field][horizon][workIdx] = [];
                linregs[field][horizon][workIdx]["Model"] = { "WorkingDay": Boolean(workIdx) }
                for (var hourIdx = 0; hourIdx < 24; hourIdx++) { // 24 models: for every hour in day
                    linregs[field][horizon][workIdx][hourIdx] = new analytics.RecLinReg({ "dim": ftrSpace.dim, "forgetFact": 1, "regFact": 10000 });
                    linregs[field][horizon][workIdx][hourIdx]["predictionField"] = fields[field].field.name;
                    linregs[field][horizon][workIdx][hourIdx]["horizon"] = horizons[horizon];
                    linregs[field][horizon][workIdx][hourIdx]["workingDay"] = workIdx; // asign new field "workingDay" to model (just for demonstrational use)
                    linregs[field][horizon][workIdx][hourIdx]["forHour"] = hourIdx; // asign new field "forHour" to model (just for demonstrational use)
                    linregs[field][horizon][workIdx][hourIdx]["updateCount"] = 0; // how many times model was updated (just for demonstrational use)
                }
            }
        }
    }
    return linregs;
};

// save buffer state
saveState = function (linregs, fields, horizons, dirName) {
    // check if dirName exists, if not, create it
    if (!qm.fs.exists(dirName)) qm.fs.mkdir(dirName);
    
    // write all states to fout
    for (var fieldIdx in fields) {
        for (var horizonIdx in horizons) {
            for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
                for (var hourIdx = 0; hourIdx < 24; hourIdx++) {
                    var linreg = linregs[fieldIdx][horizonIdx][workIdx][hourIdx];
                    var name = "linreg_" + fields[fieldIdx].field.name + "_horizon" + 
                        horizons[horizonIdx] + "_work" + workIdx + "_hour" + hourIdx;
                    var filePath = path.join(dirName, name);
                    var fout = qm.fs.openWrite(filePath);
                    linreg.save(fout);
                    fout.close();
                }
            }
        }
    }
    logger.info('Saved regression model states')
};

// load buffer state
loadState = function (linregs, fields, horizons, dirName) {
    // write all states to fout
    for (var fieldIdx in fields) {
        for (var horizonIdx in horizons) {
            for (var workIdx = 0; workIdx < 2; workIdx++) { // 2 models: working day or not
                for (var hourIdx = 0; hourIdx < 24; hourIdx++) {
                    //var linreg = linregs[fieldIdx][horizonIdx][workIdx][hourIdx];
                    var name = "linreg_" + fields[fieldIdx].field.name + "_horizon" + 
                        horizons[horizonIdx] + "_work" + workIdx + "_hour" + hourIdx;
                    var filePath = path.join(dirName, name);
                    var fin = new qm.fs.FIn(filePath); // TODO
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx] = new analytics.RecLinReg(fin);
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx]["predictionField"] = fields[fieldIdx].field.name;
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx]["horizon"] = horizons[horizonIdx];
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx]["workingDay"] = workIdx; // asign new field "workingDay" to model (just for demonstrational use)
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx]["forHour"] = hourIdx; // asign new field "forHour" to model (just for demonstrational use)
                    linregs[fieldIdx][horizonIdx][workIdx][hourIdx]["updateCount"] = 99; // how to load this??
                    fin.close();
                }
            }
        }
    }
    logger.info('Loaded regression model states')
};

exports.create = createLinRegModels;
exports.save = saveState;
exports.load = loadState;