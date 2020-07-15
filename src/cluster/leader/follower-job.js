const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');

const followerJobStatus = {
    WAITING: 'waiting',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
};

class FollowerJob {
    constructor(config, type, statusChangeCallback) {
        this.config = config;
        this.status = followerJobStatus.WAITING;
        this.uuid = uuidv4();
        this.statusChangeCallback = statusChangeCallback;
        this.type = type;
    }
    changeStatus(newStatus) {
        if (newStatus == this.status) {
            logger.info(`Job status change is not new, will do nothing!`);
            return;
        }
        this.status = newStatus;
        // TODO check if func
        this.statusChangeCallback(newStatus);
    }
}

module.exports = { FollowerJob, followerJobStatus };
