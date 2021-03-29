const HttpServer = require('../../server/http-server');
const httpStatus = require('http-status-codes');
const { SpammerLeader } = require('./spammer-leader');
const { spammerErrorHandler, InvalidParamErrorBuilder } = require('../spammer-http-error-handler');

/**
 * Generates an object of readable metrics given the original object of metrics.
 * @param {object} metricsConfig A metrics object.
 */
function _readableMetrics(metricsConfig) {
    const readableMetrics = {};
    for (const metric in metricsConfig) {
        if (!Array.isArray(metricsConfig[metric]) || metricsConfig[metric].length < 5) {
            readableMetrics[metric] = metricsConfig[metric];
        }
    }
    return readableMetrics;
}

class SpammerLeaderHttp extends SpammerLeader {
    /**
     * Create an instance of the Spammer server as a host.
     * @param {string} hostname The hostname of the server.
     * @param {Int16Array} port The port of the server.
     */
    constructor(hostname, port, persistenceClient) {
        super(persistenceClient);
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
                try {
                    const testUuid = this.addPerformanceTestToQueue(req.body);
                    res.json({
                        test_uuid: testUuid,
                    }).end();
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            }
        );

        this.httpServer.addGetHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performancePath}`,
            (req, res) => {
                const performanceTests = this.performanceTests.map(test => {
                    return {
                        uuid: test.uuid,
                        metrics_config: test.metricsConfig,
                        status: test.status,
                        followers: test.followers,
                        run_jobs: test.runJobs,
                        plan_jobs: test.planJobs,
                        result: test.result,
                    };
                });
                res.json({ performance_tests: performanceTests }).end();
            }
        );

        this.httpServer.addGetHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performancePath}/:performanceUuid`,
            (req, res) => {
                const performanceUuid = req.params.performanceUuid;
                const performanceTest = this.getPerformanceTest(performanceUuid);
                res.json({
                    uuid: performanceTest.uuid,
                    metrics_config: performanceTest.metricsConfig,
                    status: performanceTest.status,
                    followers: performanceTest.followers,
                    run_jobs: performanceTest.runJobs,
                    plan_jobs: performanceTest.planJobs,
                    result: performanceTest.result,
                }).end();
            }
        );

        this.httpServer.addGetHandler(
            `/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.performanceMetricsPath}`,
            (req, res) => {
                const performanceUuid = req.params.performanceUuid;
                const performanceTest = this.getPerformanceTest(performanceUuid);
                res.json(_readableMetrics(performanceTest.result)).end();
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
                const activeJobs = this.updateFollower(
                    req.body.uuid,
                    req.body.status,
                    req.body.available,
                    req.body.job_uuid,
                    req.body.job_status
                );
                const responseConfig = {
                    uuid: this.uuid,
                    jobs: activeJobs,
                };
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
                    console.log(e);
                }
            }
        );

        this.httpServer.addGetHandler(`/${SpammerLeaderHttp.version}/${SpammerLeaderHttp.infoPath}`, (_, res) => {
            res.json({
                uuid: this.uuid,
            }).end();
        });

        this.httpServer.addErrorHandler(spammerErrorHandler);
    }

    /**
     * Close all resources.
     */
    async close() {
        await super.close();
        await this.httpServer.closeServer();
    }
}

SpammerLeaderHttp.infoPath = 'info';
SpammerLeaderHttp.followerPath = 'follower';
SpammerLeaderHttp.jobPath = 'job';
SpammerLeaderHttp.jobStatusPath = `${SpammerLeaderHttp.jobPath}/status`;
SpammerLeaderHttp.followerStatusPath = `${SpammerLeaderHttp.followerPath}/status`;
SpammerLeaderHttp.clientPath = 'clients';
SpammerLeaderHttp.performancePath = 'performance';
SpammerLeaderHttp.performanceMetricsPath = `${SpammerLeaderHttp.performancePath}/:performanceUuid/metrics`;

module.exports = SpammerLeaderHttp;
