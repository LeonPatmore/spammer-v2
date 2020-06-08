const ClusterClientHttp = require('./cluster-client-http');

class ClientAlreadyRunningPerformance extends Error {
    constructor(performanceRunId) {
        super();
        this.performanceRunId = performanceRunId;
    }
}

class SpammerClient {
    constructor(clusterClient) {
        this.performanceRunId = null;
        this.clusterClient = clusterClient;
    }

    /**
     *
     */
    hasRun() {
        return this.performanceRunId != null;
    }

    /**
     *
     */
    startRun(runConfig) {
        if (this.hasRun()) {
            throw new ClientAlreadyRunningPerformance(this.performanceRunId);
        }
        this.performanceRunId = runConfig.run_id;
    }
}

module.exports = { SpammerClient, ClientAlreadyRunningPerformance };
