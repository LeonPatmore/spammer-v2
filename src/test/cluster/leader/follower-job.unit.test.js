const { FollowerJob } = require('../../../cluster/leader/follower-job');

it('WHEN status change THEN call status change callback and set status and result', () => {
    const statusChangeCallback = jest.fn();
    followerJob = new FollowerJob({}, 'some-type', status => statusChangeCallback(status));

    followerJob.changeStatus('new-status', 'result');

    expect(followerJob.status).toEqual('new-status');
    expect(followerJob.result).toEqual('result');
    expect(statusChangeCallback).toHaveBeenCalledWith('new-status');
});

it('WHEN status change to same status THEN status change callback is not called', () => {
    const statusChangeCallback = jest.fn();
    followerJob = new FollowerJob({}, 'some-type', status => statusChangeCallback(status));
    followerJob.status = 'new-status';

    followerJob.changeStatus('new-status', 'result');

    expect(statusChangeCallback).toHaveBeenCalledTimes(0);
});

it('WHEN status change with no callback set THEN there is no errror and status and result are set', () => {
    followerJob = new FollowerJob({}, 'some-type');

    followerJob.changeStatus('new-status', 'result');

    expect(followerJob.status).toEqual('new-status');
    expect(followerJob.result).toEqual('result');
});
