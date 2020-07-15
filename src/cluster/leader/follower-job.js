const { v4: uuidv4 } = require('uuid');
const logger = require('../../logger/application-logger');

const followerJobStatus = {
    WAITING: 'waiting',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
};

class FollowerJob {
    constructor(config, type, onStatusChange) {
        this.config = config;
        this.status = followerJobStatus.WAITING;
        this.uuid = uuidv4();
        this.onStatusChange = onStatusChange;
        this.type = type;
    }
    changeStatus(newStatus) {
        if (newStatus == this.status) {
            logger.info(`Job status change is not new, will do nothing!`);
            return;
        }
        this.status = newStatus;
        if (this.onStatusChange instanceof Function) this.onStatusChange(newStatus);
    }
}

module.exports = { FollowerJob, followerJobStatus };
