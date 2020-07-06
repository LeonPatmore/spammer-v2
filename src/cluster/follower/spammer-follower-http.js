const { SpammerFollower, FollowerAlreadyRunningPerformance } = require('./spammer-follower');
const httpStatus = require('http-status-codes');
const HttpServer = require('../../server/http-server');

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

        this.getRunHandler = res => {
            if (this.hasRun()) {
                res.json({ run_id: this.performanceRunId });
            } else {
                res.status(httpStatus.NOT_FOUND);
            }
            res.end();
        };

        const postRunHandler = (req, res) => {
            try {
                if (req.body.hasOwnProperty('run_id')) {
                    this.startRun(req.body);
                } else {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: 'Field `run_id` is required.',
                    });
                }
            } catch (e) {
                if (e instanceof FollowerAlreadyRunningPerformance) {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: `Follower is already running a performance test with id ${this.performanceRunId}!`,
                    });
                } else {
                    throw e;
                }
            }
            res.end();
        };

        const addLeaderHandler = (req, res) => {
            try {
                if (req.body.hasOwnProperty('socket_address')) {
                    this.connectToLeader(req.body.socket_address, req.body.version);
                } else {
                    res.stauts(httpStatus.BAD_REQUEST).json({
                        error: 'Field `socket_address` is required.',
                    });
                }
            } catch (e) {
                throw e;
            }
            res.end();
        };

        this.httpServer.addGetHandler(`/${SpammerFollower.version}/${SpammerFollowerHttp.runPath}`, this.getRunHandler);
        this.httpServer.addPostHandler(`/${SpammerFollower.version}/${SpammerFollowerHttp.runPath}`, postRunHandler);
        this.httpServer.addPostHandler(
            `/${SpammerFollower.version}/${SpammerFollowerHttp.leader}/${SpammerFollowerHttp.addPath}`,
            addLeaderHandler
        );
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
SpammerFollowerHttp.addPath = 'add';

module.exports = SpammerFollowerHttp;
