const httpClient = require('../../../http/client').getInstance();
const statusCodes = require('http-status-codes');

class SpammerLeaderClientV1 {
    /**
     * Send an update request to the Spammer leader.
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
                const jobs = [];
                if (result.body.hasOwnProperty('jobs')) {
                    for (const job of result.body.jobs) {
                        const jobToAdd = {
                            uuid: job.uuid,
                            config: job.config,
                            type: job.type,
                        };
                        jobs.push(jobToAdd);
                    }
                }
                return {
                    uuid: result.body.uuid,
                    jobs: jobs,
                };
            });
    }

    /**
     * Send a job status update to the Spammer leader.
     * @param {*} socketAddress Socket address of the spammer leader.
     * @param {*} followerUuid  Follower id.
     * @param {*} jobUuid       The unique id of the job to update.
     * @param {*} jobStatus     The new job status.
     * @param {*} jobResult     [Optional] The result of the job.
     */
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
                    throw new Error(
                        `Unexected response from the leader, ${result.code} ${JSON.stringify(result.body)}!`
                    );
            });
    }
}

module.exports = {
    v1: SpammerLeaderClientV1,
};
