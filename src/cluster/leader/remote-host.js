/**
 * An object which represents a remote host.
 */
class RemoteHost {
    constructor(socketAddress, uuid) {
        this.socketAddress = socketAddress;
        this.uuid = uuid;
    }
}

module.exports = RemoteHost;
