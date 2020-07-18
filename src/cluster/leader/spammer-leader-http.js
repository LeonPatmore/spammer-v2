const HttpServer = require('../../server/http-server');
const httpStatus = require('http-status-codes');
const { SpammerLeader } = require('./spammer-leader');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');

class SpammerLeaderHttp extends SpammerLeader {
    /**
     * Create an instance of the Spammer server as a host.
     * @param {string} hostname The hostname of the server.
     * @param {Int16Array} port The port of the server.
     */
    constructor(hostname, port) {
        super();
        this.httpServer = new HttpServer(hostname, port, ['/v1/follower/status']);

        this.httpServer.addGetHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.clientPath}`,
            async (_, res) => {
                res.status(httpStatus.OK)
                    .json({ clients: Array.from(this.connectedFollowers.values()) })
                    .end();
            }
        );

        this.httpServer.addPostHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performancePath}`,
            (req, res) => {
                const testUuid = this.addPerformanceTestToQueue(req.body);
                res.json({
                    test_uuid: testUuid,
                }).end();
            }
        );

        this.httpServer.addGetHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performancePath}/:performanceUuid`,
            (req, res) => {
                const performanceUuid = req.params.performanceUuid;
                const performanceTest = this.getPerformanceTest(performanceUuid);
                res.json({
                    uuid: performanceTest.uuid,
                    status: performanceTest.status,
                    followers: performanceTest.followers,
                    run_jobs: performanceTest.runJobs,
                    plan_jobs: performanceTest.planJobs,
                    result: performanceTest.result,
                }).end();
            }
        );

        this.httpServer.addPutHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.followerStatusPath}`,
            (req, res) => {
                // TODO: Remove validation.
                const invalidParamErrorBuilder = new InvalidParamErrorBuilder();
                if (!req.body.hasOwnProperty('uuid'))
                    invalidParamErrorBuilder.withInvalidParam('uuid', InvalidParamErrorBuilder.missing);
                if (!req.body.hasOwnProperty('status'))
                    invalidParamErrorBuilder.withInvalidParam('status', InvalidParamErrorBuilder.missing);
                if (!req.body.hasOwnProperty('available'))
                    invalidParamErrorBuilder.withInvalidParam('available', InvalidParamErrorBuilder.missing);
                invalidParamErrorBuilder.throwIfInvalidParams();
                const activeJob = this.updateFollower(
                    req.body.uuid,
                    req.body.status,
                    req.body.available,
                    req.body.job_uuid,
                    req.body.job_status
                );
                const responseConfig = {
                    uuid: this.uuid,
                };
                if (activeJob)
                    // TODO Test this
                    Object.assign(responseConfig, {
                        job: {
                            uuid: activeJob.uuid,
                            type: activeJob.type,
                            config: activeJob.config,
                        },
                    });
                res.json(responseConfig).end();
            }
        );

        this.httpServer.addPutHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.jobStatusPath}`,
            (req, res) => {
                try {
                    this.handleJobUpdate(
                        req.body.follower_uuid,
                        req.body.job_uuid,
                        req.body.job_status,
                        req.body.job_result
                    );
                    res.end();
                } catch (e) {
                    throw e;
                }
            }
        );

        this.httpServer.addErrorHandler(spammerErrorHandler);
    }

    /**
     * Close all resources.
     */
    close() {
        super.close();
        this.httpServer.closeServer();
    }
}

SpammerLeaderHttp.followerPath = 'follower';
SpammerLeaderHttp.jobPath = 'job';
SpammerLeaderHttp.jobStatusPath = `${SpammerLeaderHttp.jobPath}/status`;
SpammerLeaderHttp.followerStatusPath = `${SpammerLeaderHttp.followerPath}/status`;
SpammerLeaderHttp.clientPath = 'clients';
SpammerLeaderHttp.performancePath = 'performance';

module.exports = SpammerLeaderHttp;
