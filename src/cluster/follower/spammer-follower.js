const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');
const requireFromString = require('require-from-string');
const { followerJobStatus } = require('../leader/follower-job');
const jobTypes = require('../job-types');
const getRunConfiguration = require('./interfaces/run-configuration/run-configurations');
const { ConnectedLeaders } = require('./connected-leaders/connected-leaders');
const { JobsHandledPersistenceNaive } = require('./jobs-handled-persistence/jobs-handled-persistence');

class SpammerFollower {
    /**
     * Manages jobs from Spammer leaders.
     * @param {JobsHandledPersistence} jobsHandledPersistence
     * @param {String} initialLeaderSocketAddress   [Optional] A leader socket address to automatically connect to.
     * @param {String} initialLeaderVersion         [Optional] A leader version.
     */
    constructor(jobsHandledPersistence, initialLeaderSocketAddress, initialLeaderVersion) {
        this.uuidHolder = { uuid: uuidv4() };
        this.statusHolder = {
            status: 'TODO',
            available: true,
        };
        this.jobsHandledPersistence = jobsHandledPersistence || new JobsHandledPersistenceNaive();
        this.connectedLeaders = new ConnectedLeaders(
            this.uuidHolder,
            this.statusHolder,
            (leaderUuid, jobUuid, jobConfig, jobType) => {
                return this.handleJob(leaderUuid, jobUuid, jobConfig, jobType);
            }
        );

        this._resetPerformanceRun();
        logger.info(`Starting follower with ID [ ${this.uuid} ]`);

        this.jobHandlers = {};
        this.jobHandlers[jobTypes.PERFORMANCE_PLAN] = (_0, jobConfig, _1) => this._handlePerformancePlan(jobConfig);
        this.jobHandlers[jobTypes.PERFORMANCE_RUN] = (jobUuid, jobConfig, leaderUuid) =>
            this._handlePerformanceRun(jobUuid, jobConfig, leaderUuid);

        logger.info('jobs handled: ' + jobsHandledPersistence);
        logger.info('jobs handled: ' + this.jobsHandledPersistence);

        if (initialLeaderSocketAddress) {
            logger.info(
                `Connecting to initial leader with address [ ${initialLeaderSocketAddress} ] and version [ ${initialLeaderVersion} ]`
            );
            this.addLeader(initialLeaderSocketAddress, initialLeaderVersion);
        }
    }

    /**
     * Handle a job from the leader.
     * @param {String} leaderUuid    The leader of which the job has originated from.
     * @param {String} jobUuid       The job unique id.
     * @param {object} jobConfig     The job configuration.
     * @param {String} jobType       The job type.
     */
    handleJob(leaderUuid, jobUuid, jobConfig, jobType) {
        if (this.jobsHandledPersistence.hasJob(jobUuid)) {
            logger.info(`Skipping job with id [ ${jobUuid} ] since it has already been handled!`);
            return {};
        }
        if (!this.connectedLeaders.hasUuid(leaderUuid))
            throw new Error(`Could not handle job: Leader with ID [ ${leaderUuid} ] not found!`);
        if (!this.jobHandlers.hasOwnProperty(jobType)) {
            logger.warn(`Do not know how to handle job type [ ${jobType} ]`);
            return { status: followerJobStatus.REJECTED };
        }
        const { status, result } = this.jobHandlers[jobType](jobUuid, jobConfig, leaderUuid);
        logger.info(`Setting job status to [ ${status} ] with id [ ${jobUuid} ] and result [ ${result} ]`);
        this.jobsHandledPersistence.add(jobUuid);
        return { status, result };
    }

    /**
     * Handle a performance plan job.
     * @param {object} jobConfig The config of the plan job.
     */
    _handlePerformancePlan(jobConfig) {
        if (this.performanceRun.uuid) return { status: followerJobStatus.REJECTED };
        logger.info(`Starting performance test plan with id [ ${jobConfig.performanceUuid} ]`);
        this.performanceRun.uuid = jobConfig.performanceUuid;
        const configModule = requireFromString(jobConfig.config);
        const run = getRunConfiguration(configModule, jobConfig.metricsConfig).createPerformanceRun();
        this.performanceRun = {
            uuid: jobConfig.performanceUuid,
            run: run,
        };
        return { status: followerJobStatus.COMPLETED };
    }

    /**
     * Handle a performance run job.
     * @param {String} jobUuid       The unique id of the performance run job.
     * @param {object} jobConfig     The config of the run job.
     * @param {String} leaderUuid    The unique id of the leader who owns this performance test.
     */
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
            this.connectedLeaders.pushJobStatusUpdate(leaderUuid, jobUuid, followerJobStatus.COMPLETED, result);
            this._resetPerformanceRun();
        });
        return { status: followerJobStatus.ACCEPTED };
    }

    async addLeader(socketAddress, version) {
        const actualVersion = version || SpammerFollower.version;
        logger.info(`Adding leader with socket address [ ${socketAddress} ] and version [ ${actualVersion} ]`);
        await this.connectedLeaders.addLeader(socketAddress, actualVersion);
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

    close() {
        this.connectedLeaders.close();
    }
}

SpammerFollower.version = 'v1';

module.exports = { SpammerFollower };
