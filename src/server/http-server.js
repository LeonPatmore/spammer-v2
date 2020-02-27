const http = require('http');

class HttpServer {
    /**
     * Create a HTTP server.
     * @param {*} hostname Hostname to bind the server to.
     * @param {*} port Port to bind the server to.
     * @param {*} requestListener A request listener function to handle requests.
     */
    constructor(hostname, port, requestListener) {
        // Create and start HTTP server.
        const httpServer = http.createServer(requestListener);
        console.log(`Starting HTTP server, host [ ${hostname} ], port [ ${port} ]`);
        httpServer.listen(port, hostname);
        this.httpServer = httpServer;
    }

    /**
     * Close the HTTP server.
     */
    closeServer() {
        this.httpServer.close();
    }
}

module.exports = HttpServer;
