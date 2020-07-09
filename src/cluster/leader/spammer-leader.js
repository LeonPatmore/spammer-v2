/**
 *  Logic for leading the cluster of Spammers.
 */

const logger = require('../../logger/application-logger');
const httpStatus = require('http-status-codes');
const uuid = require('uuid').v4;
const { HttpAwareError } = require('../spammer-http-error-handler');
const spammerFollowerClients = require('./follower-clients/spammer-follower-clients');

class FollowerIdAlreadyLinked extends HttpAwareError {
    /**
     * @param {string} linkedId  The ID of the client which is already linked.
     */
    constructor(linkedId) {
        super(`Follower with ID [ ${linkedId} ] is already linked!`);
        this.linkedId = linkedId;
    }

    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class FollowerVersionNotSupportedError extends HttpAwareError {
    /**
     * @param {string} version  The version of Spammer follower which is not supported.
     */
    constructor(version) {
        super(`Follower version [ ${version} ] is not supported!`);
        this.version = version;
    }

    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class NotEnoughFollowers extends HttpAwareError {
    constructor() {
        super('Not enough followers to run performance test!');
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class SpammerLeader {
    constructor() {
        this.hostId = uuid();
        logger.info(`Starting cluster host with id [ ${this.hostId} ]`);
        this.connectedFollowers = new Map();
    }

    /**
     * Validates that the given public URL is a Spammer client.
     * @param {string} socketAddress
     * @param {string} version
     */
    async _validatePublicUrl(socketAddress, version) {
        if (!spammerFollowerClients.hasOwnProperty(version)) {
            throw new FollowerVersionNotSupportedError(version);
        }
        const followerClient = spammerFollowerClients[version];
        const uuid = await followerClient.connectToFollower(socketAddress);
        return uuid;
    }

    /**
     * Add a Spammer follower.
     * @param {string} socketAddress    The socket address to connect to.
     */
    async addFollower(socketAddress, version) {
        const validVersion = version || SpammerLeader.version;
        const uuid = await this._validatePublicUrl(socketAddress, validVersion);
        logger.info(`Validated follower with UUID [ ${uuid} ]`);
        if (this._checkFollowerConnected(uuid)) {
            throw new FollowerIdAlreadyLinked(uuid);
        }
        this.connectedFollowers.set(uuid, { socketAddress: socketAddress, version: validVersion, uuid: uuid });
    }

    /**
     * Checks if this Spammer follower is already connected.
     * @param {string} followerId   The unique ID of the follower.
     */
    _checkFollowerConnected(followerId) {
        return this.connectedFollowers.has(followerId);
    }

    /**
     * Start a performance test with the given configuration.
     * @param {object} config
     */
    async startPerformanceTest(config) {
        const followers = await this._determineSpammerFollowers(config);
        const runId = uuid();
        const configuredFollowers = [];
        try {
            for (let follower of followers) {
                await spammerFollowerClients[follower.version].startPerformanceRun(
                    follower.socketAddress,
                    runId,
                    SpammerLeader.defaultInitialPerformanceDelayMs
                );
                configuredFollowers.push(follower);
            }
        } catch (e) {
            // Invalidate previous requests.
            for (let follower of configuredFollowers) {
                try {
                    await spammerFollowerClients[follower.version].stopPerformanceRun(follower.socketAddress, runId);
                } catch (stopError) {
                    logger.warn(
                        `Error while trying to invalidate performance run [ ${runId} ] for follower [ ${follower.uuid} ]. Error was [ ${stopError.message} ]`
                    );
                }
            }
            throw e;
        }
        logger.info('Performance test has been successfully started!');
    }

    async _determineSpammerFollowers(config) {
        const freeFollowers = await this._getFreeFollowers();
        if (freeFollowers.length <= 0) {
            throw new NotEnoughFollowers();
        }
        logger.info(`Founder [ ${freeFollowers.length} ] free followers!`);
        return freeFollowers;
    }

    async _getFreeFollowers() {
        const freeFollowers = [];
        for (const follower of this.connectedFollowers.values()) {
            const isRunning = await spammerFollowerClients[follower.version].runningPerformanceRun(
                follower.socketAddress
            );
            logger.debug(`Follower [ ${follower.uuid} ] running status is [ ${isRunning} ]`);
            if (!isRunning) freeFollowers.push(follower);
        }
        return freeFollowers;
    }

    _sendSpammerClientRequest(config, remoteHost) {}
}

SpammerLeader.defaultInitialPerformanceDelayMs = 10000;
SpammerLeader.version = 'v1';

module.exports = { SpammerLeader, FollowerIdAlreadyLinked };
