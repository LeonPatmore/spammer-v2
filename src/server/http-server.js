const Express = require('express');

class HttpServer {
    /**
     * Create a HTTP server.
     * @param {*} hostname Hostname to bind the server to.
     * @param {*} port Port to bind the server to.
     */
    constructor(hostname, port) {
        // Create and start HTTP server.
        console.log(`Starting HTTP server, host [ ${hostname} ], port [ ${port} ]`);
        this.express = Express();
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
