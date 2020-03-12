class ClusterHost {
    constructor() {
        this.clients = [];
    }
    addHost(host) {
        this.clients.push(host);
    }
}
