/**
 * Logic for communicating with a Spammer client.
 */

const RemoteHost = require('./remote-host');
const httpStatus = require('http-status-codes');

class SpammerClientV1 extends RemoteHost {
    constructor(socketAddress, uuid, httpClient, version = 1) {
        super(socketAddress, uuid);
        this.httpClient = httpClient;
        this.version = version;
    }

    /**
     * Returns true if the client is ready to receive a request, else false.
     */
    async isReady() {
        const res = await this.httpClient.get(`/v1/${this.performancePath}`);
        const resCode = res.code;
        if (resCode == httpStatus.NOT_FOUND) {
            return true;
        } else if (resCode == httpStatus.OK) {
            return false;
        } else {
            throw new Error('Unexpected response code from the spammer client!');
        }
    }
}

SpammerClientV1.performancePath = 'performance';
