const spammerLeaderClients = require('./leader-clients/spammer-leader-client');

class ConnectedLeaders {
    constructor(uuidHolder, statusHolder, jobHandler) {
        this.leaders = {};
        this.uuidHolder = uuidHolder;
        this.statusHolder = statusHolder;
        this.jobHandler = jobHandler;
        this.updateLeadersInterval = setInterval(() => this._updateLeaders(), SpammerFollower.updateLeadersDelayMs);
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
}

module.exports = { ConnectedLeaders };
