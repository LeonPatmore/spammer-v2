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
    constructor(config, performanceUuid, statusChangeObject) {
        super(
            {
                performanceUuid: performanceUuid,
                config: config,
            },
            jobTypes.PERFORMANCE_PLAN,
            statusChangeObject
        );
    }
}

class PerformanceRunJob extends FollowerJob {
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
    generateAndAttachPlanJob() {
        const job = new PerformancePlanJob(this.config, this.uuid, status => this._planJobStatusChange(status));
        this.planJobs.push(job);
        return job;
    }
    generateAndAttachRunJob() {
        const job = new PerformanceRunJob(this.uuid, status => this._runJobStatusChange(status));
        this.runJobs.push(job);
        return job;
    }
    _planJobStatusChange(status) {
        logger.info(`Handling plan job status change for performance test [ ${this.uuid} ] of status [ ${status} ]`);
        if (status == followerJobStatus.REJECTED) {
            // Retry performance test.
        } else if (status == followerJobStatus.COMPLETED) {
            this._handlePlanJobCompleted(status);
        }
    }
    _handlePlanJobCompleted(status) {
        logger.info(`Handling plan job completion performance test [ ${this.uuid} ] of status [ ${status} ]`);
        const allJobsCompleted = true;
        this.planJobs.forEach(planJob => {
            if (planJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
        });
        if (allJobsCompleted) {
            logger.info(`All plan jobs have been completed for performance test [ ${this.uuid} ]`);
            this.planJobsCompletedCallback();
        }
    }
    _runJobStatusChange(status) {
        logger.info(`Handling run job status change for performance test [ ${this.uuid} ] of status [ ${status} ]`);
        if (status == followerJobStatus.REJECTED) {
            // I don't know what to do here!
        } else if (status == followerJobStatus.COMPLETED) {
            this._handleRunJobCompleted(status);
        }
    }
    _handleRunJobCompleted(status) {
        logger.info(`Handling run job completion performance test [ ${this.uuid} ] of status [ ${status} ]`);
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
