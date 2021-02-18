const { SpammerFollower } = require('../../../cluster/follower/spammer-follower');
const spammerLeaderClients = require('../../../cluster/follower/leader-clients/spammer-leader-client');
const sleep = require('../../../utils/sleep');
const { AssertionError } = require('chai');
jest.mock('../../../cluster/follower/leader-clients/spammer-leader-client');

let spammerFollowerInstance;

// TODO: Make this E2E.

beforeEach(() => {
    spammerFollowerInstance = new SpammerFollower();
});

afterEach(() => {
    spammerFollowerInstance.close();
});

const jobUuid = 'job-uuid';

const waitForJob = async (expected_status, expected_result) => {
    for (var i = 0; i < 20; i++) {
        try {
            expect(spammerLeaderClients.v1.updateJobStatus.mock.calls.length).toEqual(1);
            expect(spammerLeaderClients.v1.updateJobStatus).toHaveBeenCalledWith(
                'host:port',
                expect.anything(),
                jobUuid,
                expected_status,
                expected_result
            );
            return;
        } catch (e) {}
        await sleep(200);
    }
    throw new AssertionError('Could not find expected job in time!');
};

it('', async () => {
    spammerLeaderClients.v1.updateLeader.mockImplementation(() => {
        return {
            jobs: [
                {
                    uuid: jobUuid,
                    config: {},
                    type: 'peformance_plan',
                },
            ],
            uuid: 'leader-id',
        };
    });
    spammerFollowerInstance.performanceRun = {
        uuid: 'some-id',
        run: null,
    };
    await spammerFollowerInstance.addLeader('host:port');

    await waitForJob('rejected', undefined);
});
