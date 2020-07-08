const express = require('express');
const expressPinoLogger = require('express-pino-logger');
const logger = require('../logger/application-logger');
const expressPing = require('express-ping');

class HttpServer {
    /**
     * Create a HTTP server.
     * @param {String}     hostname Hostname to bind the server to.
     * @param {Int32Array} port     Port to bind the server to.
     */
    constructor(hostname, port) {
        // Create and start HTTP server.
        logger.info(`Starting HTTP server, host [ ${hostname} ], port [ ${port} ]`);
        this.express = express();
        this.express.use(express.json());
        this.express.use(expressPinoLogger());
        this.express.use(expressPing.ping());
        this.httpServer = this.express.listen(port, hostname);
    }

    addErrorHandler(errorHandler) {
        this.express.use(errorHandler);
    }

    /**
     * Add a get handler to the server.
     * @param {string} path
     * @param {Function} handlerFunction
     */
    addGetHandler(path, handlerFunction) {
        this.express.get(path, handlerFunction);
    }

    /**1
     * Add a post handler to the server.
     * @param {string} path
     * @param {Function} handlerFunction
     */
    addPostHandler(path, handlerFunction) {
        this.express.post(path, handlerFunction);
    }

    /**
     * Close the HTTP server.
     */
    closeServer() {
        this.httpServer.close();
    }
}

module.exports = HttpServer;
