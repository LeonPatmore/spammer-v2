const { v4: uuidv4 } = require('uuid');
const { FollowerJob, followerJobStatus } = require('../leader/follower-job');
const jobTypes = require('../job-types');
const logger = require('../../logger/application-logger');

const performanceTestStatus = {
    IN_QUEUE: 'in_queue',
    WAITING_FOR_ENOUGH_FOLLOWERS: 'waiting_for_enough_followers',
    WAITING_FOR_FOLLOWERS: 'waiting_for_followers',
    SCHEDULING: 'scheduling',
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
    constructor(config, followers, planJobCompletedCallback) {
        this.uuid = uuidv4();
        this.config = config;
        this.followers = followers;
        this.status = performanceTestStatus.IN_QUEUE;
        this.planJobs = [];
        this.planJobCompletedCallback = planJobCompletedCallback;
    }
    generateAndAttachPlanJob() {
        const job = new PerformancePlanJob(this.config, this.uuid, status => this._planJobStatusChange(status));
        this.planJobs.push(job);
        return job;
    }
    generateAndAttachRunJob() {
        const job = new PerformanceRunJob(this.uuid);
        this.planJobs.push(job);
        return job;
    }
    _planJobStatusChange(status) {
        logger.info(`Handling plan job status change for performance test [ ${this.uuid} ] of status [ ${status} ]`);
        if (status == followerJobStatus.REJECTED) {
            // Cancel performance test
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
            logger.info(
                `All jobs have been completed for performance test [ ${this.uuid} ], calling job completed callback function!`
            );
            this.planJobCompletedCallback();
        }
    }
}

module.exports = { PerformanceTest, PerformancePlanJob, performanceTestStatus };
