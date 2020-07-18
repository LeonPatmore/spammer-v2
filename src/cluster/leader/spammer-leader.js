/**
 *  Logic for leading the cluster of Spammers.
 */

const logger = require('../../logger/application-logger');
const { v4: uuidv4 } = require('uuid');
const { HttpAwareError } = require('../spammer-http-error-handler');
const { PerformanceTest, performanceTestStatus } = require('./performance-test');
const { FollowerJobRepository } = require('./follower-job-repository');
const statusCodes = require('http-status-codes');

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
    constructor() {
        this.uuid = uuidv4();
        logger.info(`Starting cluster host with id [ ${this.uuid} ]`);
        this.followerJobRepository = new FollowerJobRepository();
        this.connectedFollowers = new Map();
        this.performanceTests = [];
        this.managePerformanceTestsInterval = setInterval(() => this._managePerformanceTests(), 1000);
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
        const performanceTest = new PerformanceTest(config);
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
        const activeJob = this.followerJobRepository.getActiveJobForFollower(followerUuid);
        this.connectedFollowers.set(followerUuid, {
            uuid: followerUuid,
            available: available,
            status: status,
            lastUpdate: new Date(),
            job: activeJob,
        });
        return activeJob;
    }

    /**
     * Handles a individual job update.
     * @param {*} followerUuid  Unique id of the follower which owns the job.
     * @param {*} jobUuid       Unique id of the job.
     * @param {*} jobStatus     New job status.
     * @param {*} jobResult     [Optional] Result of the job.
     */
    handleJobUpdate(followerUuid, jobUuid, jobStatus, jobResult) {
        logger.debug(
            `Handling job update [ ${jobUuid} ] with status [ ${jobStatus} ] and result [ ${jobResult} ] from follower [ ${followerUuid} ]`
        );
        const job = this.followerJobRepository.getJobWithId(followerUuid, jobUuid);
        job.changeStatus(jobStatus, jobResult);
        logger.info(`Job with ID [ ${jobUuid} ] has updated with status [ ${jobStatus} ]`);
    }

    /**
     * Close the spammer leader.
     */
    close() {
        clearInterval(this.managePerformanceTestsInterval);
    }
}

SpammerLeader.version = 'v1';

module.exports = { SpammerLeader };
