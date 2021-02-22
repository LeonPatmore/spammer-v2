const { SpammerFollower } = require('../../../cluster/follower/spammer-follower');
const sleep = require('../../../utils/sleep');
const { AssertionError } = require('chai');
const { start, stop, addLeaderJob, getPort, getJobs, clearJobs } = require('./mock-leader-http-server');

let spammerFollowerInstance;

beforeAll(async () => {
    await start();
});

afterAll(async () => {
    await stop();
});

beforeEach(() => {
    clearJobs();
    spammerFollowerInstance = new SpammerFollower();
});

afterEach(() => {
    spammerFollowerInstance.close();
});

const jobUuid = 'job-uuid';

const waitForJob = async (expected_status, expected_result) => {
    for (var i = 0; i < 20; i++) {
        if (getJobs().length != 1) {
            // TODO : Assert on status and result.
            await sleep(200);
            continue;
        }
        return;
    }
    throw new AssertionError('Could not find expected job in time!');
};

it('Ensure that performance job requests are rejected if follower is already running a performance job', async () => {
    addLeaderJob(jobUuid, {}, 'peformance_plan');
    spammerFollowerInstance.performanceRun = {
        uuid: 'some-id',
        run: null,
    };
    await spammerFollowerInstance.addLeader(`localhost:${getPort()}`);

    await waitForJob('rejected', undefined);
});
