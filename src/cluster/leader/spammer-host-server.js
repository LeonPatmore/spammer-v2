/**
 * A class which represents the server of a cluster host.
 */

const HttpServer = require('../../server/http-server');
const RemoteHost = require('./remote-host');
const httpStatus = require('http-status-codes');
const { SpammerHostManager, ClientIdAlreadyLinked } = require('./spammer-leader-manager');
const logger = require('../../logger/application-logger');

class SpammerHostServer {
    /**
     * Create an instance of the Spammer server as a host.
     * @param {string} hostname                         The hostname of the server.
     * @param {Int16Array} port                         The port of the server.
     * @param {SpammerHostManager} spammerHostManager   The spammer host manager instance.
     */
    constructor(hostname, port, spammerHostManager) {
        this.httpServer = new HttpServer(hostname, port);
        logger.info(`${SpammerHostServer.apiVersion}/${SpammerHostServer.connectPath}`);
        logger.info(`${this.apiVersion}/${this.connectPath}`);

        // Connect endpoint.
        this.httpServer.addPostHandler(
            `/${SpammerHostServer.apiVersion}/${SpammerHostServer.connectPath}`,
            (req, res) => {
                if (!req.body.hasOwnProperty('uuid')) {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: 'Field `uuid` is required.',
                    });
                } else if (!req.body.hasOwnProperty('socket_address')) {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: 'Field `socket_address` is required.',
                    });
                } else {
                    try {
                        spammerHostManager.addRemoteHost(new RemoteHost(req.body.socket_address, req.body.uuid));
                    } catch (e) {
                        if (e instanceof ClientIdAlreadyLinked) {
                            res.status(httpStatus.BAD_REQUEST).json({
                                error: 'Client ID already linked.',
                            });
                        } else {
                            throw e;
                        }
                    }
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
        this.httpServer.addGetHandler(
            `/${SpammerHostServer.apiVersion}/${SpammerHostServer.clientPath}`,
            (_req, res) => {
                res.status(httpStatus.OK)
                    .json(remoteHostsToJson(spammerHostManager.remoteHosts))
                    .end();
            }
        );
    }
    /**
     * Close the Spammer server.
     */
    closeServer() {
        this.httpServer.closeServer();
    }
}

SpammerHostServer.apiVersion = 'v1';
SpammerHostServer.connectPath = 'connect';
SpammerHostServer.clientPath = 'clients';

module.exports = SpammerHostServer;
