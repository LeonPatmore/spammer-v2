const logger = require('../../logger/application-logger');
const HttpClient = require('../../http/client');
const RemoteHost = require('./remote-host');
const sleep = require('../../utils/sleep');
const uuid = require('uuid').v4;

class ClusterHost {
    /**
     * @param {Array}  remoteSocketAddresses A list of remote hosts to attempt to establish a connection to.
     * @param {Object} config                A config object for this host.
     */
    constructor(remoteSocketAddresses, config) {
        this.hostId = uuid();
        logger.info(
            `Starting cluster host with id [ ${this.hostId} ] and remote socket addresses [ ${remoteSocketAddresses} ]`
        );
        this.httpClient = new HttpClient();
        const remoteHosts = [];
        remoteSocketAddresses.forEach(socketAddress => {
            remoteHosts.push(new RemoteHost(socketAddress));
        });
        this.waitForRemoteHosts();
    }

    /**
     * Returns a promise that waits for all given hosts to be ready.
     * @param {Function} callback Waits for all of the remote hosts to be ready.
     */
    async waitForRemoteHosts(callback) {
        var i;
        for (i = 0; i < 10; i++) {
            logger.info('Still waiting for hosts to be ready!');
            await sleep(10);
        }
    }
}

module.exports = ClusterHost;
