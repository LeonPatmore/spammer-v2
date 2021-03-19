const express = require('express');
const expressPinoLogger = require('express-pino-logger');
const logger = require('../logger/application-logger');
const expressPing = require('express-ping');
const bodyParser = require('body-parser');
const cors = require('cors');

class HttpServer {
    /**
     * Create a HTTP server.
     * @param {String}     hostname Hostname to bind the server to.
     * @param {Int32Array} port     Port to bind the server to.
     */
    constructor(hostname, port, ignoredPaths) {
        logger.info(`Starting HTTP server, host [ ${hostname} ], port [ ${port} ]`);
        this.express = express();
        this.express.use(express.json());
        this.express.use(cors());
        this.express.use(
            expressPinoLogger({
                autoLogging: {
                    ignorePaths: ignoredPaths,
                },
            })
        );
        this.express.use(expressPing.ping());
        this.express.use(bodyParser.text({ type: 'application/javascript' }));
        this.httpServer = this.express.listen(port, hostname);
    }

    /**
     * Add a error handler to the server.
     * @param {Function} errorHandler
     */
    addErrorHandler(errorHandler) {
        this.express.use(errorHandler);
    }

    /**
     * Add a get handler to the server.
     * @param {string}   path
     * @param {Function} handlerFunction
     */
    addGetHandler(path, handlerFunction) {
        this.express.get(path, handlerFunction);
    }

    /**
     * Add a post handler to the server.
     * @param {string}   path
     * @param {Function} handlerFunction
     */
    addPostHandler(path, handlerFunction) {
        this.express.post(path, handlerFunction);
    }

    /**
     * Add a put handler to the server.
     * @param {string}   path
     * @param {Function} handlerFunction
     */
    addPutHandler(path, handlerFunction) {
        this.express.put(path, handlerFunction);
    }

    /**
     * Add a delete handler to the server.
     * @param {string}   path
     * @param {Function} handlerFunction
     */
    addDeleteHandler(path, handlerFunction) {
        this.express.delete(path, handlerFunction);
    }

    /**
     * Close the HTTP server.
     */
    async closeServer() {
        await new Promise((resolve, reject) => {
            this.httpServer.close(err => {
                if (err) return reject(data);
                resolve();
            });
        });
    }
}

module.exports = HttpServer;
