/**
 *  Logic for hosting the cluster of Spammers.
 */

const logger = require('../../logger/application-logger');
const HttpClient = require('../../http/client');
const uuid = require('uuid').v4;

class ClientIdAlreadyLinked extends Error {
    /**
     * @param {*} linkedId  The ID of the client which is already linked.
     */
    constructor(linkedId) {
        super();
        this.linkedId = linkedId;
    }
}

class NotEnoughClients extends Error {}

class SpammerHostManager {
    constructor() {
        this.hostId = uuid();
        logger.info(`Starting cluster host with id [ ${this.hostId} ]`);
        this.httpClient = new HttpClient();
        this.remoteHosts = new Map();
    }

    /**
     * Add a remote host to the cluster host.
     * @param {RemoteHost} remoteHost    The remote host to add to the cluster.
     */
    addRemoteHost(remoteHost) {
        const remoteHostId = remoteHost.uuid;
        if (this.checkClientExists(remoteHostId)) {
            throw new ClientIdAlreadyLinked(remoteHostId);
        }
        // TODO Validate public url
        this.remoteHosts.set(remoteHostId, remoteHost);
    }

    /**
     * Checks if this cluster host already contains the given client.
     * @param {string} clientUuid    The unique ID of the client.
     */
    checkClientExists(clientUuid) {
        return this.remoteHosts.has(clientUuid);
    }

    startPerformanceTest(config) {}

    async _determineSpammerClients(config) {
        for (const remoteHost of this.remoteHosts) {
            const result = await this.httpClient.get(`http://${remoteHost.socketAddress}/v1/internal/performance`);
            logger.info(result);
        }
        if (this.remoteHosts.size <= 0) {
            throw new NotEnoughClients();
        }
    }

    _sendSpammerClientRequest(config, remoteHost) {}
}

module.exports = { SpammerHostManager, ClientIdAlreadyLinked };
