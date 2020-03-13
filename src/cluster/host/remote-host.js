class RemoteHost {
    constructor(socketAddress) {
        this.socketAddress = socketAddress;
        this.connected = false;
    }
}

module.exports = RemoteHost;
