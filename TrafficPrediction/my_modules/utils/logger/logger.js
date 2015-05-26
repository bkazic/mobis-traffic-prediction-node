﻿var winston = require('winston');
var path = require('path');

//REF: http://tostring.it/2014/06/23/advanced-logging-with-nodejs/

winston.emitErrs = true;
var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: 'file.all',
            level: 'info', 
            filename: './server/logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.File({
            name:'file.error',
            level: 'error', 
            filename: './server/logs/error-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};