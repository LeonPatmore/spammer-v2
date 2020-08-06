const axios = require('axios').default;

/**
 * Send a HTTP request.
 * @param {number} port     The port to send the request to.
 * @param {String} method   The method, for example POST.
 * @param {String} path     The path of the request.
 * @param {object} body     The body of the request.
 */
function sendRequest(port, method, path, body, headers) {
    return axios.request({
        method: method,
        headers: headers,
        url: `http://127.0.0.1:${port}/${path}`,
        data: body,
        validateStatus: null,
    });
}

module.exports = sendRequest;
