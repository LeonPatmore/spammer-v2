const axios = require('axios').default;
const sleep = require('../utils/sleep');

let spammer;

afterEach(() => {
    spammer.closeServer();
});

/**
 * Send a get request to the spammer with the given path.
 * @param {String} path Path of the spammer.
 */
function sendGetRequest(path) {
    return axios.get(`http://localhost:5435/${path}`, { validateStatus: null });
}

/**
 *
 * @param {*} method
 * @param {*} path
 * @param {*} body
 */
function sendRequest(method, path, body) {
    return axios.request({ method: method, url: `http://localhost:5435/${path}`, data: body, validateStatus: null });
}

it('Ensure link API works as expected', async () => {
    spammer = require('../spammer');

    // Assert: Original request to link responds with 404.
    const getResponse = await sendGetRequest('link');
    expect(getResponse.status).toEqual(404);

    // Assert: First link returns 200.
    const postResponse = await sendRequest('post', 'link', { host_id: 'some-id' });
    expect(postResponse.status).toEqual(200);

    // Assert: Second link returns 200.
    const secondPostResponse = await sendRequest('post', 'link', { host_id: 'some-id' });
    expect(secondPostResponse.status).toEqual(400);

    // Assert: Get request to link responds with correct host id.
    const secondGetResponse = await sendGetRequest('link');
    expect(secondGetResponse.status).toEqual(200);
    expect(secondGetResponse.data.host_id).toEqual('some-id');
});
