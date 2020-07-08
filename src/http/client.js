const axios = require('axios');

let instance = null;

class HttpClient {
    async get(url) {
        return axios({
            method: 'get',
            url: url,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    async post(url, body) {
        return axios({
            method: 'post',
            url: url,
            data: body,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    /**
     * The HTTP response in a standard format.
     * @param {Object} res
     */
    _responseInStandardFormat(res) {
        return { code: res.status, body: res.data, headers: res.headers };
    }

    /**
     * @returns {HttpClient}
     */
    static getInstance() {
        if (!instance) {
            instance = new HttpClient();
        }
        return instance;
    }
}

module.exports = HttpClient;
