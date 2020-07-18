const axios = require('axios');

let instance = null;

class HttpClient {
    async get(url) {
        return axios({
            method: 'get',
            url: url,
            validateStatus: null,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    async post(url, body) {
        return axios({
            method: 'post',
            url: url,
            data: body,
            validateStatus: null,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    async put(url, body) {
        return axios({
            method: 'put',
            url: url,
            data: body,
            validateStatus: null,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    async delete(url, body) {
        return axios({
            method: 'delete',
            url: url,
            data: body,
            validateStatus: null,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

    /**
     * The HTTP response in a standard format.
     * @param {Object} res  The response from the axios request.
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
