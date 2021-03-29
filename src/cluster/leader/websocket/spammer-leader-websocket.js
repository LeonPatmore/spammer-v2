const leaderEvents = require('../leader-events');
const http = require('http');
const WebSocketServer = require('websocket').server;
const emitter = require('../../../events/event-bus');
const logger = require('../../../logger/application-logger');

class SpammerLeaderWebSocket {
    constructor(onNewConnection) {
        this.server = http.createServer();
        this.server.listen(SpammerLeaderWebSocket.port, '0.0.0.0');
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
        });
        emitter.on(leaderEvents.UPDATE_FOLLOWERS, followers => {
            this.wsServer.broadcastUTF(JSON.stringify({ followers }));
        });
        logger.info(`Started web socket on port [ ${SpammerLeaderWebSocket.port} ]`);

        this.wsServer.on('request', request => {
            if (SpammerLeaderWebSocket.allowedOrigin(request.origin)) {
                const connection = request.accept(null, request.origin);

                connection.on('message', function(message) {
                    logger.info('Received new message! ' + message);
                });

                connection.on('close', () => {
                    logger.info(`Closing WS connection to origin [ ${connection.origin} ]`);
                });

                logger.info(`Accepted WS connection from origin [ ${request.origin} ]`);
                onNewConnection(connection);
            } else {
                request.reject();
                logger.warn(`Rejected WS connection from origin [ ${request.origin} ]`);
            }
        });
    }

    static allowedOrigin(origin) {
        return true;
    }

    async close() {
        this.wsServer.closeAllConnections();
        this.wsServer.shutDown();
        await new Promise((resolve, reject) => {
            this.server.close(err => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

// TODO: Make port configurable.
SpammerLeaderWebSocket.port = 13402;

module.exports = SpammerLeaderWebSocket;
