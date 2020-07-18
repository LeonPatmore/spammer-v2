const httpClient = require('../../../http/client').getInstance();
const statusCodes = require('http-status-codes');

class SpammerLeaderClientV1 {
    /**
     * Send an update request to the Spammer host.
     * @param {string} socketAddress    Socket address of the leader.
     * @param {string} uuid             The UUID of the follower.
     * @param {string} status           The staus of the follower.
     * @param {string} available        The availability of the follower.
     */
    static async updateLeader(socketAddress, uuid, status, available) {
        return await httpClient
            .put(`http://${socketAddress}/v1/follower/status`, {
                uuid: uuid,
                status: status,
                available: available,
            })
            .then(result => {
                if (result.code != statusCodes.OK) {
                    throw new Error(`Unexpected response from the leader, ${result.code} ${result.body}!`);
                }
                let jobs = [];
                if (result.body.hasOwnProperty('job')) {
                    jobs = [
                        {
                            uuid: result.body.job.uuid,
                            config: result.body.job.config,
                            type: result.body.job.type,
                        },
                    ];
                }
                return {
                    uuid: result.body.uuid,
                    jobs: jobs,
                };
            });
    }

    static async updateJobStatus(socketAddress, followerUuid, jobUuid, jobStatus, jobResult) {
        return await httpClient
            .put(`http://${socketAddress}/v1/job/status`, {
                follower_uuid: followerUuid,
                job_uuid: jobUuid,
                job_status: jobStatus,
                job_result: jobResult,
            })
            .then(result => {
                if (result.code != statusCodes.OK)
                    throw new Error(`Unexected response from the leader, ${result.code} ${result.body}!`);
            });
    }
}

module.exports = {
    v1: SpammerLeaderClientV1,
};
