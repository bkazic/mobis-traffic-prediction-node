﻿var logger = require("../../my_modules/utils/logger/logger.js");

// Constructor
function ServiceHandler(trafficPrediction, app) {
    this.getBase = function () { return trafficPrediction.base; };
    this.gettrafficPrediction = function () { return trafficPrediction };
    this.app = app;
}

// get router paths
ServiceHandler.prototype.handleGetRouterPaths = function (req, res) {
    var routerPaths = [];
    var test = this.app;
    
    if (this.getBase().mode === "backup") { 
        res.status(205).json({ message: "System is backing up. Please try later." });
    }

    this.app._router.stack.forEach(function (item) {
        if (item.route != undefined) {
            routerPaths.push({ "path": item.route.path, "methods": item.route.methods });
        }
    });
    res.json(routerPaths);
}

// close Base
ServiceHandler.prototype.handleCloseBase = function (req, res) {
    try {
        this.getBase().close();
        res.status(200).json({ message: "Base closed" });
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is allready closed" });
            logger.warn("Cannot close Base. Base is allready closed.");
        }
        else {
            res.status(500).json({ error: "Something went wrong when closing Base." });
            logger.error(err.stack);
        }
    }
}

// close Base
ServiceHandler.prototype.handleBackup = function (req, res) {
    try {
        this.gettrafficPrediction().backup(true);
        res.status(200).json({ message: "Backup created" });
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
        }
    }
}

// Returns list of all store names
ServiceHandler.prototype.handleGetStoreList = function (req, res) {
    try {
        var storeList = this.getBase().getStoreList().map(function (store) { return store.storeName });
        res.status(200).json(storeList);
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!");
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
        }
    }
}


ServiceHandler.prototype.handleGetStoreRecs = function (req, res) {
    var storeName = req.params.store; // TODO: try cath
    var limit = (typeof req.query.limit === 'undefined') ? 10 : parseInt(req.query.limit);
    if (isNaN(limit)) res.status(400).json({ error: "Parameter '" + req.query.limit + "' is not valid" })    
    
    try {
        var thisStore = this.getBase().store(storeName);
        // check if store was found
        if (thisStore == null) {
            logger.warn("Store with name %s was not found.", storeName); console.log()
            res.status(400).send({ error: "Store with name " + storeName + " was not found." });
            return;
        }
        
        var offset = thisStore.length - limit;
        offset = (offset > 0) ? offset : 0   // in case offset is negative, set it to 0. Otherwise program crashes.
        var recs = thisStore.allRecords.trunc(limit, offset).reverse().toJSON(true, true);
        
        // check if any record was found
        if (recs['$hits'] === 0) {
            res.status(400).json({ error: "No records found" });
            logger.warn("No records found"); console.log();
            return;
        }
        
        res.status(200).json(recs['records'])
    }
    catch (err) {
        if (typeof err.message != 'undefined' && err.message == "[addon] Exception: Base is closed!") {
            res.status(500).json({ error: "Base is closed!" });
            logger.warn("Cannot execute. Base is closed!"); console.log();
        }
        else {
            res.status(500).json({ error: "Internal Server Error" });
            logger.error(err.stack);
        }
    }
}
module.exports = ServiceHandler;