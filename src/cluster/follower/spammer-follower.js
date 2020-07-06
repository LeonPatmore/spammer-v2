const httpClient = require('../../http/client').getInstance();
const spammerLeaderClients = require('./leader-clients/spammer-leader-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');

class CannotConnectToLeader extends Error {
    constructor(leaderUrl) {
        this.leaderUrl = leaderUrl;
        this.message = `Can not connect to Spammer leader with URL ${leaderUrl}`;
    }
}

class FollowerAlreadyRunningPerformance extends Error {
    constructor(performanceRunId) {
        super();
        this.performanceRunId = performanceRunId;
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
     * Connect to a Spammer leader.
     * @param {string} leaderSocketAddress  The socket address of the Spammer leader.
     * @param {string} version              The version of the Spammer leader.
     */
    async connectToLeader(leaderSocketAddress, version) {
        if (!version) {
            // If not leader version is given, default to the version of the follower.
            logger.debug(`No version has been provided, defaulting to version [] ${SpammerFollower.version} ]`);
            version = SpammerFollower.version;
        }
        logger.info(
            `Trying to connect to leader with socket address [ ${leaderSocketAddress} ] and version [ ${version} ]`
        );
        if (!version in spammerLeaderClients) {
            throw new Error(`No known client for leader version [ ${version} ]`);
        }
        await spammerLeaderClients[version].connectToLeader(this.uuid, leaderSocketAddress);
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

module.exports = { SpammerFollower, FollowerAlreadyRunningPerformance, CannotConnectToLeader };
