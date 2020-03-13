const express = require('express');
const expressPinoLogger = require('express-pino-logger');
const logger = require('../logger/application-logger');

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
        this.express.use(expressPinoLogger());
        this.httpServer = this.express.listen(port, hostname);
    }

    /**
     * Alias for express handler.
     */
    get handler() {
        return this.express;
    }

    /**
     * Close the HTTP server.
     */
    closeServer() {
        this.httpServer.close();
    }
}

module.exports = HttpServer;
