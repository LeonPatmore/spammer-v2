const { SpammerFollower, RunIdIsNullError } = require('./spammer-follower');
const httpStatus = require('http-status-codes');
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

        const getRunHandler = (_, res) => {
            if (this.hasRun()) {
                res.json({ run_id: this.performanceRunId });
            } else {
                res.status(httpStatus.NOT_FOUND);
            }
            res.end();
        };

        const postRunHandler = (req, res, next) => {
            try {
                const invalidParamErrorBuilder = new InvalidParamErrorBuilder();
                if (!req.body.hasOwnProperty('config'))
                    invalidParamErrorBuilder.withInvalidParam('config', InvalidParamErrorBuilder.missing);
                if (!req.body.hasOwnProperty('run_id'))
                    invalidParamErrorBuilder.withInvalidParam('run_id', InvalidParamErrorBuilder.missing);
                invalidParamErrorBuilder.throwIfInvalidParams();
                this.startRun(req.body.run_id, req.body.delay_ms, req.body.config);
            } catch (e) {
                if (e instanceof RunIdIsNullError)
                    throw new InvalidParamErrorBuilder()
                        .withInvalidParam('run_id', InvalidParamErrorBuilder.notNull)
                        .build();
                next(e);
            }
            res.end();
        };

        const connectionHandler = async (req, res, next) => {
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
        };

        this.httpServer.addGetHandler(`/${SpammerFollowerHttp.version}/${SpammerFollowerHttp.runPath}`, getRunHandler);
        this.httpServer.addPostHandler(
            `/${SpammerFollowerHttp.version}/${SpammerFollowerHttp.runPath}`,
            postRunHandler
        );
        this.httpServer.addPostHandler(
            `/${SpammerFollowerHttp.version}/${SpammerFollowerHttp.connectPath}`,
            connectionHandler
        );
        this.httpServer.addErrorHandler(spammerErrorHandler);
    }

    /**
     * Close the spammer follower.
     */
    close() {
        this.httpServer.closeServer();
    }
}

SpammerFollowerHttp.runPath = 'run';
SpammerFollowerHttp.connectPath = 'connect';

module.exports = SpammerFollowerHttp;
