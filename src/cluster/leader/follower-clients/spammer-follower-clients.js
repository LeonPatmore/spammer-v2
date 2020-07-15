const httpClient = require('../../../http/client').getInstance();
const { HttpAwareError } = require('../../spammer-http-error-handler');
const httpCodes = require('http-status-codes');

class UnexpectedSpammerClientResponse extends HttpAwareError {
    constructor() {
        super(`Unexpected response from spammer client!`);
    }

    getHttpCode() {
        return httpCodes.INTERNAL_SERVER_ERROR;
    }
}

class SpammerFollowerClientV1 {
    static async connectToFollower(socketAddress) {
        return await httpClient.post(`http://${socketAddress}/v1/connect`).then(result => {
            if (result.code != httpCodes.OK) throw new UnexpectedSpammerClientResponse();
            return result.body.uuid;
        });
    }
    static async runningPerformanceRun(socketAddress) {
        return await httpClient.get(`http://${socketAddress}/v1/run`).then(result => {
            if (result.code == httpCodes.NOT_FOUND) return false;
            else if (result.code == httpCodes.OK) return true;
            else throw new UnexpectedSpammerClientResponse();
        });
    }
    static async startPerformanceRun(socketAddress, runId, delayMs, config) {
        return await httpClient
            .post(`http://${socketAddress}/v1/run`, {
                run_id: runId,
                delay_ms: delayMs,
                config: config,
            })
            .then(result => {
                if (result.code != httpCodes.OK) throw new UnexpectedSpammerClientResponse();
            });
    }
    static async stopPerformanceRun(socketAddress, runId) {
        return await httpClient
            .delete(`http://${socketAddress}/v1/run`, {
                run_id: runId,
            })
            .then(result => {
                if (result.code != httpCodes.OK) throw new UnexpectedSpammerClientResponse();
            });
    }
}

module.exports = { v1: SpammerFollowerClientV1 };
