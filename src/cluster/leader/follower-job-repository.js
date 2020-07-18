const { followerJobStatus } = require('./follower-job');
const { HttpAwareError } = require('../spammer-http-error-handler');
const httpStatus = require('http-status-codes');
const logger = require('../../logger/application-logger');

class JobDoesNotExist extends HttpAwareError {
    constructor(jobUuid) {
        super(`job with ID ${jobUuid} does not exist!`);
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class FollowerJobRepository {
    constructor() {
        this.followerJobs = new Map();
    }

    getActiveJobForFollower(followerUuid) {
        if (!this.followerJobs.has(followerUuid)) return undefined;
        const followerJobs = this.followerJobs.get(followerUuid);
        for (let job of followerJobs) {
            if (!FollowerJobRepository.terminatedJobStatuses.includes(job.status)) return job;
        }
    }

    getJobWithId(followerUuid, jobUuid) {
        if (!this.followerJobs.has(followerUuid)) throw new JobDoesNotExist(jobUuid);
        const followerJobs = this.followerJobs.get(followerUuid);
        for (let job of followerJobs) {
            if (job.uuid == jobUuid) return job;
        }
        logger.warn(`Can not find job with ID [ ${jobUuid} ] for follower [ ${followerUuid} ]`);
        throw new JobDoesNotExist(jobUuid);
    }

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
