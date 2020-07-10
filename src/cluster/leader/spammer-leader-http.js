const HttpServer = require('../../server/http-server');
const httpStatus = require('http-status-codes');
const { SpammerLeader } = require('./spammer-leader');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');

class SpammerLeaderHttp extends SpammerLeader {
    /**
     * Create an instance of the Spammer server as a host.
     * @param {string} hostname The hostname of the server.
     * @param {Int16Array} port The port of the server.
     */
    constructor(hostname, port) {
        super();
        this.httpServer = new HttpServer(hostname, port);

        // Connect endpoint.
        this.httpServer.addPostHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.connectPath}`,
            async (req, res, next) => {
                try {
                    if (!req.body.hasOwnProperty('socket_address')) {
                        throw new InvalidParamErrorBuilder()
                            .withInvalidParam('socket_address', InvalidParamErrorBuilder.missing)
                            .build();
                    }
                    await this.addFollower(req.body.socket_address, req.body.version);
                } catch (e) {
                    next(e);
                }
                res.end();
            }
        );

        /**
         * Converts a map of remote hosts into a JSON.
         * @param {Map} remoteHosts
         */
        function remoteHostsToJson(remoteHosts) {
            const clientObjs = [];
            remoteHosts.forEach(value => {
                clientObjs.push(value);
            });
            return { clients: clientObjs };
        }

        // Clients endpoint.
        this.httpServer.addGetHandler(`/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.clientPath}`, (_, res) => {
            res.status(httpStatus.OK)
                .json(remoteHostsToJson(this.connectedFollowers))
                .end();
        });

        this.httpServer.addPostHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performancePath}`,
            async (req, res, next) => {
                try {
                    await this.startPerformanceTest(req.body);
                } catch (e) {
                    next(e);
                }
                res.end();
            }
        );

        this.httpServer.addErrorHandler(spammerErrorHandler);
    }

    /**
     * Close all resources.
     */
    close() {
        super.close();
        this.httpServer.closeServer();
    }
}

SpammerLeaderHttp.connectPath = 'connect';
SpammerLeaderHttp.clientPath = 'clients';
SpammerLeaderHttp.performancePath = 'performance';

module.exports = SpammerLeaderHttp;
