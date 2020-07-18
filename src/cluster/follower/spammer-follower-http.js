const { SpammerFollower, RunIdIsNullError } = require('./spammer-follower');
const HttpServer = require('../../server/http-server');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');

class SpammerFollowerHttp extends SpammerFollower {
    /**
     * Create a Spammer follower instance exposed via HTTP.
     * @param {String}     hostname Hostname to bind the server to.
     * @param {Int32Array} port     Port to bind the server to.
     */
    constructor(hostname, port) {
        super();
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
    close() {
        super.close();
        this.httpServer.closeServer();
    }
}

SpammerFollowerHttp.connectPath = 'connect';

module.exports = SpammerFollowerHttp;
