const leaderEvents = require('../leader-events');
const http = require('http');
const WebSocketServer = require('websocket').server;
const emitter = require('../../../events/event-bus');

class SpammerLeaderWebSocket {
    constructor() {
        this.server = http.createServer();
        // TODO: Make port dynamic.
        this.server.listen(13402);
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
        });
        emitter.on(leaderEvents.UPDATE_FOLLOWERS, followers => {
            this.wsServer.emit(leaderEvents.UPDATE_FOLLOWERS, { followers });
        });
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

module.exports = SpammerLeaderWebSocket;
