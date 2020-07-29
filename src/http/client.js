const axios = require('axios');

axios.interceptors.request.use(
    function(config) {
        config.metadata = { startTime: new Date() };
        return config;
    },
    function(error) {
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    function(response) {
        response.config.metadata.endTime = new Date();
        response.duration = response.config.metadata.endTime - response.config.metadata.startTime;
        return response;
    },
    function(error) {
        error.config.metadata.endTime = new Date();
        error.duration = error.config.metadata.endTime - error.config.metadata.startTime;
        return Promise.reject(error);
    }
);

let instance = null;

class HttpClient {
    async request(method, url, body) {
        return axios({
            method: method,
            url: url,
            data: body,
            validateStatus: null,
        }).then(res => {
            return this._responseInStandardFormat(res);
        });
    }

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
        return { code: res.status, body: res.data, headers: res.headers, responseTimeMs: res.duration };
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
