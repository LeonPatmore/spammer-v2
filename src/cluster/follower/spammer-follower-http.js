const { SpammerFollower } = require('./spammer-follower');
const HttpServer = require('../../server/http-server');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');
const logger = require('../../logger/logger');

class SpammerFollowerHttp extends SpammerFollower {
    /**
     * Create a Spammer follower instance exposed via HTTP.
     * @param {String}     hostname                     Hostname to bind the server to.
     * @param {Int32Array} port                         Port to bind the server to.
     * @param {JobsHandledPersistence} jobsHandledPersistence
     * @param {String}     initialLeaderSocketAddress   [Optional] A leader socket address to automatically connect to.
     * @param {String}     initialLeaderVersion         [Optional] A leader version.
     */
    constructor(hostname, port, jobsHandledPersistence, initialLeaderSocketAddress, initialLeaderVersion) {
        super(jobsHandledPersistence, initialLeaderSocketAddress, initialLeaderVersion);
        this.httpServer = new HttpServer(hostname, port);

        this.httpServer.addPostHandler(
            `/${SpammerFollowerHttp.version}/${SpammerFollowerHttp.connectPath}`,
            async (req, res, next) => {
                try {
                    if (!req.body.hasOwnProperty('socket_address')) {
                        throw new InvalidParamErrorBuilder()
                            .withInvalidParam('socket_address', InvalidParamErrorBuilder.missing)
                            .build();
                    }
                    await this.addLeader(req.body.socket_address);
                } catch (e) {
                    logger.info(e.message);
                    next(e);
                }
                res.end();
            }
        );
        this.httpServer.addDeleteHandler(
            `/${SpammerFollowerHttp.version}/${SpammerFollowerHttp.leaderPath}/:uuid`,
            (req, res, next) => {
                try {
                    const uuid = req.params.uuid;
                    this.removeLeader(uuid);
                } catch (e) {
                    logger.info(e.message);
                    next(e);
                }
                res.end();
            }
        );
        this.httpServer.addErrorHandler(spammerErrorHandler);
    }

    /**
     * Close the spammer follower.
     */
    async close() {
        super.close();
        await this.httpServer.closeServer();
    }
}

SpammerFollowerHttp.connectPath = 'connect';
SpammerFollowerHttp.leaderPath = 'leader';

module.exports = SpammerFollowerHttp;
