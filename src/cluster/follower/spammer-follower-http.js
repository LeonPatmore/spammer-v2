const { SpammerFollower } = require('./spammer-follower');
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

module.exports = SpammerFollowerHttp;
