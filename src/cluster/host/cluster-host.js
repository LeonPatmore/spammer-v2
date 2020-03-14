const logger = require('../../logger/application-logger');
const HttpClient = require('../../http/client');
const RemoteHost = require('./remote-host');
const sleep = require('../../utils/sleep');

class ClusterHost {
    /**
     * @param {Array}  remoteSocketAddresses A list of remote hosts to attempt to establish a connection to.
     * @param {Object} config                A config object for this host.
     */
    constructor(remoteSocketAddresses, config) {
        logger.info(`Starting cluster host with remote socket addresses [ ${remoteSocketAddresses} ]`);
        this.httpClient = new HttpClient();
        const remoteHosts = [];
        remoteSocketAddresses.forEach(socketAddress => {
            remoteHosts.push(new RemoteHost(socketAddress));
        });
        this.waitForRemoteHosts();
    }

    /**
     * Waits for all of the remote hosts to be ready.
     */
    async waitForRemoteHosts() {
        var i;
        for (i = 0; i < 10; i++) {
            logger.info('Still waiting for hosts to be ready!');
            await sleep(10);
        }
    }
}

module.exports = ClusterHost;
