const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');

const followerJobStatus = {
    WAITING: 'waiting',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
};

class FollowerJob {
    /**
     * An object which represents a job for a follower.
     * @param {object} config                   The job config.
     * @param {String} type                     The type of job.
     * @param {Function} statusChangeCallback   A function which is called when the status of the job changes.
     * @param {Function} completedCallback      A function which is called when the job completes.
     */
    constructor(config, type, statusChangeCallback, completedCallback) {
        this.uuid = uuidv4();

        this.config = config;
        this.type = type;
        this.statusChangeCallback = statusChangeCallback;
        this.completedCallback = completedCallback;

        this.status = followerJobStatus.WAITING;
    }

    /**
     * Change the status of job. This will call the status change callback if it is set.
     * @param {String} newStatus    The new job status.
     * @param {object} result       [Optional] The result of the job.
     */
    async changeStatus(newStatus, result) {
        if (newStatus == this.status) {
            logger.debug(`Job status change is not new, will do nothing!`);
            return;
        }
        this.status = newStatus;
        this.result = result;
        if (this.statusChangeCallback instanceof Function) await this.statusChangeCallback(newStatus);
        if (this.completedCallback instanceof Function) await this.completedCallback(result);
    }
}

module.exports = { FollowerJob, followerJobStatus };
