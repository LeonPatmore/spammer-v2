const { v4: uuidv4 } = require('uuid');
const { FollowerJob, followerJobStatus } = require('../leader/follower-job');
const jobTypes = require('../job-types');
const logger = require('../../logger/application-logger');
const metricTypes = require('../../metrics/metric-types');
const applicationLogger = require('../../logger/application-logger');
const finaliseMetrics = require('../../metrics/metric-finaliser');

const performanceTestStatus = {
    IN_QUEUE: 'in_queue',
    WAITING_FOR_ENOUGH_FOLLOWERS: 'waiting_for_enough_followers',
    WAITING_FOR_FOLLOWERS: 'waiting_for_followers',
    RUNNING: 'running',
    DONE: 'done',
};

class PerformancePlanJob extends FollowerJob {
    /**
     * A job for planning a performance run.
     * @param {object} config                   The performance test configuration.
     * @param {String} performanceUuid          The unique id of the performance test.
     */
    constructor(config, performanceUuid, metricsConfig, statusChangeCallback, completedCallback) {
        super(
            {
                performanceUuid: performanceUuid,
                metricsConfig: metricsConfig,
                config: config,
            },
            jobTypes.PERFORMANCE_PLAN,
            statusChangeCallback,
            completedCallback
        );
    }
}

class PerformanceRunJob extends FollowerJob {
    /**
     * A job for running a planned performance run.
     * @param {String} performanceUuid          The unique id of the performance test.
     */
    constructor(performanceUuid, statusChangeCallback, completedCallback) {
        super(
            {
                performanceUuid: performanceUuid,
            },
            jobTypes.PERFORMANCE_RUN,
            statusChangeCallback,
            completedCallback
        );
    }
}

class PerformanceTest {
    /**
     * An object for managing a performance test, including:
     * - Calculating results.
     * - Creating follower jobs.
     * - Listening to follower job results.
     * @param {object}      config  The performance configuration.
     */
    constructor(config, metricsConfig, metricsStoreGenerator) {
        this.uuid = uuidv4();
        this.config = config;
        this.metricsConfig = metricsConfig;
        this.metricsStore = metricsStoreGenerator(this.uuid);
        this.status = performanceTestStatus.IN_QUEUE;
        this.planJobs = [];
        this.runJobs = [];
        this.followers = undefined;
        this.planJobsCompletedCallback = undefined;
        this.runJobsCompletedCallback = undefined;
    }

    /**
     * Generates a plan job.
     */
    generateAndAttachPlanJob() {
        const job = new PerformancePlanJob(this.config, this.uuid, this.metricsConfig, undefined, () => {
            this._handlePlanJobCompleted();
        });
        this.planJobs.push(job);
        return job;
    }

    /**
     * Generates a run job.
     */
    generateAndAttachRunJob() {
        const job = new PerformanceRunJob(this.uuid, undefined, async result => this._handleRunJobCompleted(result));
        this.runJobs.push(job);
        return job;
    }

    /**
     * Handles a plan job completion
     */
    _handlePlanJobCompleted() {
        logger.info(`Handling plan job completion performance test [ ${this.uuid} ]`);
        let allJobsCompleted = true;
        this.planJobs.forEach(planJob => {
            if (planJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
        });
        if (allJobsCompleted) {
            logger.info(`All plan jobs have been completed for performance test [ ${this.uuid} ]`);
            this.planJobsCompletedCallback();
        }
    }

    /**
     * Handles a run job completion.
     */
    async _handleRunJobCompleted(result) {
        logger.info(`Handling run job completion performance test [ ${this.uuid} ]`);
        logger.info(`The result is [ ${JSON.stringify(result)} ]`);
        let allJobsCompleted = true;
        this.runJobs.forEach(runJob => {
            if (runJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
        });
        await this._handleMetrics(result).catch(err => {
            logger.warn(`Could not handle metrics due to [ ${err} ]`);
            throw err;
        });
        logger.info(`All jobs completed: ${allJobsCompleted}`);
        if (allJobsCompleted) {
            logger.info(`All run jobs have been completed for performance test [ ${this.uuid} ]`);
            this.result = await finaliseMetrics(this.metricsStore, this.metricsConfig);
            this.runJobsCompletedCallback();
        }
    }

    async _handleMetrics(result) {
        for (const metric of Object.keys(result)) {
            if (this.metricsConfig.hasOwnProperty(metric)) {
                const thisType = this.metricsConfig[metric].type;
                const value = result[metric];
                switch (thisType) {
                    case metricTypes.CONSTANT:
                        await this.metricsStore.insertConstant(metric, value);
                        break;
                    case metricTypes.ROLLING_TOTAL:
                        await this.metricsStore.addRollingTotal(metric, value);
                        break;
                    case metricTypes.PER_REQUEST_VALUE:
                        for (const requestValue of value) {
                            await this.metricsStore.addPerRequestValue(
                                metric,
                                Object.values(requestValue),
                                Object.keys(requestValue)
                            );
                        }
                        break;
                    default:
                        logger.warn(`Not sure how to handle metric [ ${metric} ], type [ ${thisType} ]!`);
                }
            } else {
                logger.warn(`Ignoring metric [ ${metric} ] since it is not in the metric configuration!`);
            }
        }
    }
}

module.exports = { PerformanceTest, PerformancePlanJob, performanceTestStatus };
