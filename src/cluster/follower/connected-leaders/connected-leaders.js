const spammerLeaderClients = require('../leader-clients/spammer-leader-client');
const { HttpAwareError } = require('../../spammer-http-error-handler');
const httpStatus = require('http-status-codes');

class UnknownLeaderError extends HttpAwareError {
    constructor(leaderUuid) {
        super(`unknown leader with uuid [ ${leaderUuid} ]`);
    }
    getHttpCode() {
        return httpStatus.BAD_REQUEST;
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
        this.uuidHolder = uuidHolder;
        this.statusHolder = statusHolder;
        this.jobHandler = jobHandler;
        this.updateLeadersInterval = setInterval(() => this._updateLeaders(), ConnectedLeaders.updateLeadersDelayMs);
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

    close() {
        clearInterval(this.updateLeadersInterval);
    }
}

ConnectedLeaders.updateLeadersDelayMs = 5000;

module.exports = { ConnectedLeaders, UnknownLeaderError, LeaderAlreadyConnected };
