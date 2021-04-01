/**
 *  Logic for leading the cluster of Spammers.
 */

const logger = require('../../logger/application-logger');
const { v4: uuidv4 } = require('uuid');
const { HttpAwareError } = require('../spammer-http-error-handler');
const { PerformanceTest, performanceTestStatus } = require('./performance-test');
const { FollowerJobRepository } = require('./follower-job-repository');
const statusCodes = require('http-status-codes');
const metricsConfigurations = require('./interfaces/metrics/metrics-configurations');
const requireFromString = require('require-from-string');
const SpammerLeaderWebSocket = require('./websocket/spammer-leader-websocket');
const emitter = require('../../events/event-bus');
const leaderEvents = require('./leader-events');
const MetricsStore = require('../../metrics/metric-store');

class UnknownPerformanceTest extends HttpAwareError {
    constructor(performanceUuid) {
        super(`can not find performance test with id ${performanceUuid}!`);
    }
    getHttpCode() {
        return statusCodes.NOT_FOUND;
    }
}

class SpammerLeader {
    /**
     * Manages all logic for distributing performance tests and handling update.
     */
    constructor(persistenceClient) {
        this.persistenceClient = persistenceClient;
        this.uuid = uuidv4();
        logger.info(`Starting cluster leader with id [ ${this.uuid} ]`);
        this.followerJobRepository = new FollowerJobRepository();
        this.connectedFollowers = new Map();
        this.performanceTests = [];
        this.managePerformanceTestsInterval = setInterval(() => this._managePerformanceTests(), 1000);
        this.managerFollowersInterval = setInterval(() => this._manageFollowers(), 1000);
        this.websocket = new SpammerLeaderWebSocket(connection => {
            connection.sendUTF(JSON.stringify({ leader: { uuid: this.uuid } }));
        });
    }

    /**
     * Get a performance test.
     * @param {String} performanceUuid  The unique id of the performance test to get.
     */
    getPerformanceTest(performanceUuid) {
        for (const performanceTest of this.performanceTests) {
            if (performanceTest.uuid == performanceUuid) return performanceTest;
        }
        throw new UnknownPerformanceTest(performanceUuid);
    }

    /**
     * Get the latest performance test of this leader.
     */
    _getLatestPerformanceTest() {
        for (const performanceTest of this.performanceTests) {
            if (performanceTest.status != performanceTestStatus.DONE) {
                return performanceTest;
            }
        }
    }

    /**
     * Manage the current performance test.
     */
    async _managePerformanceTests() {
        const currentPerformanceTest = this._getLatestPerformanceTest();
        if (!currentPerformanceTest) return;
        if (
            currentPerformanceTest.status == performanceTestStatus.IN_QUEUE ||
            currentPerformanceTest.status == performanceTestStatus.WAITING_FOR_ENOUGH_FOLLOWERS
        ) {
            logger.info(`Picking up performance test [ ${currentPerformanceTest.uuid} ]`);
            const availableFollowers = this._getAvailableFollowers();
            if (availableFollowers.length <= 0) {
                logger.info(`Waiting for at-least one available follower!`);
                currentPerformanceTest.status = performanceTestStatus.WAITING_FOR_ENOUGH_FOLLOWERS;
                return;
            }
            this._assignJobsToFollowers(currentPerformanceTest, availableFollowers);
            currentPerformanceTest.followers = availableFollowers;
            currentPerformanceTest.status = performanceTestStatus.WAITING_FOR_FOLLOWERS;
        }
    }

    _manageFollowers() {
        this.connectedFollowers.forEach((value, key) => {
            const lastUpdated = value['lastUpdate'];
            const lastUpdatedDiff = new Date().getTime() - lastUpdated.getTime();
            if (lastUpdatedDiff > SpammerLeader.kickFollowerAfterMs) {
                logger.info(
                    `Removing follower [ ${key} ] since it has not received an update for [ ${lastUpdatedDiff}ms ]`
                );
                this.connectedFollowers.delete(key);
                this._followersUpdated();
            }
        });
    }

    _followersUpdated() {
        emitter.emit(leaderEvents.UPDATE_FOLLOWERS, Array.from(this.connectedFollowers.values()));
    }

