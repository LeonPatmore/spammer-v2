class ClientAlreadyLinkedError extends Error {
    constructor(linkedId) {
        super();
        this.linkedId = linkedId;
    }
}

class ClusterClient {
    constructor() {
        this.linkedHostId = null;
    }

    /**
     * Returns true if the client is linked to a host.
     */
    isLinked() {
        return this.linkedHostId != null;
    }

    /**
     * Link the client to a new host.
     * @param {String} hostId The host ID to link.
     */
    linkHost(hostId) {
        if (this.linkedHostId != null) {
            throw new ClientAlreadyLinkedError(this.linkedHostId);
        }
        this.linkedHostId = hostId;
    }
}

module.exports = { ClusterClient, ClientAlreadyLinkedError };
