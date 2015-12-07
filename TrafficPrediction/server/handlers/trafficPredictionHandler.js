﻿var logger = require("../../my_modules/utils/logger/logger.js");


// Constructor
var TrafficPredictionHandler = function (trafficPrediction) {
    this.getBase = function () { return trafficPrediction.base; };
}


// Returns list of all store names
TrafficPredictionHandler.prototype.handleGetStoreList = function (req, res) {
    try {
        var storeList = this.getBase().getStoreList().map(function (store) { return store.storeName });
        res.status(200).json(storeList);
    }
    catch (err) {
        handleBaseClosedError(err, req, res);
    }
}


// Returns sensor id stores
TrafficPredictionHandler.prototype.handleGetSensors = function (req, res) {
    try {
        res.status(200).json(this.getBase().store("CounterNode").allRecords.toJSON().records);
    }
    catch (err) {
        handleBaseClosedError(err, req, res);
    }
}


// Returns traffic prediction from all sensors
TrafficPredictionHandler.prototype.handleGetTrafficPredictions = function (req, res) {
    var recs = [];
    var base = this.getBase();
    try {
        base.getStoreList().forEach(function (storeNm) {
            if (storeNm.storeName.indexOf("resampledStore") != -1) {
                var store = base.store(storeNm.storeName);
                if (store.last != null) {
                    recs.push(store.last.toJSON(true, true))
                }
            }
        });
        res.status(200).json(recs);
    }
    catch (err) {
        handleBaseClosedError(err, req, res);
    }
}


// Returns traffic prediction for specific sensor (params.id)
TrafficPredictionHandler.prototype.handleGetTrafficPredictionsById = function (req, res) {
    var id = req.params.id;
    id = id.replace("-", "_");

    try {
        var thisStore = this.getBase().store("resampledStore_" + id);
        // check if store exists
        if (thisStore == null) {
            logger.warn("Store with id %s was not found.", id);
            res.status(400).json({ error: 'Store with id ' + id + ' was not found.' } );
            return;
        }
        
        // check if store has any records
        if (thisStore.last == null) {
            logger.warn('No records were found for store with id %s', id);
            res.status(400).json({ error: 'No records were found for store with id ' + id } );
            return;
        }
        
        // retrun last rec if size is not defined, else create array
        if (typeof req.query.size === 'undefined') {
            res.status(200).json(thisStore.last.toJSON(true, true));
        } 
        else {
            var size = parseInt(req.query.size); // TODO: try carch for parsing
            if (isNaN(size)) res.status(400).json({error: "Parameter '" + req.query.size + "' is not valid"})    

            var offset = thisStore.length - size;
            offset = (offset > 0) ? offset : 0   // in case offset is negative, set it to 0. Otherwise program crashes.
            var recs = thisStore.allRecords.trunc(size, offset).reverse().toJSON(true, true);

            // check if any record was found
            if (recs['$hits'] === 0) {
                res.status(400).json({ error: "No records found" });
                logger.warn("No records found"); console.log();
                return;
            }
            
            res.status(200).json(recs['records'])
        }
    }
    catch (err) {
        handleBaseClosedError(err, req, res);
    }
}

// Handle add measurement request
TrafficPredictionHandler.prototype.handleAddMeasurement = function (req, res) {
    // If you want to test from Simple REST Client, make sure you add in headers: Content-Type: application/json
    var rec = req.body;
    logger.debug("Recieved new record: " + JSON.stringify(req.body));

    // Check for empty records.
    if (Object.keys(rec).length == 0) {
        logger.warn("Recieved empty record. It will not be stored.");
        res.status(400).json({ error: "Recieved empty record. It will not be stored." }).end();
        return;
    }
    
    // Check if imputor has reached the end 
    if (req.body.message && req.body.message.indexOf("[IMPUTOR]") != -1) {
        logger.info(req.body.message);
        res.status(200).json({ message: "OK" }).end();
        return;
    }
    
    // Extract id
    try {
        id = rec.measuredBy.Name.replace("-", "_");
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message.indexOf("Cannot read property") != -1) {
            res.status(500).json({ error: "Record does not include property \"measuredBy\"" }).end();
            logger.error("Record does not include property \"measuredBy\", from which the ID of the store can be found.");
            return;
        }
        else {
            res.status(500).json({ error: "Internal Server Error" }).end();
            logger.error(err.stack);
        }
    }
    // Find proper store
    var storeName = "trafficStore_" + id;
    trafficStore = this.getBase().store(storeName);
    if (trafficStore == null) {
        logger.warn("Store with name %s was not found. Cannot add record.", storeName);
        res.status(500).json({error: "Store with name " + storeName + " was not found. Cannot add record."}).end();
        return;
    }
    
    // Try to add record to store
    try {
        var id = trafficStore.push(rec);
    }
    catch (err) {
        res.status(500).json({ error: "Internal Server Error" }).end();
        logger.error(err.stack);
    }
    
    // Check if record was stored sucessfully
    if (id == -1 || trafficStore[id] == null) {
        logger.error("Record was not stored");
        res.status(400).json({ error: 'Record not stored!' }).end()
        return;
    }
    
    logger.debug("Record stored into store %s. Store length: %s ", trafficStore.name, trafficStore.length);
    logger.info("New record was stored into store %s. Record: %s", trafficStore.name, JSON.stringify(req.body));
    res.status(200).json({message: "OK"}).end();
}

var handleBaseClosedError = function (err, req, res) {
    if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
        res.status(500).json({ error: "Base is closed!" });
        logger.warn("Cannot execute. Base is closed!");
    }
    else {
        res.status(500).json({ error: "Internal Server Error" });
        logger.error(err.stack);
    }
}

module.exports = TrafficPredictionHandler;