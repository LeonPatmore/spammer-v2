const { SpammerClient, ClientAlreadyRunningPerformance } = require('./spammer-client');
const ClusterClientHttp = require('./cluster-client-http');
const httpStatus = require('http-status-codes');

class SpammerClientHttp extends SpammerClient {
    constructor(httpServer) {
        super(new ClusterClientHttp(httpServer));

        this.getRunHandler = (req, res) => {
            if (this.performanceRunId == null) {
                res.status(httpStatus.NOT_FOUND);
            } else {
                res.json({ run_id: this.performanceRunId });
            }
            res.end();
        };

        this.postRunHandler = (req, res) => {
            try {
                if (req.body.hasOwnProperty('run_id')) {
                    this.startRun(req.body);
                } else {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: 'Field `run_id` is required.',
                    });
                }
            } catch (e) {
                if (e instanceof ClientAlreadyRunningPerformance) {
                    res.status(httpStatus.BAD_REQUEST).json({
                        error: `Client is already running a performance test with id ${this.performanceRunId}.`,
                    });
                } else {
                    throw e;
                }
            }
            res.end();
        };

        httpServer.addGetHandler('/run', this.getRunHandler);
        httpServer.addPostHandler('/run', this.postRunHandler);
    }
}

module.exports = SpammerClientHttp;
