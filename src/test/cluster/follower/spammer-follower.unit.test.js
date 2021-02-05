const { SpammerFollower } = require('../../../cluster/follower/spammer-follower');
const { followerJobStatus } = require('../../../cluster/leader/follower-job');
const jobTypes = require('../../../cluster/job-types');
const sleep = require('../../../utils/sleep');
const { ConnectedLeaders } = require('../../../cluster/follower/connected-leaders/connected-leaders');
const logger = require('../../../logger/logger');
jest.mock('../../../cluster/follower/connected-leaders/connected-leaders');

const getNexmoJobUpdate = async (delay = 100, attempts = 60) => {
    for (let i = 0; i < attempts; i++) {
        const calls = spammerLeaderClients.v1.updateJobStatus.mock.calls.length;
        if (calls > 0) {
            return spammerLeaderClients.v1.updateJobStatus.mock.calls[0];
        }
        await sleep(delay);
    }
    throw new Error('Could not find job update!');
};

describe('Handle job tests', () => {
    let spammerFollower;

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

describe('Initial leader tests', () => {
    let spammerFollower;

    const waitForLeader = async (spammerFollower, delay = 100, attempts = 20) => {
        for (let i = 0; i < attempts; i++) {
            try {
                expect(spammerFollower.connectedLeaders.addLeader).toBeCalledWith('socket.address:1234', 'v1');
                return;
            } catch (ignore) {}
            await sleep(delay);
        }
        throw new Error('Could not find leader!');
    };

    afterEach(() => {
        spammerFollower.close();
    });

    it('WHEN inital leader given with no version THEN adds the leader with follower version', async () => {
        spammerFollower = new SpammerFollower(null, 'socket.address:1234');

        await waitForLeader(spammerFollower);

        // const leader = await waitForLeader('some-leader-uuid');
        // expect(leader.uuid).toEqual('some-leader-uuid');
        // expect(leader.version).toEqual(SpammerFollower.version);
        // expect(leader.socketAddress).toEqual('socket.address:1234');
    });

    it('WHEN inital leader given with version THEN adds the leader with follower version', async () => {
        spammerLeaderClients.v1.updateLeader.mockImplementation(() => {
            return {
                uuid: 'some-leader-uuid',
            };
        });

        spammerFollower = new SpammerFollower('socket.address:1234', 'v1');

        const leader = await waitForLeader('some-leader-uuid');
        expect(leader.uuid).toEqual('some-leader-uuid');
        expect(leader.version).toEqual('v1');
        expect(leader.socketAddress).toEqual('socket.address:1234');
    });
});
