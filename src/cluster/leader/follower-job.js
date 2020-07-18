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
     */
    constructor(config, type, statusChangeCallback) {
        this.config = config;
        this.status = followerJobStatus.WAITING;
        this.uuid = uuidv4();
        this.statusChangeCallback = statusChangeCallback;
        this.type = type;
    }

    /**
     * Change the status of job. This will call the status change callback if it is set.
     * @param {String} newStatus    The new job status.
     * @param {object} result       [Optional] The result of the job.
     */
    changeStatus(newStatus, result) {
        if (newStatus == this.status) {
            logger.info(`Job status change is not new, will do nothing!`);
            return;
        }
        this.status = newStatus;
        this.result = result;
        if (this.statusChangeCallback instanceof Function) this.statusChangeCallback(newStatus);
    }
}

module.exports = { FollowerJob, followerJobStatus };
