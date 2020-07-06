const httpClient = require('../../http/client').getInstance();
const spammerLeaderClients = require('./leader-clients/spammer-leader-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');
const { HttpAwareError } = require('../spammer-http-error-handler');
const httpStatus = require('http-status-codes');

class FollowerAlreadyRunningPerformance extends HttpAwareError {
    constructor(performanceRunId) {
        super(`Performance test already running with ID [ ${performanceRunId} ]`);
        this.performanceRunId = performanceRunId;
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class SpammerFollower {
    /**
     * Construct an instance of a Spammer follower.
     * @param {string} initialLeaderSocketAddress   If provided, follower will try to make an initial connection to the Spammer host.
     * @param {string} initialLeaderVersion         If provided, will use this version as the inital leader's version. If initialLeaderSocketAddress is not provided, then this variable is not used.
     */
    constructor(initialLeaderSocketAddress, initialLeaderVersion) {
        this.performanceRunId = null;
        this.uuid = uuidv4();
        logger.info(`Starting follower with ID [ ${this.uuid} ]`);
        if (this.initialLeaderSocketAddress != null) {
            this.connectToLeader(initialLeaderSocketAddress, initialLeaderVersion);
        }
    }

    /**
     * Returns true if we are already running a performance test, else false.
     */
    hasRun() {
        return this.performanceRunId != null;
    }

    /**
     * Starts a performance run given the config.
     * @param {object} runConfig    The run configuration object.
     */
    startRun(runConfig) {
        if (this.hasRun()) {
            throw new FollowerAlreadyRunningPerformance(this.performanceRunId);
        }
        this.performanceRunId = runConfig.run_id;
    }
}

SpammerFollower.version = 'v1';

module.exports = { SpammerFollower, FollowerAlreadyRunningPerformance };
