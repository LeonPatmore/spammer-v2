/**
 *  Logic for leading the cluster of Spammers.
 */

const logger = require('../../logger/application-logger');
const { v4: uuidv4 } = require('uuid');
const { HttpAwareError } = require('../spammer-http-error-handler');
const spammerFollowerClients = require('./follower-clients/spammer-follower-clients');
const { PerformanceTest, performanceTestStatus } = require('./performance-test');
const { FollowerJobRepository } = require('./follower-job-repository');

class SpammerLeader {
    constructor() {
        this.uuid = uuidv4();
        logger.info(`Starting cluster host with id [ ${this.uuid} ]`);
        this.followerJobRepository = new FollowerJobRepository();
        this.connectedFollowers = new Map();
        this.performanceTests = [];
        setInterval(() => this._managePerformanceTests(), 5000);
    }

    async _managePerformanceTests() {
        if (this.performanceTests.length <= 0) return;
        const currentPerformanceTest = this.performanceTests[0];
        if (
            currentPerformanceTest.status == performanceTestStatus.IN_QUEUE ||
            currentPerformanceTest.status == performanceTestStatus.WAITING_FOR_ENOUGH_FOLLOWERS
        ) {
            logger.info(`Picking up performance test [ ${currentPerformanceTest.uuid} ]`);
            const availableFollowers = this._getAvailableFollowers();
            if (availableFollowers.length <= 0) {
                // logger.info(`Waiting for at-least one available follower!`);
                currentPerformanceTest.status = performanceTestStatus.WAITING_FOR_ENOUGH_FOLLOWERS;
                return;
            }
            this._assignJobsToFollowers(currentPerformanceTest, availableFollowers);
            currentPerformanceTest.status = performanceTestStatus.WAITING_FOR_FOLLOWERS;
        } else if (currentPerformanceTest.status == performanceTestStatus.WAITING_FOR_FOLLOWERS) {
        }
    }

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
     * @param {string} config
     */
    addPerformanceTestToQueue(config) {
        const performanceTest = new PerformanceTest(config);
        this.performanceTests.push(performanceTest);
        return performanceTest.uuid;
    }

    /**
     * Update a follower.
     * @param {string} followerUuid The ID of the follower.
     * @param {string} status       The status of the follower.
     * @param {string} available    The availability of the follower, indicating if the follower can run a performance test.
     */
    updateFollower(followerUuid, status, available) {
        // Get active job.
        const activeJob = this.followerJobRepository.getActiveJobForFollower(followerUuid);
        // Set follower information.
        this.connectedFollowers.set(followerUuid, {
            uuid: followerUuid,
            available: available,
            status: status,
            lastUpdate: new Date(),
            job: activeJob,
        });
        return activeJob;
    }

    handleJobUpdate(followerUuid, jobUuid, jobStatus) {
        logger.debug(
            `Handling job update [ ${jobUuid} ] with status [ ${jobStatus} ] from follower [ ${followerUuid} ]`
        );
        const job = this.followerJobRepository.getJobWithId(followerUuid, jobUuid);
        job.changeStatus(jobStatus);
        logger.info(`Job with ID [ ${jobUuid} ] has updated with status [ ${jobStatus} ]`);
    }

    /**
     * Get a list of clients and the relevant information.
     */
    async followersToJson() {
        const followers = [];
        for (const follower of this.connectedFollowers.values()) {
            let isRunning = 'unknown';
            try {
                isRunning = await spammerFollowerClients[follower.version].runningPerformanceRun(
                    follower.socketAddress
                );
            } catch (e) {
                logger.warn(`Cannot determine if follower [ ${follower.uuid} ] is running!`);
            }
            followers.push(Object.assign({ running: isRunning }, follower));
        }
        return followers;
    }

    close() {}
}

SpammerLeader.version = 'v1';

module.exports = { SpammerLeader };
