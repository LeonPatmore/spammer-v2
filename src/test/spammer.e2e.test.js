/**
 * @jest-environment node
 */

const axios = require('axios').default;

let spammer;

afterEach(() => {
    spammer.closeServer();
});

function sendRequest(method, path, body) {
    return axios.request({ method: method, url: `http://localhost:5435/${path}`, data: body, validateStatus: null });
}

it('Ensure link API works as expected', async () => {
    spammer = require('../spammer');

    const clientUuid = 'uuid';

    // Assert: Original request to connect responds with 200.
    const initialResponse = await sendRequest('POST', 'v1/connect', {
        uuid: clientUuid,
        socket_address: '0.0.0.0:5435',
    });
    expect(initialResponse.status).toEqual(200);

    // Assert: Second request responds with 400.
    const secondResponse = await sendRequest('POST', 'v1/connect', {
        uuid: clientUuid,
        socket_address: '0.0.0.0:5435',
    });
    expect(secondResponse.status).toEqual(400);
});
