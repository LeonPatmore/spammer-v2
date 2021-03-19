/**
 * @jest-environment node
 */

const SpammerFollowerHttp = require('../../../cluster/follower/spammer-follower-http');
const sendRequest = require('../../test-http-client');
const spammerLeaderClients = require('../../../cluster/follower/leader-clients/spammer-leader-client');
jest.mock('../../../cluster/follower/leader-clients/spammer-leader-client');

const leaderUuid = 'leader-id';

spammerLeaderClients.v1.updateLeader.mockImplementation(() => {
    return {
        jobs: [],
        uuid: leaderUuid,
    };
});

const spammerPort = 5634;

let spammerFollowerInstance;

beforeEach(() => {
    spammerFollowerInstance = new SpammerFollowerHttp('127.0.0.1', spammerPort);
});

afterEach(async () => {
    await spammerFollowerInstance.close();
});

describe('API Tests', () => {
    it('Test ping endpoint WHEN requested THEN returns ok response', async () => {
        const pingResponse = await sendRequest(spammerPort, 'GET', 'ping');
        expect(pingResponse.status).toEqual(200);
    });

    it('Test post connect endpoint WHEN no socket_address THEN returns bad response', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect');
        expect(response.status).toEqual(400);
    });

    it('Test post connect endpoint WHEN leader already connected THEN returns bad response', async () => {
        await spammerFollowerInstance.connectedLeaders.addLeader('my.host:1234', 'v1');

        const response = await sendRequest(spammerPort, 'POST', 'v1/connect', {
            socket_address: 'my.host:1234',
        });

        expect(response.status).toEqual(400);
    });

    it('Test post connect endpoint WHEN valid THEN returns ok response and add to list', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect', {
            socket_address: 'my.host:1234',
        });

        expect(response.status).toEqual(200);

        const leader = spammerFollowerInstance.connectedLeaders.getLeader(leaderUuid);
        expect(leader.uuid).toEqual(leaderUuid);
        expect(leader.version).toEqual('v1');
        expect(leader.socketAddress).toEqual('my.host:1234');
    });

    it('Test delete leader endpoint WHEN valid THEN returns ok response and leader is removed from connected leaders', async () => {
        await spammerFollowerInstance.connectedLeaders.addLeader('my.host:1234', 'v1');

        const response = await sendRequest(spammerPort, 'DELETE', `v1/leader/${leaderUuid}`);

        expect(response.status).toEqual(200);
    });

    it('Test delete leader endpoint WHEN uuid does not exist THEN returns bad response', async () => {
        const response = await sendRequest(spammerPort, 'DELETE', 'v1/leader/some-uuid');

        expect(response.status).toEqual(400);
    });
});
