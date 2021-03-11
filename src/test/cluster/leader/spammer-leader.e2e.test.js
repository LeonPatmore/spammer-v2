const { SpammerLeader } = require('../../../cluster/leader/spammer-leader');
const sleep = require('../../../utils/sleep');
const jobTypes = require('../../../cluster/job-types');
const { followerJobStatus } = require('../../../cluster/leader/follower-job');
const { performanceTestStatus } = require('../../../cluster/leader/performance-test');

let spammerLeader;

const configString = `function runRequest() {
    console.log("hi")
}

module.exports = {
    runtimeSeconds: 5,
    runRequest: runRequest
}`;

beforeEach(() => {
    spammerLeader = new SpammerLeader();
});

afterEach(() => {
    spammerLeader.close();
});

describe('Add performance test', () => {
    it('WHEN adding a valid performance test THEN test is started and completed', async () => {
        spammerLeader.updateFollower('follower-id', 'status', true);

        const configStringWithCustomMetric = `function runRequest() {
            console.log("hi")
        }

        module.exports = {
            runtimeSeconds: 5,
            runRequest: runRequest,
            metrics: {
                custom_metric: {
                    type: 'per_request_value'
                }
            }
        }`;

        const performanceUuid = spammerLeader.addPerformanceTestToQueue(configStringWithCustomMetric);
        const performanceTest = spammerLeader.getPerformanceTest(performanceUuid);

        const firstJob = await waitForNextFollowerJob('follower-id');

        expect(firstJob.type).toEqual(jobTypes.PERFORMANCE_PLAN);
        expect(firstJob.status).toEqual(followerJobStatus.WAITING);
        expect(performanceTest.status).toEqual(performanceTestStatus.WAITING_FOR_FOLLOWERS);
        const planJobUuid = firstJob.uuid;

        spammerLeader.handleJobUpdate('follower-id', planJobUuid, followerJobStatus.COMPLETED);

        const secondJob = await waitForNextFollowerJob('follower-id');
        expect(secondJob.type).toEqual(jobTypes.PERFORMANCE_RUN);
        expect(secondJob.status).toEqual(followerJobStatus.WAITING);
        expect(performanceTest.status).toEqual(performanceTestStatus.RUNNING);
        const runJobUuid = secondJob.uuid;

        spammerLeader.handleJobUpdate('follower-id', runJobUuid, followerJobStatus.COMPLETED, {
            successful_requests: 5,
            total_requests: 4,
            custom_metric: 1,
        });

        expect(performanceTest.status).toEqual(performanceTestStatus.DONE);
        expect(performanceTest.result).toEqual({
            successful_requests: 5,
            total_requests: 4,
            custom_metric: [1],
        });
    });
    it('WHEN adding a valid performance test AND there are no followers THEN test is waiting for followers', async () => {
        const performanceUuid = spammerLeader.addPerformanceTestToQueue(configString);
        const performanceTest = spammerLeader.getPerformanceTest(performanceUuid);

        await waitForPerformanceTestStatus(performanceTest, performanceTestStatus.WAITING_FOR_ENOUGH_FOLLOWERS);
    });
});

describe('Follower manager tests', () => {
    it('Test that follower gets removed when there are no updates', async () => {
        spammerLeader.connectedFollowers.set('some-id', {
            uuid: 'some-id',
            available: true,
            status: 'status',
            lastUpdate: new Date(),
            jobs: [],
        });
        await waitForMissingConnectedFollower('some-id');
    }, 10000);
});

const waitForMissingConnectedFollower = async (followerUuid, delay = 100, attempts = 60) => {
    for (let i = 0; i < attempts; i++) {
        if (!spammerLeader.connectedFollowers.has(followerUuid)) return;
        await sleep(delay);
    }
    throw new Error('Performance test did not go to the expected status!');
};

const waitForPerformanceTestStatus = async (performanceTest, expectedStatus, delay = 100, attempts = 60) => {
    for (let i = 0; i < attempts; i++) {
        if (performanceTest.status == expectedStatus) return;
        await sleep(delay);
    }
    throw new Error('Performance test did not go to the expected status!');
};

const waitForNextFollowerJob = async (followerUuid, delay = 100, attempts = 60) => {
    for (let i = 0; i < attempts; i++) {
        const activeJobs = spammerLeader.followerJobRepository.getActiveJobsForFollower(followerUuid);
        if (activeJobs && activeJobs.length > 0) return activeJobs[0];
        await sleep(delay);
    }
    throw new Error('Could not find next follower job!');
};
