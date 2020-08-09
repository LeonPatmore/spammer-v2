const { followerJobStatus } = require('./follower-job');
const { HttpAwareError } = require('../spammer-http-error-handler');
const httpStatus = require('http-status-codes');
const logger = require('../../logger/application-logger');

class JobDoesNotExist extends HttpAwareError {
    /**
     * An error for when the job you are trying to get does not exist.
     * @param {String} jobUuid  The unique id of the job that does not exist.
     */
    constructor(jobUuid) {
        super(`job with ID ${jobUuid} does not exist!`);
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class FollowerJobRepository {
    /**
     * An object responsible for storing the jobs of the followers.
     */
    constructor() {
        this.followerJobs = new Map();
    }

    /**
     * Get the current active job for the given follower, or undefined if there is no active job.
     * @param {String} followerUuid The unique follower id.
     */
    getActiveJobForFollower(followerUuid) {
        if (!this.followerJobs.has(followerUuid)) return undefined;
        const followerJobs = this.followerJobs.get(followerUuid);
        for (let job of followerJobs) {
            if (!FollowerJobRepository.terminatedJobStatuses.includes(job.status)) return job;
        }
    }

    /**
     * TODO
     * @param {*} followerUuid
     */
    getActiveJobsForFollower(followerUuid) {
        if (!this.followerJobs.has(followerUuid)) return undefined;
        const followerJobs = this.followerJobs.get(followerUuid);
        const activeJobs = [];
        for (let job of followerJobs) {
            if (!FollowerJobRepository.terminatedJobStatuses.includes(job.status)) activeJobs.push(job);
        }
        return activeJobs;
    }

    /**
     * Get the job with the given id for the given follower.
     * @param {String} followerUuid The unique follower id.
     * @param {String} jobUuid      The unique job id.
     */
    getJobWithId(followerUuid, jobUuid) {
        if (!this.followerJobs.has(followerUuid)) throw new JobDoesNotExist(jobUuid);
        const followerJobs = this.followerJobs.get(followerUuid);
        for (let job of followerJobs) {
            if (job.uuid == jobUuid) return job;
        }
        logger.warn(`Can not find job with ID [ ${jobUuid} ] for follower [ ${followerUuid} ]`);
        throw new JobDoesNotExist(jobUuid);
    }

    /**
     * Add a job and assign it to the given follower.
     * @param {String} followerUuid The unique id of the follower to assign the job to.
     * @param {FollowerJob} job     The job to add.
     */
    addJob(followerUuid, job) {
        if (this.followerJobs.has(followerUuid)) {
            this.followerJobs.get(followerUuid).push(job);
        } else {
            this.followerJobs.set(followerUuid, [job]);
        }
    }
}

FollowerJobRepository.terminatedJobStatuses = [followerJobStatus.COMPLETED, followerJobStatus.REJECTED];

module.exports = { FollowerJobRepository };
