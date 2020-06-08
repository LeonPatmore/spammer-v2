/**
 * A class which represents the server of a cluster host.
 */

const HttpServer = require('./../../server/http-server');
const RemoteHost = require('./remote-host');
const httpStatus = require('http-status-codes');
const { SpammerHostManager, ClientIdAlreadyLinked } = require('./spammer-host-manager');
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
        this.httpServer.addPostHandler('/hello', (req, res) => {
            res.status(httpStatus.ACCEPTED).end();
        });
        this.httpServer.addPostHandler('/v1/connect', (req, res) => {
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
        });
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

module.exports = SpammerHostServer;
