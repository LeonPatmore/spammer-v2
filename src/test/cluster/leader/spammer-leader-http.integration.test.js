/**
 * @jest-environment node
 */

const SpammerLeaderHttp = require('../../../cluster/leader/spammer-leader-http');
const sendRequest = require('../../test-http-client');
const { FollowerJob } = require('../../../cluster/leader/follower-job');

const spammerPort = 23334;

const configString = `function runRequest() {
    console.log("hi")
}

module.exports = {
    runtimeSeconds: 5,
    runRequest: runRequest
}`;

describe('API Tests', () => {
    let spammerLeaderInstance;

    beforeEach(() => {
        spammerLeaderInstance = new SpammerLeaderHttp('0.0.0.0', spammerPort);
    });

    afterEach(async () => {
        await spammerLeaderInstance.close();
        console.log('Done closing spammer leader instance!');
    });

    describe('Clients path', () => {
        it('Test get clients request WHEN no clients THEN ok response with no clients', async () => {
            const response = await sendRequest(spammerPort, 'GET', 'v1/clients');

            expect(response.status).toEqual(200);
            expect(response.data).toHaveProperty('clients');
            expect(response.data.clients).toHaveLength(0);
        });

        it('Test get clients request WHEN there is a client THEN ok response with expected client', async () => {
            spammerLeaderInstance.connectedFollowers.set('uuid', {
                uuid: 'uuid',
                socketAddress: 'socketAddress',
                version: 'v1',
            });

            const response = await sendRequest(spammerPort, 'GET', 'v1/clients');

            expect(response.status).toEqual(200);
            expect(response.data).toHaveProperty('clients');
            expect(response.data.clients).toHaveLength(1);
            expect(response.data.clients[0]).toHaveProperty('uuid');
            expect(response.data.clients[0].uuid).toEqual('uuid');
            expect(response.data.clients[0]).toHaveProperty('socketAddress');
            expect(response.data.clients[0].socketAddress).toEqual('socketAddress');
            expect(response.data.clients[0]).toHaveProperty('version');
            expect(response.data.clients[0].version).toEqual('v1');
        });
    });

    describe('Performance path', () => {
        it('Test get performance WHEN no performance THEN bad response', async () => {
            const response = await sendRequest(spammerPort, 'GET', 'v1/performance/123');

            expect(response.status).toEqual(404);
        });

        it('Test get performance WHEN valid THEN ok response', async () => {
            spammerLeaderInstance.performanceTests.push({
                uuid: 'some-id',
                status: 'some-status',
                followers: 'some-followers',
                runJobs: 'some-run-jobs',
                planJobs: 'some-plan-jobs',
                result: 'some-result',
            });

            const response = await sendRequest(spammerPort, 'GET', 'v1/performance/some-id');

            expect(response.status).toEqual(200);
            expect(response.data.uuid).toEqual('some-id');
            expect(response.data.status).toEqual('some-status');
            expect(response.data.followers).toEqual('some-followers');
            expect(response.data.run_jobs).toEqual('some-run-jobs');
            expect(response.data.plan_jobs).toEqual('some-plan-jobs');
            expect(response.data.result).toEqual('some-result');
        });

        it('Test get performance metrics WHEN no performance test THEN not found response', async () => {
            const response = await sendRequest(spammerPort, 'GET', 'v1/performance/some-id');

            expect(response.status).toEqual(404);
            expect(response.data.errors).toHaveLength(1);
            expect(response.data.errors[0]).toEqual('can not find performance test with id some-id!');
        });

        it('Test get performance metrics WHEN performance test THEN returns metrics with long metrics removed for readability', async () => {
            spammerLeaderInstance.performanceTests.push({
                uuid: 'some-id',
                status: 'some-status',
                followers: 'some-followers',
                runJobs: 'some-run-jobs',
                planJobs: 'some-plan-jobs',
                result: {
                    'some-metric': 5,
                    'another-metric': 'hi',
                    'short-list': [1, 2],
                    'long-list': [1, 2, 3, 4, 5, 6, 7, 8],
                },
            });

            const response = await sendRequest(spammerPort, 'GET', 'v1/performance/some-id/metrics');

            expect(response.status).toEqual(200);
            expect(response.data).toHaveProperty('some-metric');
            expect(response.data['some-metric']).toEqual(5);
            expect(response.data).toHaveProperty('another-metric');
            expect(response.data['another-metric']).toEqual('hi');
            expect(response.data).toHaveProperty('short-list');
            expect(response.data['short-list']).toEqual([1, 2]);
            expect(response.data).not.toHaveProperty('long-list');
        });

        it('Test start test WHEN more than one client THEN ok response', async () => {
            spammerLeaderInstance.connectedFollowers.set('uuid', {
                uuid: 'uuid',
                socketAddress: 'socketAddress',
                version: 'v1',
            });

            const response = await sendRequest(spammerPort, 'POST', 'v1/performance', configString, {
                'Content-Type': 'application/javascript',
            });
            expect(response.status).toEqual(200);
        });
    });

    describe('Follower status path', () => {
        it('Test put status WHEN no uuid THEN bad response', async () => {
            const response = await sendRequest(spammerPort, 'PUT', 'v1/follower/status', {
                status: 'some-status',
                available: 'available',
            });

            expect(response.status).toEqual(400);
            expect(response.data.errors).toHaveLength(1);
            expect(response.data.errors[0].paramName).toEqual('uuid');
            expect(response.data.errors[0].reason).toEqual('parameter missing');
        });
        it('Test put status WHEN no status THEN bad response', async () => {
            const response = await sendRequest(spammerPort, 'PUT', 'v1/follower/status', {
                uuid: 'some-uuid',
                available: 'available',
            });

            expect(response.status).toEqual(400);
            expect(response.data.errors).toHaveLength(1);
            expect(response.data.errors[0].paramName).toEqual('status');
            expect(response.data.errors[0].reason).toEqual('parameter missing');
        });
        it('Test put status WHEN no available THEN bad response', async () => {
            const response = await sendRequest(spammerPort, 'PUT', 'v1/follower/status', {
                status: 'some-status',
                uuid: 'some-uuid',
            });

            expect(response.status).toEqual(400);
            expect(response.data.errors).toHaveLength(1);
            expect(response.data.errors[0].paramName).toEqual('available');
            expect(response.data.errors[0].reason).toEqual('parameter missing');
        });
        it('Test put status WHEN valid THEN ok response and follower is updated', async () => {
            const response = await sendRequest(spammerPort, 'PUT', 'v1/follower/status', {
                status: 'some-status',
                available: false,
                uuid: 'some-uuid',
            });

            expect(response.status).toEqual(200);
            expect(response.data.uuid).toEqual(spammerLeaderInstance.uuid);
            expect(spammerLeaderInstance.connectedFollowers.has('some-uuid')).toBeTruthy();
            expect(spammerLeaderInstance.connectedFollowers.get('some-uuid').uuid).toEqual('some-uuid');
            expect(spammerLeaderInstance.connectedFollowers.get('some-uuid').available).toEqual(false);
            expect(spammerLeaderInstance.connectedFollowers.get('some-uuid').status).toEqual('some-status');
        });
    });

    describe('Job status path', () => {
        it('Test put status WHEN job no valid THEN bad response', async () => {
            const response = await sendRequest(spammerPort, 'PUT', 'v1/job/status', {
                follower_uuid: 'follower-id',
                job_uuid: 'job-id',
            });
            expect(response.status).toEqual(400);
            expect(response.data.errors).toHaveLength(1);
            expect(response.data.errors[0]).toEqual('job with ID job-id does not exist!');
        });
        it('Test put status WHEN valid THEN ok response', async () => {
            spammerLeaderInstance.updateFollower('follower-id', 'status', false);
            const statusChangeCallback = jest.fn();
            const job = new FollowerJob({}, 'type', status => statusChangeCallback(status));
            spammerLeaderInstance.followerJobRepository.addJob('follower-id', job);

            const response = await sendRequest(spammerPort, 'PUT', 'v1/job/status', {
                follower_uuid: 'follower-id',
                job_status: 'new-status',
                job_result: 'the-result',
                job_uuid: job.uuid,
            });

            expect(response.status).toEqual(200);
            expect(statusChangeCallback).toHaveBeenCalledWith('new-status');
            expect(job.result).toEqual('the-result');
        });
    });

    describe('Info path', () => {
        it('Test info path returns the id of the leader', async () => {
            const response = await sendRequest(spammerPort, 'GET', 'v1/info');

            expect(response.status).toEqual(200);
            expect(response.data.uuid).toEqual(spammerLeaderInstance.uuid);
        });
    });
});
