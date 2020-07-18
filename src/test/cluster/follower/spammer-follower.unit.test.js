const { SpammerFollower } = require('../../../cluster/follower/spammer-follower');
const { followerJobStatus } = require('../../../cluster/leader/follower-job');
const jobTypes = require('../../../cluster/job-types');
const spammerLeaderClients = require('../../../cluster/follower/leader-clients/spammer-leader-client');
const sleep = require('../../../utils/sleep');
jest.mock('../../../cluster/follower/leader-clients/spammer-leader-client');

spammerLeaderClients.v1.updateJobStatus.mockImplementation(() => {});

let spammerFollower;

const getNexmoJobUpdate = async (delay = 100, attempts = 60) => {
    for (let i = 0; i < attempts; i++) {
        const calls = spammerLeaderClients.v1.updateJobStatus.mock.calls.length;
        if (calls > 0) {
            console.log('Found update job status!');
            return spammerLeaderClients.v1.updateJobStatus.mock.calls[0];
        }
        await sleep(delay);
    }
    throw new Error('Could not find job update!');
};

beforeEach(() => {
    spammerFollower = new SpammerFollower();
    spammerFollower.leaders.set('a-leader-id', {
        socketAddress: 'a-socket-address',
        version: 'v1',
        uuid: 'a-leader-id',
    });
});

afterEach(() => {
    spammerFollower.close();
});

describe('Handle job tests', () => {
    it('WHEN job has already been handled THEN do nothing', () => {
        spammerFollower.jobsHandled.push('some-id');

        spammerFollower.handleJob('leader-id', 'some-id', {}, 'job-type');

        expect(spammerFollower.jobUpdateQueue.length).toEqual(0);
    });

    it('WHEN unknown leader THEN throw error', () => {
        expect(() => spammerFollower.handleJob('leader-id', 'some-id', {}, 'job-type')).toThrow();
    });

    it('WHEN unknown how to handle job THEN reject job', async () => {
        spammerFollower.handleJob('a-leader-id', 'job-id', {}, 'some-job');

        const jobUpdate = await getNexmoJobUpdate();
        expect(jobUpdate).toEqual([
            'a-socket-address',
            spammerFollower.uuid,
            'job-id',
            followerJobStatus.REJECTED,
            undefined,
        ]);
    });

    describe('Handle performance plan', () => {
        it('WHEN already running performance test THEN reject job', async () => {
            spammerFollower.performanceRun.uuid = 'some-run-id';

            spammerFollower.handleJob('a-leader-id', 'job-id', {}, jobTypes.PERFORMANCE_PLAN);

            const jobUpdate = await getNexmoJobUpdate();
            expect(jobUpdate).toEqual([
                'a-socket-address',
                spammerFollower.uuid,
                'job-id',
                followerJobStatus.REJECTED,
                undefined,
            ]);
        });

        it('WHEN valid THEN set performance run and complete job', async () => {
            spammerFollower.handleJob(
                'a-leader-id',
                'job-id',
                {
                    performanceUuid: 'some-performance-id',
                    config: 'module.exports={runtimeSeconds:5,runRequest:()=>{}}',
                },
                jobTypes.PERFORMANCE_PLAN
            );

            const jobUpdate = await getNexmoJobUpdate();
            expect(jobUpdate).toEqual([
                'a-socket-address',
                spammerFollower.uuid,
                'job-id',
                followerJobStatus.COMPLETED,
                undefined,
            ]);

            expect(spammerFollower.performanceRun.uuid).toEqual('some-performance-id');
            expect(spammerFollower.performanceRun.run).toBeTruthy();
        });
    });

    describe('Handle performance run', () => {
        it('WHEN performance id does not match existing THEN reject job', async () => {
            spammerFollower.performanceRun.uuid = 'some-id';
            spammerFollower.handleJob(
                'a-leader-id',
                'job-id',
                {
                    performanceUuid: 'some-id-2',
                },
                jobTypes.PERFORMANCE_RUN
            );

            const jobUpdate = await getNexmoJobUpdate();
            expect(jobUpdate).toEqual([
                'a-socket-address',
                spammerFollower.uuid,
                'job-id',
                followerJobStatus.REJECTED,
                undefined,
            ]);
        });

        it('WHEN valid THEN start performance run and accept job', async () => {
            const performanceRunFunction = jest.fn();
            spammerFollower.performanceRun = {
                uuid: 'some-id',
                run: {
                    run: performanceRunFunction,
                },
            };
            spammerFollower.handleJob(
                'a-leader-id',
                'job-id',
                {
                    performanceUuid: 'some-id',
                },
                jobTypes.PERFORMANCE_RUN
            );

            expect(performanceRunFunction).toBeCalledTimes(1);

            const jobUpdate = await getNexmoJobUpdate();
            expect(jobUpdate).toEqual([
                'a-socket-address',
                spammerFollower.uuid,
                'job-id',
                followerJobStatus.ACCEPTED,
                undefined,
            ]);
        });
    });
});
