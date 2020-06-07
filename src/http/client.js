const axios = require('axios');

class HttpClient {
    async get(url, responseHandler) {
        return axios({
            method: 'get',
            url: url,
        }).then(res => {
            return this.responseInStandardFormat(res);
        });
    }
    async post(url, body, responseHandler) {
        return axios({
            method: 'post',
            url: url,
            data: body,
        }).then(res => {
            return this.responseInStandardFormat(res);
        });
    }
    responseInStandardFormat(res) {
        return { code: res.status, body: res.data, headers: res.headers };
    }
}

module.exports = HttpClient;