    /**
     * Assign plan jobs to the available followers for a given performance test.
     * @param {PerformanceTest} performanceTest The performance test to generate plan jobs for.
     * @param {Array} availableFollowers        An array of available followers to plan for.
     */
    _assignJobsToFollowers(performanceTest, availableFollowers) {
        const generatedJobs = [];
        for (const follower of availableFollowers) {
            const job = performanceTest.generateAndAttachPlanJob();
            generatedJobs.push({
                followerUuid: follower.uuid,
                job: job,
            });
        }
        for (const job of generatedJobs) {
            this.followerJobRepository.addJob(job.followerUuid, job.job);
        }
    }

    /**
     * Get a list of the known available followers.
     */
    _getAvailableFollowers() {
        const followers = [];
        for (let follower of this.connectedFollowers.values()) {
            if (follower.available) followers.push(follower);
        }
        return followers;
    }

    /**
     * Add a performance test with the given configuration to the queue.
     * @param {String} config   The performance test configuration.
     */
    addPerformanceTestToQueue(config) {
        const configModule = requireFromString(config);
        const metricsConfig = {
            ...configModule.metrics,
            ...metricsConfigurations(configModule),
        };
        const performanceTest = new PerformanceTest(
            config,
            metricsConfig,
            uuid => new MetricsStore(uuid, this.persistenceClient, metricsConfig)
        );
        performanceTest.planJobsCompletedCallback = () => this._performancePlanCompleted(performanceTest);
        performanceTest.runJobsCompletedCallback = () => this._performanceRunCompleted(performanceTest);
        this.performanceTests.push(performanceTest);
        return performanceTest.uuid;
    }

    /**
     * Handles a performance test plan completion.
     * @param {PerformanceTest} performanceTest The performance test which has been planned.
     */
    _performancePlanCompleted(performanceTest) {
        logger.info(`Send run jobs for performance test [ ${performanceTest.uuid} ]`);
        const generatedJobs = [];
        for (const follower of performanceTest.followers) {
            const job = performanceTest.generateAndAttachRunJob();
            generatedJobs.push({
                followerUuid: follower.uuid,
                job: job,
            });
        }
        for (const job of generatedJobs) {
            this.followerJobRepository.addJob(job.followerUuid, job.job);
        }
        performanceTest.status = performanceTestStatus.RUNNING;
    }

    /**
     * Handles a performance test run completion.
     * @param {PerformanceTest} performanceTest The performance test which has finished.
     */
    _performanceRunCompleted(performanceTest) {
        logger.info(`Completing performance test [ ${performanceTest.uuid} ]`);
        performanceTest.status = performanceTestStatus.DONE;
    }

    /**
     * Update a follower.
     * @param {string} followerUuid The ID of the follower.
     * @param {string} status       The status of the follower.
     * @param {string} available    The availability of the follower, indicating if the follower can run a performance test.
     */
    updateFollower(followerUuid, status, available) {
        const activeJobs = this.followerJobRepository.getActiveJobsForFollower(followerUuid);
        this.connectedFollowers.set(followerUuid, {
            uuid: followerUuid,
            available: available,
            status: status,
            lastUpdate: new Date(),
            jobs: activeJobs,
        });
        this._followersUpdated();
        return activeJobs;
    }

    /**
     * Handles a individual job update.
     * @param {*} followerUuid  Unique id of the follower which owns the job.
     * @param {*} jobUuid       Unique id of the job.
     * @param {*} jobStatus     New job status.
     * @param {*} jobResult     [Optional] Result of the job.
     */
    async handleJobUpdate(followerUuid, jobUuid, jobStatus, jobResult) {
        logger.debug(
            `Handling job update [ ${jobUuid} ] with status [ ${jobStatus} ] and result [ ${jobResult} ] from follower [ ${followerUuid} ]`
        );
        const job = this.followerJobRepository.getJobWithId(followerUuid, jobUuid);
        await job.changeStatus(jobStatus, jobResult);
        logger.info(`Job with ID [ ${jobUuid} ] has updated with status [ ${jobStatus} ]`);
    }

    /**
     * Close the spammer leader.
     */
    async close() {
        clearInterval(this.managePerformanceTestsInterval);
        clearInterval(this.managerFollowersInterval);
        await this.websocket.close();
        await this.persistenceClient.close();
    }
}

SpammerLeader.version = 'v1';
SpammerLeader.kickFollowerAfterMs = 3000;

module.exports = { SpammerLeader };
