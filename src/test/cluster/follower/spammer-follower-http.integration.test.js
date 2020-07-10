/**
 * @jest-environment node
 */

const SpammerFollowerHttp = require('../../../cluster/follower/spammer-follower-http');
const sendRequest = require('../../test-http-client');

const spammerPort = 7893;

describe('API Tests', () => {
    let spammerFollowerInstance;

    beforeEach(() => {
        spammerFollowerInstance = new SpammerFollowerHttp('localhost', spammerPort);
    });

    afterEach(() => {
        spammerFollowerInstance.close();
    });

    it('Test ping endpoint WHEN requested THEN returns ok response', async () => {
        const pingResponse = await sendRequest(spammerPort, 'GET', 'ping');
        expect(pingResponse.status).toEqual(200);
    });

    it('Test get run endpoint WHEN no test runnnig THEN returns ok', async () => {
        const response = await sendRequest(spammerPort, 'GET', 'v1/run');
        expect(response.status).toEqual(404);
    });

    it('Test get run endpoint WHEN test runnnig THEN returns not found', async () => {
        spammerFollowerInstance.performanceRunId = 'some-id';
        const response = await sendRequest(spammerPort, 'GET', 'v1/run');
        expect(response.status).toEqual(200);
    });

    it('Test post run endpoint WHEN no test running THEN returns ok', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/run', { run_id: 'some-id' });
        expect(response.status).toEqual(200);
    });

    it('Test post run endpoint WHEN no run id param given THEN returns bad', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/run', { runId: 'some-id' });
        expect(response.status).toEqual(400);
    });

    it('Test post connect endpoint WHEN requests THEN returns ok response with uuid', async () => {
        const response = await sendRequest(spammerPort, 'POST', 'v1/connect');
        expect(response.status).toEqual(200);
        expect(response.data.uuid).toEqual(spammerFollowerInstance.uuid);
    });
});
