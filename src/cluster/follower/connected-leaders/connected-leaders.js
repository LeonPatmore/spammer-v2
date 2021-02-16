const spammerLeaderClients = require('../leader-clients/spammer-leader-client');
const { HttpAwareError } = require('../../spammer-http-error-handler');
const httpStatus = require('http-status-codes');

class UnknownLeaderError extends Error {
    constructor(leaderUuid) {
        super(`unknown leader with uuid [ ${leaderUuid} ]`);
    }
}

class LeaderAlreadyConnected extends HttpAwareError {
    /**
     * An error for when you are trying to connect a leader which is already connected to this follower.
     * @param {String} leaderUuid   The id of the leader you are trying to connect.
     */
    constructor(leaderUuid) {
        super(`leader with id [ ${leaderUuid} ] is already connected!`);
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }
}

class ConnectedLeaders {
    constructor(uuidHolder, statusHolder, jobHandler) {
        this.leaders = new Map();
        this.jobUpdateQueue = [];
        this.uuidHolder = uuidHolder;
        this.statusHolder = statusHolder;
        this.jobHandler = jobHandler;
        this.updateLeadersInterval = setInterval(() => this._updateLeaders(), ConnectedLeaders.updateLeadersDelayMs);
        this.sendJobUpdatesInterval = setInterval(
            () => this._sendJobUpdates(),
            ConnectedLeaders.sendJobStatusUpdatesDelayMs
        );
    }

    hasUuid(uuid) {
        return this.leaders.has(uuid);
    }

    getLeader(leaderUuid) {
        if (!this.hasUuid(leaderUuid)) throw new UnknownLeaderError(leaderUuid);
        return this.leaders.get(leaderUuid);
    }

    async addLeader(socketAddress, version) {
        const { uuid } = await spammerLeaderClients[version].updateLeader(
            socketAddress,
            this.uuidHolder.uuid,
            this.statusHolder.status,
            this.statusHolder.available
        );
        if (this.hasUuid(uuid)) throw new LeaderAlreadyConnected(uuid);
        this.leaders.set(uuid, {
            socketAddress: socketAddress,
            version: version,
            uuid: uuid,
        });
    }

    /**
     * Send updates to the connected leaders.
     */
    async _updateLeaders() {
        for (let leader of this.leaders.values()) {
            const { jobs } = await spammerLeaderClients[leader.version].updateLeader(
                leader.socketAddress,
                this.uuidHolder.uuid,
                this.statusHolder.status,
                this.statusHolder.available
            );
            for (const job of jobs) {
                jobHandler(leader.uuid, job.uuid, job.config, job.type);
            }
        }
    }

    /**
     * Push a job status update to the queue to be sent.
     * @param {String} leaderUuid    The unique id of the leader.
     * @param {String} jobUuid       The unique id of the job.
     * @param {String} jobStatus     The new job status.
     * @param {object} jobResult     [Optional] The result of the job.
     */
    pushJobStatusUpdate(leaderUuid, jobUuid, jobStatus, jobResult) {
        this.jobUpdateQueue.push({
            leaderUuid: leaderUuid,
            jobUuid: jobUuid,
            jobStatus: jobStatus,
            jobResult: jobResult,
        });
    }

    /**
     * Send job status updates to the leaders.
     */
    async _sendJobUpdates() {
        for (var i = this.jobUpdateQueue.length; i--; ) {
            const jobUpdate = this.jobUpdateQueue[i];
            logger.info(
                `Sending status update for id [ ${jobUpdate.jobUuid} ], status [ ${jobUpdate.jobStatus} ] and result [ ${jobUpdate.jobResult} ]`
            );
            const leader = this.leaders.get(jobUpdate.leaderUuid);
            await spammerLeaderClients[leader.version].updateJobStatus(
                leader.socketAddress,
                this.uuidHolder.uuid,
                jobUpdate.jobUuid,
                jobUpdate.jobStatus,
                jobUpdate.jobResult
            );
            this.jobUpdateQueue.splice(i, 1);
        }
    }

    close() {
        clearInterval(this.updateLeadersInterval);
        clearInterval(this.sendJobUpdatesInterval);
    }
}

ConnectedLeaders.updateLeadersDelayMs = 5000;
ConnectedLeaders.sendJobStatusUpdatesDelayMs = 1000;

module.exports = { ConnectedLeaders, UnknownLeaderError, LeaderAlreadyConnected };
