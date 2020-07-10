/**
 * @jest-environment node
 */

const SpammerLeaderHttp = require('../../../cluster/leader/spammer-leader-http');
const sendRequest = require('../../test-http-client');
const spammerFollowerClients = require('../../../cluster/leader/follower-clients/spammer-follower-clients');
jest.mock('../../../cluster/leader/follower-clients/spammer-follower-clients');

const spammerPort = 23334;

describe('API Tests', () => {
    let spammerLeaderInstance;

    beforeEach(() => {
        spammerLeaderInstance = new SpammerLeaderHttp('0.0.0.0', spammerPort);
        spammerFollowerClients.v1.runningPerformanceRun.mockReturnValue(false);
        spammerFollowerClients.v1.connectToFollower.mockReturnValue('follower-id');
    });

    afterEach(() => {
        spammerLeaderInstance.close();
    });

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

    it('Test post client WHEN there is no socket address in requet body THEN bad response', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect');
        expect(response.status).toEqual(400);
    });

    it('Test post client WHEN valid request THEN ok response', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect', {
            socket_address: 'localhost:1234',
        });
        expect(response.status).toEqual(200);
    });

    it('Test start test WHEN no clients THEN bad response', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/performance');
        expect(response.status).toEqual(400);
    });

    it('Test start test WHEN more than one client THEN ok response', async () => {
        spammerLeaderInstance.connectedFollowers.set('uuid', {
            uuid: 'uuid',
            socketAddress: 'socketAddress',
            version: 'v1',
        });

        const response = await sendRequest(spammerPort, 'POST', 'v1/performance');
        expect(response.status).toEqual(200);
    });
});
