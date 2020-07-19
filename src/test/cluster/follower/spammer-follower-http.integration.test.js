/**
 * @jest-environment node
 */

const SpammerFollowerHttp = require('../../../cluster/follower/spammer-follower-http');
const sendRequest = require('../../test-http-client');
const spammerLeaderClients = require('../../../cluster/follower/leader-clients/spammer-leader-client');
jest.mock('../../../cluster/follower/leader-clients/spammer-leader-client');

spammerLeaderClients.v1.updateLeader.mockImplementation(() => {
    return {
        jobs: [],
        uuid: 'leader-id',
    };
});

const spammerPort = 5634;

describe('API Tests', () => {
    let spammerFollowerInstance;

    beforeEach(() => {
        spammerFollowerInstance = new SpammerFollowerHttp('127.0.0.1', spammerPort);
    });

    afterEach(() => {
        spammerFollowerInstance.close();
    });

    it('Test ping endpoint WHEN requested THEN returns ok response', async () => {
        const pingResponse = await sendRequest(spammerPort, 'GET', 'ping');
        expect(pingResponse.status).toEqual(200);
    });

    it('Test post connect endpoint WHEN no socket_address THEN returns bad response', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect');
        expect(response.status).toEqual(400);
    });

    it('Test post connect endpoint WHEN leader already connected THEN returns bad response', async () => {
        spammerFollowerInstance.leaders.set('leader-id', {});

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

        expect(spammerFollowerInstance.leaders.has('leader-id')).toBeTruthy();
        expect(spammerFollowerInstance.leaders.get('leader-id').uuid).toEqual('leader-id');
        expect(spammerFollowerInstance.leaders.get('leader-id').version).toEqual('v1');
        expect(spammerFollowerInstance.leaders.get('leader-id').socketAddress).toEqual('my.host:1234');
    });
});