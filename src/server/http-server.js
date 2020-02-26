const http = require('http');

/**
 *
 * @param {*} hostname
 * @param {*} port
 */
class HttpServer {
    constructor(hostname, port, requestListener) {
        // Create and start HTTP server.
        const httpServer = http.createServer(requestListener);
        console.log(`Starting HTTP server, host [ ${hostname} ], port [ ${port} ]`);
        httpServer.listen(port, hostname);
        this.httpServer = httpServer;
    }
    closeServer() {
        this.httpServer.close();
    }
}

module.exports = HttpServer;
