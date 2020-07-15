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
    constructor(config, performanceUuid, onStatusChange) {
        super(
            {
                performanceUuid: performanceUuid,
                config: config,
            },
            jobTypes.PERFORMANCE_PLAN,
            onStatusChange
        );
    }
}

class PerformanceTest {
    constructor(config) {
        this.uuid = uuidv4();
        this.config = config;
        this.status = performanceTestStatus.IN_QUEUE;
        this.planJobs = [];
    }
    generateAndAttachPlanJob() {
        const job = new PerformancePlanJob(this.config, this.uuid, this._handlePlanJobStatusChange);
        this.planJobs.push(job);
        return job;
    }
    _handlePlanJobStatusChange(status) {
        if (status == followerJobStatus.REJECTED) {
            // Cancel performance test
        } else if (status == followerJobStatus.COMPLETED) {
        }
    }
    _handlePlanJobCompleted() {
        const allJobsCompleted = true;
        this.planJobs.forEach(planJob => {
            if (planJob.status != followerJobStatus.COMPLETED) allJobsCompleted = false;
        });
        if (allJobsCompleted) {
            logger.info(
                `All jobs have been completed for performance test [ ${this.uuid} ], will now send out send events!`
            );
        }
    }
}

module.exports = { PerformanceTest, PerformancePlanJob, performanceTestStatus };
