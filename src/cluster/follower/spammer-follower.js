const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');
const { HttpAwareError } = require('../spammer-http-error-handler');
const httpStatus = require('http-status-codes');
const PerformanceRun = require('../../performance/performance-run');
const requireFromString = require('require-from-string');
const spammerLeaderClients = require('./leader-clients/spammer-leader-client');
const { followerJobStatus } = require('../leader/follower-job');
const jobTypes = require('../job-types');

class FollowerAlreadyRunningPerformance extends HttpAwareError {
    constructor(performanceRunId) {
        super(`Performance test already running with ID [ ${performanceRunId} ]`);
        this.performanceRunId = performanceRunId;
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class RunIdIsNullError extends Error {
    constructor() {
        super('The run ID must not be null!');
    }
}

class SpammerFollower {
    /**
     * Construct an instance of a Spammer follower.
     */
    constructor() {
        this.uuid = uuidv4();
        this._resetPerformanceRun();
        this.leaders = new Map();
        this.status = 'hi';
        this.available = true;
        this.currentJobUuid = null;
        this.currentJobStatus = null;
        this.jobUpdateQueue = [];
        logger.info(`Starting follower with ID [ ${this.uuid} ]`);
        setInterval(() => this._updateLeaders(), 5000);
        setInterval(() => this._sendJobUpdates(), 5000);
    }

    async handleJob(leaderUuid, jobUuid, jobConfig, jobType) {
        if (!this.leaders.has(leaderUuid))
            throw new Error(`Could not handle job: Leader with ID [ ${leaderUuid} ] not found!`);
        if (!this.currentJobUuid) {
            // Start new job.
            this._startJob(leaderUuid, jobUuid, jobConfig, jobType);
        }
        if (jobUuid != this.currentJobUuid) {
            logger.info(`Not accepting job since there is a job already running!`);
            this._rejectJob(leaderUuid, jobUuid);
            return;
        }
    }

    async _startJob(leaderUuid, jobUuid, jobConfig, jobType) {
        this.currentJobUuid = jobUuid;
        logger.info(`Starting job with id [ ${jobUuid} ], type [ ${jobType} ] and config [ ${jobConfig} ]`);
        if (jobType == jobTypes.PERFORMANCE_PLAN)
            this.jobUpdateQueue.push({
                leaderUuid: leaderUuid,
                jobUuid: jobUuid,
                jobStatus: followerJobStatus.COMPLETED,
            });
    }

    async _runJob(leaderUuid) {}

    async _rejectJob(leaderUuid, jobUuid) {
        this.jobUpdateQueue.push({
            leaderUuid: leaderUuid,
            jobUuid: jobUuid,
            jobStatus: followerJobStatus.REJECTED,
        });
    }

    async _updateLeaders() {
        for (let leader of this.leaders.values()) {
            const leaderResponse = await spammerLeaderClients[leader.version].updateLeader(
                leader.socketAddress,
                this.uuid,
                this.status,
                this.available
            );
            if (leaderResponse.hasOwnProperty('job')) {
                // TODO: Move logic of body -> params into client.
                this.handleJob(
                    leader.uuid,
                    leaderResponse.job.uuid,
                    leaderResponse.job.config,
                    leaderResponse.job.type
                );
            }
        }
    }

    async _sendJobUpdates() {
        for (var i = this.jobUpdateQueue.length; i--; ) {
            const jobUpdate = this.jobUpdateQueue[i];
            logger.info(`Sending status update [ ${jobUpdate} ]`);
            const leader = this.leaders.get(jobUpdate.leaderUuid);
            await spammerLeaderClients[leader.version].updateJobStatus(
                leader.socketAddress,
                this.uuid,
                jobUpdate.jobUuid,
                jobUpdate.jobStatus
            );
            this.jobUpdateQueue.splice(i, 1);
        }
    }

    async addLeader(socketAddress, version) {
        const actualVersion = version || SpammerFollower.version;
        const leaderUuid = await spammerLeaderClients[actualVersion].updateLeader(
            socketAddress,
            this.uuid,
            this.status,
            this.available
        );
        if (this.leaders.has(leaderUuid)) throw new Error('Leader already connected!');
        this.leaders.set(leaderUuid, {
            socketAddress: socketAddress,
            version: actualVersion,
            uuid: leaderUuid,
        });
    }

    /**
     * Returns true if we are already running a performance test, else false.
     */
    hasRun() {
        return this.performanceRun.uuid != null;
    }

    /**
     * Reset the follower's performance run.
     */
    _resetPerformanceRun() {
        this.performanceRun = {
            uuid: null,
            run: null,
        };
    }

    /**
     * Starts a performance run given the config.
     * @param {string} runId    The run id.
     */
    startRun(runId, delayMs, config) {
        if (!runId) throw new RunIdIsNullError();
        if (this.hasRun()) throw new FollowerAlreadyRunningPerformance(this.performanceRun.uuid);
        const configModule = requireFromString(config);
        const runtimeSeconds = configModule.runtimeSeconds || 2;
        const run = new PerformanceRun(configModule.runRequest, 2, runtimeSeconds);
        run.run(a => {
            this.performanceRun = {};
        });
        this.performanceRun = {
            uuid: runId,
            run: run,
        };
    }
}

SpammerFollower.version = 'v1';

module.exports = { SpammerFollower, FollowerAlreadyRunningPerformance, RunIdIsNullError };
