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
        this.jobUpdateQueue = [];
        logger.info(`Starting follower with ID [ ${this.uuid} ]`);
        setInterval(() => this._updateLeaders(), 5000);
        setInterval(() => this._sendJobUpdates(), 1000);
        this.jobHandlers = {};
        this.jobHandlers[jobTypes.PERFORMANCE_PLAN] = (_0, jobConfig, _1) => this._handlePerformancePlan(jobConfig);
        this.jobHandlers[jobTypes.PERFORMANCE_RUN] = (jobUuid, jobConfig, leaderUuid) =>
            this._handlePerformanceRun(jobUuid, jobConfig, leaderUuid);
        this.jobsHandled = [];
    }

    handleJob(leaderUuid, jobUuid, jobConfig, jobType) {
        if (this.jobsHandled.indexOf(jobUuid) > -1) {
            logger.info(`Skipping job with id [ ${jobUuid} ] since it has already been handled!`);
            return;
        }
        if (!this.leaders.has(leaderUuid))
            throw new Error(`Could not handle job: Leader with ID [ ${leaderUuid} ] not found!`);
        if (!this.jobHandlers.hasOwnProperty(jobType)) {
            logger.warn(`Do not know how to handle job type [ ${jobType} ]`);
            return;
        }
        const { status, result } = this.jobHandlers[jobType](jobUuid, jobConfig, leaderUuid);
        logger.info(`Setting job status to [ ${status} ] with id [ ${jobUuid} ] and result [ ${result} ]`);
        this._pushJobStatusUpdate(leaderUuid, jobUuid, status, result);
        this.jobsHandled.push(jobUuid);
    }

    _handlePerformancePlan(jobConfig) {
        if (this.performanceRun.uuid) return { status: followerJobStatus.REJECTED };
        logger.info(`Starting performance test plan with id [ ${jobConfig.performanceUuid} ]`);
        this.performanceRun.uuid = jobConfig.performanceUuid;
        const configModule = requireFromString(jobConfig.config);
        const runtimeSeconds = configModule.runtimeSeconds || 2;
        const run = new PerformanceRun(configModule.runRequest, 2, runtimeSeconds);
        this.performanceRun = {
            uuid: jobConfig.performanceUuid,
            run: run,
        };
        return { status: followerJobStatus.COMPLETED };
    }

    _handlePerformanceRun(jobUuid, jobConfig, leaderUuid) {
        const performanceUuid = jobConfig.performanceUuid;
        if (performanceUuid != this.performanceRun.uuid) {
            logger.warn(
                `Can not run performance test with id [ ${performanceUuid} ], not the one that is currently planned!`
            );
            return { status: followerJobStatus.REJECTED };
        }
        this.performanceRun.run.run(result => {
            logger.info(`Finished performance run with result [ ${result} ]`);
            this._pushJobStatusUpdate(leaderUuid, jobUuid, followerJobStatus.COMPLETED, result);
            this._resetPerformanceRun();
        });
        return { status: followerJobStatus.ACCEPTED };
    }

    _pushJobStatusUpdate(leaderUuid, jobUuid, jobStatus, jobResult) {
        this.jobUpdateQueue.push({
            leaderUuid: leaderUuid,
            jobUuid: jobUuid,
            jobStatus: jobStatus,
            jobResult: jobResult,
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
            for (const job of leaderResponse) {
                this.handleJob(leader.uuid, job.uuid, job.config, job.type);
            }
        }
    }

    async _sendJobUpdates() {
        for (var i = this.jobUpdateQueue.length; i--; ) {
            const jobUpdate = this.jobUpdateQueue[i];
            logger.info(
                `Sending status update for id [ ${jobUpdate.jobUuid} ], status [ ${jobUpdate.jobStatus} ] and result [ ${jobUpdate.jobResult} ]`
            );
            const leader = this.leaders.get(jobUpdate.leaderUuid);
            await spammerLeaderClients[leader.version].updateJobStatus(
                leader.socketAddress,
                this.uuid,
                jobUpdate.jobUuid,
                jobUpdate.jobStatus,
                jobUpdate.jobResult
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

    close() {}
}

SpammerFollower.version = 'v1';

module.exports = { SpammerFollower, FollowerAlreadyRunningPerformance, RunIdIsNullError };
