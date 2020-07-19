const { v4: uuidv4 } = require('uuid');
const { FollowerJob, followerJobStatus } = require('../leader/follower-job');
const jobTypes = require('../job-types');
const logger = require('../../logger/application-logger');

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
     * @param {Function} statusChangeCallback   A function which is called when the status of the job changes.
     */
    constructor(config, performanceUuid, statusChangeCallback) {
        super(
            {
                performanceUuid: performanceUuid,
                config: config,
            },
            jobTypes.PERFORMANCE_PLAN,
            statusChangeCallback
        );
    }
}

class PerformanceRunJob extends FollowerJob {
    /**
     * A job for running a planned performance run.
     * @param {String} performanceUuid          The unique id of the performance test.
     * @param {Function} statusChangeCallback   A function which is called when the status of the job changes.
     */
    constructor(performanceUuid, statusChangeCallback) {
        super(
            {
                performanceUuid: performanceUuid,
            },
            jobTypes.PERFORMANCE_RUN,
            statusChangeCallback
        );
    }
}

class PerformanceTest {
    /**
     * An object for managing a performance test, including:
     * - Calculating results.
     * - Creating follower jobs.
     * - Listening to follower job results.
     * @param {object} config                       The performance configuration.
     * @param {Array} followers                     An array of followers responsible for running this performance test.
     * @param {Function} planJobsCompletedCallback  The function which is called when all plan jobs have been completed.
     * @param {Function} runJobsCompletedCallback   The function which is caleld when all run jobs have been completed.
     */
    constructor(config, followers, planJobsCompletedCallback, runJobsCompletedCallback) {
        this.uuid = uuidv4();
        this.config = config;
        this.followers = followers;
        this.status = performanceTestStatus.IN_QUEUE;
        this.planJobs = [];
        this.runJobs = [];
        this.planJobsCompletedCallback = planJobsCompletedCallback;
        this.runJobsCompletedCallback = runJobsCompletedCallback;
        this.result = undefined;
    }

    /**
     * Generates a plan job.
     */
    generateAndAttachPlanJob() {
        const job = new PerformancePlanJob(this.config, this.uuid, status => this._planJobStatusChange(status));
        this.planJobs.push(job);
        return job;
    }

    /**
     * Generates a run job.
     */
    generateAndAttachRunJob() {
        const job = new PerformanceRunJob(this.uuid, status => this._runJobStatusChange(status));
        this.runJobs.push(job);
        return job;
    }

    /**
     * Handles a plan job status change.
     * @param {String} status   The new status of the plan job.
     */
    _planJobStatusChange(status) {
        logger.info(`Handling plan job status change for performance test [ ${this.uuid} ] of status [ ${status} ]`);
        if (status == followerJobStatus.REJECTED) {
            // TODO: Retry performance test.
        } else if (status == followerJobStatus.COMPLETED) {
            this._handlePlanJobCompleted();
        }
    }

    /**
     * Handles a plan job completion
     */
    _handlePlanJobCompleted() {
        logger.info(`Handling plan job completion performance test [ ${this.uuid} ]`);
        const allJobsCompleted = true;
        this.planJobs.forEach(planJob => {
            if (planJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
        });
        if (allJobsCompleted) {
            logger.info(`All plan jobs have been completed for performance test [ ${this.uuid} ]`);
            this.planJobsCompletedCallback();
        }
    }

    /**
     * Handles a run job status changes.
     * @param {String} status   The new status of the run job.
     */
    _runJobStatusChange(status) {
        logger.info(`Handling run job status change for performance test [ ${this.uuid} ] of status [ ${status} ]`);
        if (status == followerJobStatus.REJECTED) {
            // TODO: I don't know what to do here!
        } else if (status == followerJobStatus.COMPLETED) {
            this._handleRunJobCompleted();
        }
    }

    /**
     * Handles a run job completion.
     */
    _handleRunJobCompleted() {
        logger.info(`Handling run job completion performance test [ ${this.uuid} ]`);
        let allJobsCompleted = true;
        const results = [];
        this.runJobs.forEach(runJob => {
            if (runJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
            results.push(runJob.result);
        });
        if (allJobsCompleted) {
            logger.info(`All run jobs have been completed for performance test [ ${this.uuid} ]`);
            this.result = this._combineResults(results);
            this.runJobsCompletedCallback();
        }
    }

    /**
     * Combines an array of results into a single result.
     * @param {Array} results   An array of results.
     */
    _combineResults(results) {
        let total = 0;
        let success = 0;
        let failed = 0;
        results.forEach(result => {
            total = total + result.total;
            (success = success + result.success), (failed = failed + result.failed);
        });
        return {
            total: total,
            success: success,
            failed: failed,
        };
    }
}

module.exports = { PerformanceTest, PerformancePlanJob, performanceTestStatus };