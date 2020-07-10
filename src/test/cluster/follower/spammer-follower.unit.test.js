const { SpammerFollower, FollowerAlreadyRunningPerformance } = require('../../../cluster/follower/spammer-follower');

describe('Performance run tests', () => {
    let spammerFollower;
    beforeEach(() => {
        spammerFollower = new SpammerFollower();
    });
    it('Ensure that startRun throws exception when follower is already running a performance test', () => {
        spammerFollower.performanceRunId = 'some-id';
        expect(() => {
            spammerFollower.startRun({ run_id: 'another-id' });
        }).toThrow(FollowerAlreadyRunningPerformance);
    });
    it('Ensure that startRun sets the performance run ID to the correct value', () => {
        spammerFollower.startRun('some-id');
        expect(spammerFollower.performanceRunId).toEqual('some-id');
    });
});
