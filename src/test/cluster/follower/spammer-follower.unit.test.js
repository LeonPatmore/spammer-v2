const { SpammerFollower } = require('../../../cluster/follower/spammer-follower');
const { followerJobStatus } = require('../../../cluster/leader/follower-job');
const jobTypes = require('../../../cluster/job-types');
const sleep = require('../../../utils/sleep');
const JobsHandledPersistenceMock = require('./jobs-handled-persistence-mock');
jest.mock('../../../cluster/follower/connected-leaders/connected-leaders');

describe('Handle job tests', () => {
    let spammerFollower;

    beforeEach(() => {
        spammerFollower = new SpammerFollower(new JobsHandledPersistenceMock());
        spammerFollower.connectedLeaders.getLeader.mockImplementation(uuid => {
            if (uuid == 'a-leader-id') {
                return {
                    socketAddress: 'a-socket-address',
                    version: 'v1',
                    uuid: 'a-leader-id',
                };
            } else {
                throw new UnknownLeaderError(uuid);
            }
        });
        spammerFollower.connectedLeaders.hasUuid.mockImplementation(uuid => {
            return uuid == 'a-leader-id';
        });
    });

    afterEach(() => {
        spammerFollower.close();
    });

    it('WHEN job has already been handled THEN do nothing', () => {
        spammerFollower.jobsHandledPersistence.hasJob.mockReturnValue(true);

        const returnedValue = spammerFollower.handleJob('leader-id', 'some-id', {}, 'job-type');

        expect(returnedValue).toBeUndefined();
    });

    it('WHEN unknown leader THEN throw error', () => {
        expect(() => spammerFollower.handleJob('leader-id', 'some-id', {}, 'job-type')).toThrow();
    });

    it('WHEN unknown how to handle job THEN reject job', async () => {
        const { status } = spammerFollower.handleJob('a-leader-id', 'job-id', {}, 'some-job');

        expect(status).toEqual(followerJobStatus.REJECTED);
    });

    describe('Handle performance plan', () => {
        it('WHEN already running performance test THEN reject job', async () => {
            spammerFollower.performanceRun.uuid = 'some-run-id';

            const { status } = spammerFollower.handleJob('a-leader-id', 'job-id', {}, jobTypes.PERFORMANCE_PLAN);

            expect(status).toEqual(followerJobStatus.REJECTED);
        });

        it('WHEN valid THEN set performance run and complete job', async () => {
            const { status } = spammerFollower.handleJob(
                'a-leader-id',
                'job-id',
                {
                    performanceUuid: 'some-performance-id',
                    config: 'module.exports={runtimeSeconds:5,runRequest:()=>{}}',
                },
                jobTypes.PERFORMANCE_PLAN
            );

            expect(status).toEqual(followerJobStatus.COMPLETED);

            expect(spammerFollower.performanceRun.uuid).toEqual('some-performance-id');
            expect(spammerFollower.performanceRun.run).toBeTruthy();
        });
    });

    describe('Handle performance run', () => {
        it('WHEN performance id does not match existing THEN reject job', async () => {
            spammerFollower.performanceRun.uuid = 'some-id';
            const { status } = spammerFollower.handleJob(
                'a-leader-id',
                'job-id',
                {
                    performanceUuid: 'some-id-2',
                },
                jobTypes.PERFORMANCE_RUN
            );
            expect(status).toEqual(followerJobStatus.REJECTED);
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
        });
    });
});

describe('Initial leader tests', () => {
    let spammerFollower;

    const waitForLeader = async (spammerFollower, version, delay = 100, attempts = 20) => {
        for (let i = 0; i < attempts; i++) {
            try {
                expect(spammerFollower.connectedLeaders.addLeader).toBeCalledWith('socket.address:1234', version);
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

        await waitForLeader(spammerFollower, SpammerFollower.version);
    });

    it('WHEN inital leader given with version THEN adds the leader with follower version', async () => {
        spammerFollower = new SpammerFollower(null, 'socket.address:1234', 'v2');

        await waitForLeader(spammerFollower, 'v2');
    });
});
