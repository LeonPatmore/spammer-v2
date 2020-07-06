const { SpammerFollower, FollowerAlreadyRunningPerformance } = require('./spammer-follower');
const httpStatus = require('http-status-codes');
const HttpServer = require('../../server/http-server');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');

class SpammerFollowerHttp extends SpammerFollower {
    /**
     * Create a Spammer follower instance exposed via HTTP.
     * @param {String}     hostname                     Hostname to bind the server to.
     * @param {Int32Array} port                         Port to bind the server to.
     * @param {string}     initialLeaderSocketAddress   If provided, follower will try to make an initial connection to the Spammer host.
     * @param {string}     initialLeaderVersion         If provided, will use this version as the inital leader's version. If initialLeaderSocketAddress is not provided, then this variable is not used.
     */
    constructor(hostname, port, initialLeaderSocketAddress, initialLeaderVersion) {
        super(initialLeaderSocketAddress, initialLeaderVersion);
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
                if (req.body.hasOwnProperty('run_id')) {
                    this.startRun(req.body);
                } else {
                    throw new InvalidParamErrorBuilder()
                        .withInvalidParam('run_id', InvalidParamErrorBuilder.missing)
                        .build();
                }
            } catch (e) {
                next(e);
            }
            res.end();
        };

        this.httpServer.addGetHandler(`/${SpammerFollower.version}/${SpammerFollowerHttp.runPath}`, getRunHandler);
        this.httpServer.addPostHandler(`/${SpammerFollower.version}/${SpammerFollowerHttp.runPath}`, postRunHandler);
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
SpammerFollowerHttp.leaderPath = 'leader';

module.exports = SpammerFollowerHttp;
